import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// User provided config
const firebaseConfig = {
    apiKey: "AIzaSyD2uDvmRIe0pgMNNZlTWPUkp6PDyYEOTko",
    authDomain: "chinatetris-c5706.firebaseapp.com",
    projectId: "chinatetris-c5706",
    storageBucket: "chinatetris-c5706.firebasestorage.app",
    messagingSenderId: "1092547471184",
    appId: "1:1092547471184:web:88be6f9117568563b06e55"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        console.log("🔥 Firebase initialized successfully.");
    } else {
        app = getApps()[0];
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
    }
} catch (error) {
    console.warn("⚠️ Firebase failed to initialize:", error);
}

const isFirebaseEnabled = !!db && !!auth;

/**
 * Data abstraction with graceful fallback to localStorage logic
 */
export const firebaseService = {
    isEnabled: () => isFirebaseEnabled && !!db,

    // Players / Highscores (Mapping china_players to 'players' collection)
    async recordPlayer(player: { id: string; name: string; city: string; highscore: number; email: string }) {
        if (!db) {
            console.log("[Firebase Mock] would record player/highscore:", player);
            return null;
        }
        try {
            const { runTransaction, doc } = await import('firebase/firestore');
            const playerRef = doc(db, 'players', player.id);

            await runTransaction(db, async (transaction) => {
                const playerDoc = await transaction.get(playerRef);
                const currentData = playerDoc.data();
                const existingHighscore = currentData?.highscore || 0;

                // Only update if it's a new player OR the new score is higher
                if (!playerDoc.exists() || player.highscore > existingHighscore) {
                    transaction.set(playerRef, {
                        ...player,
                        last_played: Timestamp.now()
                    }, { merge: true });
                } else {
                    // Just update last_played even if not a new highscore
                    transaction.update(playerRef, {
                        last_played: Timestamp.now()
                    });
                }
            });
            return true;
        } catch (e) {
            console.error("Error recording player to Firebase:", e);
            return null;
        }
    },

    async getPlayer(userId: string) {
        if (!db) return null;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const docSnap = await getDoc(doc(db, 'players', userId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error fetching player from Firebase:", e);
            return null;
        }
    },

    async getTopScores(max: number = 5) {
        if (!db) return [];
        try {
            const q = query(
                collection(db, 'players'), // Mapping for china_players
                orderBy('highscore', 'desc'),
                limit(max)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error("Error fetching scores from Firebase:", e);
            return [];
        }
    },

    // Tickets (Mapping china_issued_tickets to 'tickets' collection)
    async addTicket(ticket: { user_id: string; email: string; ticket_name: string }) {
        if (!db) {
            console.log("[Firebase Mock] would add ticket:", ticket.ticket_name);
            return null;
        }
        try {
            // Using collection 'tickets' as mapping for china_issued_tickets
            return await addDoc(collection(db, 'tickets'), {
                ...ticket,
                timestamp: Timestamp.now()
            });
        } catch (e) {
            console.error("Error adding ticket to Firebase:", e);
            return null;
        }
    },

    async getUserTickets(userId: string) {
        if (!db) return [];
        try {
            const q = query(
                collection(db, 'tickets'),
                where('user_id', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error("Error fetching tickets from Firebase:", e);
            return [];
        }
    },

    // Game Sessions (Mapping china_game_plays to 'game_sessions' collection)
    async recordSession(session: { user_id: string; score: number; tickets_earned: number }) {
        if (!db) {
            console.log("[Firebase Mock] would record session:", session);
            return null;
        }
        try {
            // Using collection 'game_sessions' as mapping for china_game_plays
            return await addDoc(collection(db, 'game_sessions'), {
                ...session,
                timestamp: Timestamp.now()
            });
        } catch (e) {
            console.error("Error recording session to Firebase:", e);
            return null;
        }
    }
};

export { db, auth, storage };
