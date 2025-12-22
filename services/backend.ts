import { firebaseService } from './firebase';
import { getCurrentUid } from './authService';

/**
 * Backend service for ChinaTetris
 * All operations require an authenticated Firebase user (uid)
 * Data is persisted exclusively to Firebase Firestore
 */

// Ticket ID generator - maintains existing deterministic format
const generateTicketId = (index: number): string => {
    const batchSizeA = 900;
    if (index < batchSizeA) {
        const itemIndex = index + 100;
        return `Ticket_A_${itemIndex}`;
    }
    const indexAfterA = index - batchSizeA;
    const batchSizeOther = 899;
    const batchIndex = Math.floor(indexAfterA / batchSizeOther) + 1;
    const itemIndex = (indexAfterA % batchSizeOther) + 101;
    const batchLetter = String.fromCharCode(65 + batchIndex);
    return `Ticket_${batchLetter}_${itemIndex}`;
};

/**
 * Load complete user data from Firestore
 * DATA SOURCES:
 * - Personal highscore: users/{uid}.highscore
 * - Credits: users/{uid}.credits
 * - Tickets: tickets collection where uid == uid
 */
export const loadUserData = async (uid: string): Promise<{
    credits: number;
    highscore: number;
    tickets: number;
    ticketNames: string[];
} | null> => {
    console.log(`📥 loadUserData - Fetching from users/${uid} and tickets collection`);

    if (!firebaseService.isEnabled()) {
        console.error("loadUserData: Firebase not available");
        return null;
    }

    try {
        // Fetch from Firestore: users/{uid} + tickets where uid matches
        const [userData, userTickets] = await Promise.all([
            firebaseService.getUserData(uid),
            firebaseService.getUserTickets(uid)
        ]);

        const result = {
            credits: userData?.credits || 0,
            highscore: userData?.highscore || 0,
            tickets: userTickets.length,
            ticketNames: userTickets.map(t => t.ticketId)
        };

        console.log(`✅ loadUserData SUCCESS - highscore: ${result.highscore}, credits: ${result.credits}, tickets: ${result.tickets}`);
        return result;
    } catch (e) {
        console.error("Error in loadUserData:", e);
        return null;
    }
};

/**
 * Ensure user document exists (called on first login)
 */
export const ensureUserExists = async (
    uid: string,
    email: string,
    displayName: string
): Promise<boolean> => {
    return firebaseService.ensureUserDocument(uid, email, displayName);
};

/**
 * Issue tickets to a user
 * Generates unique ticket IDs and persists to Firestore
 */
export const issueTickets = async (uid: string, count: number): Promise<string[]> => {
    if (count <= 0) return [];

    if (!firebaseService.isEnabled()) {
        console.error("issueTickets: Firebase not available");
        return [];
    }

    const issuedTickets: string[] = [];

    try {
        // Get current total ticket count for ID generation
        const totalTickets = await firebaseService.getTotalTicketCount();
        let ticketIndex = totalTickets;

        for (let i = 0; i < count; i++) {
            let ticketId = generateTicketId(ticketIndex);
            let created = false;

            // Keep trying until we find an unused ticket ID
            while (!created) {
                created = await firebaseService.createTicket(ticketId, uid);
                if (!created) {
                    // Ticket ID already exists, try next one
                    ticketIndex++;
                    ticketId = generateTicketId(ticketIndex);
                }
            }

            issuedTickets.push(ticketId);
            ticketIndex++;
        }

        console.log(`🎫 Issued ${issuedTickets.length} tickets to ${uid}:`, issuedTickets);
        return issuedTickets;
    } catch (e) {
        console.error("Error in issueTickets:", e);
        return issuedTickets; // Return what we managed to issue
    }
};

/**
 * Submit game result to Firestore
 * - Adds entry to highscores collection (append-only)
 * - Updates user's personal highscore if this is a new best
 * - Issues bonus tickets based on score
 */
export const submitGameResult = async (
    score: number,
    bonusTickets: number,
    uid: string
): Promise<{
    isNewHighscore: boolean;
    ticketsIssued: string[];
}> => {
    // Log at top of function
    console.log('[submitScore] uid=', uid, 'score=', score);

    // HARD FAIL on missing uid
    if (!uid) {
        console.error('[submitScore] missing uid — aborting');
        return { isNewHighscore: false, ticketsIssued: [] };
    }

    // Get displayName from authenticated user - NEVER use defaults
    const { auth } = await import('./firebase');
    let displayName: string | null = null;

    if (auth?.currentUser) {
        if (auth.currentUser.displayName) {
            displayName = auth.currentUser.displayName;
        } else if (auth.currentUser.email) {
            // Use part before @ as fallback
            displayName = auth.currentUser.email.split('@')[0];
        }
    }

    // HARD FAIL if no real displayName
    if (!displayName) {
        console.error('[submitScore] missing displayName — cannot write to highscores');
        return { isNewHighscore: false, ticketsIssued: [] };
    }
    console.log('[submitScore] displayName=', displayName);

    // Validate score
    if (typeof score !== 'number' || score <= 0) {
        console.error('[submitScore] invalid score', score);
        throw new Error('Invalid score passed to submitScore');
    }

    if (!firebaseService.isEnabled()) {
        console.error("submitGameResult: Firebase not available");
        return { isNewHighscore: false, ticketsIssued: [] };
    }

    try {
        // 1. ALWAYS add to global highscores (append-only)
        const highscoreAdded = await firebaseService.addHighscore(uid, displayName, score);
        if (!highscoreAdded) {
            console.error("Failed to add highscore entry");
        } else {
            console.log(`📊 Added highscore entry: ${displayName} - ${score}`);
        }

        // 2. Update user's personal highscore IF this is higher
        // The function handles comparison internally
        const isNewHighscore = await firebaseService.updateUserHighscoreIfHigher(uid, score);

        // 3. Issue bonus tickets
        let ticketsIssued: string[] = [];
        if (bonusTickets > 0) {
            ticketsIssued = await issueTickets(uid, bonusTickets);
        }

        return { isNewHighscore, ticketsIssued };
    } catch (e) {
        console.error("Error in submitGameResult:", e);
        return { isNewHighscore: false, ticketsIssued: [] };
    }
};

/**
 * Get global leaderboard (top scores)
 * DATA SOURCE: highscores collection ordered by score desc, limit 5
 */
export const getLeaderboard = async (): Promise<Array<{
    name: string;
    highscore: number;
}>> => {
    console.log(`📥 getLeaderboard - Fetching top 5 from highscores collection`);

    if (!firebaseService.isEnabled()) {
        console.error("getLeaderboard: Firebase not available");
        return [];
    }

    try {
        const topScores = await firebaseService.getTopHighscores(5);
        const result = topScores.map(s => ({
            name: s.displayName,
            highscore: s.score
        }));

        console.log(`✅ getLeaderboard SUCCESS - ${result.length} entries:`, result.map(r => `${r.name}: ${r.highscore}`));
        return result;
    } catch (e) {
        console.error("Error in getLeaderboard:", e);
        return [];
    }
};

/**
 * Update user credits (atomic operation)
 * @param delta - positive to add, negative to subtract
 */
export const updateCredits = async (uid: string, delta: number): Promise<boolean> => {
    return firebaseService.updateUserCredits(uid, delta);
};

/**
 * ONE-TIME MIGRATION: Backfill displayNames for old highscores
 * For highscores where displayName === "Speler", fetch from auth or users collection
 * Run only in dev mode
 */
export const backfillHighscoreDisplayNames = async (): Promise<void> => {
    if (process.env.NODE_ENV !== 'development') {
        console.log('[Migration] Skipping - not in development mode');
        return;
    }

    console.log('[Migration] Starting highscore displayName backfill...');

    try {
        const { db, auth } = await import('./firebase');
        const { collection, query, where, getDocs, updateDoc, doc, getDoc } = await import('firebase/firestore');

        if (!db) {
            console.error('[Migration] Firestore not available');
            return;
        }

        // Find all highscores with displayName === "Speler"
        const q = query(
            collection(db, 'highscores'),
            where('displayName', '==', 'Speler')
        );

        const snapshot = await getDocs(q);
        console.log(`[Migration] Found ${snapshot.size} highscores with displayName "Speler"`);

        let updated = 0;
        let skipped = 0;

        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const uid = data.uid;

            if (!uid) {
                console.log(`[Migration] Skipping doc ${docSnapshot.id} - no uid`);
                skipped++;
                continue;
            }

            // Try to get displayName from users collection
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            let newDisplayName: string | null = null;

            if (userSnap.exists() && userSnap.data().displayName) {
                newDisplayName = userSnap.data().displayName;
            } else if (auth?.currentUser?.uid === uid) {
                // Fallback to current auth user
                newDisplayName = auth.currentUser.displayName ||
                    (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : null);
            }

            if (newDisplayName && newDisplayName !== 'Speler') {
                await updateDoc(doc(db, 'highscores', docSnapshot.id), {
                    displayName: newDisplayName
                });
                console.log(`[Migration] Updated ${docSnapshot.id}: "Speler" → "${newDisplayName}"`);
                updated++;
            } else {
                console.log(`[Migration] Could not find displayName for uid ${uid}`);
                skipped++;
            }
        }

        console.log(`[Migration] Complete. Updated: ${updated}, Skipped: ${skipped}`);
    } catch (e) {
        console.error('[Migration] Error:', e);
    }
};
