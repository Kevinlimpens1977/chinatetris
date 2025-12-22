import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    Firestore,
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    runTransaction,
    increment,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
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

// Initialize Firebase
try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("🔥 Firebase initialized successfully.");
    } else {
        app = getApps()[0];
        db = getFirestore(app);
        auth = getAuth(app);
    }
} catch (error) {
    console.error("❌ Firebase failed to initialize:", error);
}

/**
 * Firestore Data Model:
 * - users/{uid}: Per-user persistent state (credits, highscore)
 * - tickets/{ticketId}: Ticket ownership (using ticketId as doc ID for uniqueness)
 * - highscores/{autoId}: Append-only global leaderboard
 */
export const firebaseService = {
    isEnabled: () => !!db,

    /**
     * Get current authenticated user's UID
     * Returns null if not authenticated
     */
    getCurrentUid(): string | null {
        return auth?.currentUser?.uid || null;
    },

    // ==================== USERS COLLECTION ====================

    /**
     * Ensure users/{uid} document exists with default values
     * Creates if missing, otherwise leaves existing data intact
     */
    async ensureUserDocument(uid: string, email: string, displayName: string): Promise<boolean> {
        if (!db) {
            console.error("ensureUserDocument: Firestore not available");
            return false;
        }
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email,
                    displayName,
                    credits: 0,
                    highscore: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log(`✅ Created user document for ${uid}`);
            }
            return true;
        } catch (e) {
            console.error("Error in ensureUserDocument:", e);
            return false;
        }
    },

    /**
     * Get user data from users/{uid}
     */
    async getUserData(uid: string): Promise<{
        email: string;
        displayName: string;
        credits: number;
        highscore: number;
    } | null> {
        if (!db) {
            console.error("getUserData: Firestore not available");
            return null;
        }
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                return {
                    email: data.email || '',
                    displayName: data.displayName || 'Speler',
                    credits: data.credits || 0,
                    highscore: data.highscore || 0
                };
            }
            return null;
        } catch (e) {
            console.error("Error in getUserData:", e);
            return null;
        }
    },

    /**
     * Update user's highscore ONLY if new score is higher
     * Uses setDoc with merge:true for safe writes
     */
    async updateUserHighscoreIfHigher(uid: string, newScore: number): Promise<boolean> {
        console.log(`🔍 updateUserHighscoreIfHigher START - uid: ${uid}, newScore: ${newScore}`);

        if (!db) {
            console.error("❌ updateUserHighscoreIfHigher: Firestore not available");
            return false;
        }

        if (!uid) {
            console.error("❌ updateUserHighscoreIfHigher: uid is null/undefined");
            return false;
        }

        if (typeof newScore !== 'number' || isNaN(newScore)) {
            console.error(`❌ updateUserHighscoreIfHigher: invalid score value: ${newScore}`);
            return false;
        }

        try {
            // Step 1: Read current highscore from Firestore
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            const currentHighscore = userSnap.exists() ? (userSnap.data().highscore || 0) : 0;
            console.log(`📊 Current highscore in Firestore: ${currentHighscore}, New score: ${newScore}`);

            // Step 2: if newScore > existing highscore: write new highscore, else do nothing
            if (newScore > currentHighscore) {
                console.log(`🏆 New score ${newScore} > current ${currentHighscore} - WRITING...`);

                // Use setDoc with merge:true for safe writes
                await setDoc(userRef, {
                    highscore: newScore,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                console.log('[Firestore] user highscore updated:', uid, newScore);
                return true;
            } else {
                console.log(`ℹ️ Score ${newScore} NOT higher than current ${currentHighscore}, no update needed`);
                return false;
            }
        } catch (e) {
            console.error("❌ Error in updateUserHighscoreIfHigher:", e);
            return false;
        }
    },

    // Alias for backward compatibility
    async updateUserHighscore(uid: string, newScore: number): Promise<boolean> {
        return this.updateUserHighscoreIfHigher(uid, newScore);
    },

    /**
     * Record player highscore - uses setDoc with merge:true
     * Fetches existing, computes max, writes back
     */
    async recordPlayer(uid: string, incomingHighscore: number): Promise<boolean> {
        console.log(`[Firestore] recordPlayer called - uid: ${uid}, incomingHighscore: ${incomingHighscore}`);

        if (!db) {
            console.error("[Firestore] recordPlayer: db not available");
            return false;
        }

        if (!uid) {
            console.error("[Firestore] recordPlayer: uid is null/undefined");
            return false;
        }

        try {
            const userRef = doc(db, 'users', uid);

            // Fetch existing highscore
            const userSnap = await getDoc(userRef);
            const existingHighscore = userSnap.exists() ? (userSnap.data().highscore || 0) : 0;

            // Compute new highscore
            const newHighscore = Math.max(existingHighscore, incomingHighscore);

            console.log(`[Firestore] existingHighscore: ${existingHighscore}, incomingHighscore: ${incomingHighscore}, newHighscore: ${newHighscore}`);

            // Write using setDoc with merge:true
            await setDoc(userRef, {
                highscore: newHighscore,
                updatedAt: serverTimestamp()
            }, { merge: true });

            console.log('[Firestore] highscore written', newHighscore);
            return true;
        } catch (e) {
            console.error("[Firestore] recordPlayer error:", e);
            return false;
        }
    },

    /**
     * Update user credits atomically
     * @param delta - positive to add, negative to subtract
     */
    async updateUserCredits(uid: string, delta: number): Promise<boolean> {
        if (!db) {
            console.error("updateUserCredits: Firestore not available");
            return false;
        }
        try {
            const userRef = doc(db, 'users', uid);

            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User document does not exist");
                }

                const currentCredits = userDoc.data().credits || 0;
                const newCredits = currentCredits + delta;

                if (newCredits < 0) {
                    throw new Error("Insufficient credits");
                }

                transaction.update(userRef, {
                    credits: increment(delta),
                    updatedAt: serverTimestamp()
                });
            });
            return true;
        } catch (e) {
            console.error("Error in updateUserCredits:", e);
            return false;
        }
    },

    // ==================== TICKETS COLLECTION ====================

    /**
     * Create a ticket with ticketId as document ID (enforces uniqueness)
     * Returns true if created, false if already exists or error
     */
    async createTicket(ticketId: string, uid: string): Promise<boolean> {
        if (!db) {
            console.error("createTicket: Firestore not available");
            return false;
        }
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            const ticketSnap = await getDoc(ticketRef);

            if (ticketSnap.exists()) {
                console.warn(`Ticket ${ticketId} already exists, skipping`);
                return false;
            }

            await setDoc(ticketRef, {
                uid,
                ticketId,
                status: 'won',
                createdAt: serverTimestamp()
            });
            console.log(`🎫 Created ticket ${ticketId} for user ${uid}`);
            return true;
        } catch (e) {
            console.error("Error in createTicket:", e);
            return false;
        }
    },

    /**
     * Get all tickets owned by a user
     */
    async getUserTickets(uid: string): Promise<Array<{ ticketId: string; status: string }>> {
        if (!db) {
            console.error("getUserTickets: Firestore not available");
            return [];
        }
        try {
            const q = query(
                collection(db, 'tickets'),
                where('uid', '==', uid)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                ticketId: doc.id,
                status: doc.data().status || 'won'
            }));
        } catch (e) {
            console.error("Error in getUserTickets:", e);
            return [];
        }
    },

    /**
     * Get total ticket count in the system (for generating unique IDs)
     */
    async getTotalTicketCount(): Promise<number> {
        if (!db) {
            console.error("getTotalTicketCount: Firestore not available");
            return 0;
        }
        try {
            const querySnapshot = await getDocs(collection(db, 'tickets'));
            return querySnapshot.size;
        } catch (e) {
            console.error("Error in getTotalTicketCount:", e);
            return 0;
        }
    },

    // ==================== HIGHSCORES COLLECTION ====================

    /**
     * Add a new highscore entry (append-only)
     * This ALWAYS runs on every game end - not just personal bests
     */
    async addHighscore(uid: string, displayName: string, score: number): Promise<boolean> {
        console.log(`📝 addHighscore CALLED - uid: ${uid}, displayName: ${displayName}, score: ${score}`);

        if (!db) {
            console.error("❌ addHighscore: Firestore not available");
            return false;
        }

        if (!uid || !displayName || typeof score !== 'number') {
            console.error(`❌ addHighscore: Invalid parameters - uid: ${uid}, displayName: ${displayName}, score: ${score}`);
            return false;
        }

        try {
            const docRef = await addDoc(collection(db, 'highscores'), {
                uid,
                displayName,
                score,
                createdAt: serverTimestamp()
            });
            console.log(`✅ addHighscore SUCCESS - Document ID: ${docRef.id}`);
            console.log('[Firestore] highscore added:', uid, score);
            return true;
        } catch (e) {
            console.error("❌ Error in addHighscore:", e);
            return false;
        }
    },

    /**
     * Get top highscores for leaderboard
     */
    async getTopHighscores(max: number = 5): Promise<Array<{ displayName: string; score: number }>> {
        if (!db) {
            console.error("getTopHighscores: Firestore not available");
            return [];
        }
        try {
            const q = query(
                collection(db, 'highscores'),
                orderBy('score', 'desc'),
                orderBy('createdAt', 'desc'),
                limit(max)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                // Return exact displayName from document - no fallback substitution
                displayName: doc.data().displayName,
                score: doc.data().score || 0
            }));
        } catch (e) {
            console.error("Error in getTopHighscores:", e);
            return [];
        }
    },

    // ==================== CREDITS MANAGEMENT ====================

    /**
     * Get user's current credits
     */
    async getUserCredits(uid: string): Promise<number> {
        if (!db) {
            console.error("getUserCredits: Firestore not available");
            return 0;
        }
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return userSnap.data().credits || 0;
            }
            return 0;
        } catch (e) {
            console.error("Error in getUserCredits:", e);
            return 0;
        }
    },

    /**
     * Add credits to user (called after successful Stripe payment)
     * @param creditsToAdd - number of credits to add (positive number)
     */
    async addUserCredits(uid: string, creditsToAdd: number): Promise<boolean> {
        if (!db) {
            console.error("addUserCredits: Firestore not available");
            return false;
        }
        if (creditsToAdd <= 0) {
            console.error("addUserCredits: creditsToAdd must be positive");
            return false;
        }
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                credits: increment(creditsToAdd),
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log(`💰 Added ${creditsToAdd} credits to user ${uid}`);
            return true;
        } catch (e) {
            console.error("Error in addUserCredits:", e);
            return false;
        }
    },

    /**
     * Deduct one credit from user (called after game ends)
     */
    async deductOneCredit(uid: string): Promise<boolean> {
        if (!db) {
            console.error("deductOneCredit: Firestore not available");
            return false;
        }
        try {
            const userRef = doc(db, 'users', uid);

            // Use transaction to ensure we don't go negative
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User document does not exist");
                }

                const currentCredits = userDoc.data().credits || 0;
                if (currentCredits <= 0) {
                    throw new Error("No credits to deduct");
                }

                transaction.update(userRef, {
                    credits: increment(-1),
                    updatedAt: serverTimestamp()
                });
            });

            console.log(`🎮 Deducted 1 credit from user ${uid}`);
            return true;
        } catch (e) {
            console.error("Error in deductOneCredit:", e);
            return false;
        }
    },

    // ==================== TRANSACTIONS COLLECTION ====================

    /**
     * Create a pending transaction record
     */
    async createTransaction(
        uid: string,
        stripeSessionId: string,
        packageId: string,
        credits: number,
        amountCents: number
    ): Promise<string | null> {
        if (!db) {
            console.error("createTransaction: Firestore not available");
            return null;
        }
        try {
            const docRef = await addDoc(collection(db, 'transactions'), {
                uid,
                stripeSessionId,
                packageId,
                credits,
                amountCents,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            console.log(`📝 Created transaction ${docRef.id} for user ${uid}`);
            return docRef.id;
        } catch (e) {
            console.error("Error in createTransaction:", e);
            return null;
        }
    },

    /**
     * Complete a transaction and add credits
     */
    async completeTransaction(stripeSessionId: string): Promise<boolean> {
        if (!db) {
            console.error("completeTransaction: Firestore not available");
            return false;
        }
        try {
            // Find transaction by stripeSessionId
            const q = query(
                collection(db, 'transactions'),
                where('stripeSessionId', '==', stripeSessionId),
                where('status', '==', 'pending')
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.warn(`No pending transaction found for session ${stripeSessionId}`);
                return false;
            }

            const transactionDoc = querySnapshot.docs[0];
            const transactionData = transactionDoc.data();

            // Add credits to user
            const creditsAdded = await this.addUserCredits(transactionData.uid, transactionData.credits);
            if (!creditsAdded) {
                console.error("Failed to add credits for transaction");
                return false;
            }

            // Update transaction status
            await setDoc(doc(db, 'transactions', transactionDoc.id), {
                status: 'completed',
                completedAt: serverTimestamp()
            }, { merge: true });

            console.log(`✅ Completed transaction ${transactionDoc.id}`);
            return true;
        } catch (e) {
            console.error("Error in completeTransaction:", e);
            return false;
        }
    }
};

export { db, auth };

