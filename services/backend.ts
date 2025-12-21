import { firebaseService } from './firebase';
import { authService } from './authService';

// Types for local storage data
export interface Player {
    id: string;
    email: string;
    name: string;
    city: string;
    highscore: number;
    bonus_tickets: number;
    last_played: string;
    is_verified: boolean;
}

// Helper to get or create a stable local player ID
const getLocalPlayerId = (): string => {
    let id = localStorage.getItem('chinatetris_local_id');
    if (!id) {
        id = `local_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem('chinatetris_local_id', id);
    }
    return id;
};

// Stable Anonymous Identity
export const getAnonymousUser = () => ({
    id: getLocalPlayerId(),
    email: 'local_player@tetris.internal',
    user_metadata: {
        name: 'Speler',
        city: 'Lokaal'
    },
    email_confirmed_at: new Date().toISOString()
});

// Helper to get active user ID and metadata
export const getActiveUser = () => {
    const fbUser = authService.getCurrentUser();
    if (fbUser) {
        return {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Speler',
            city: 'Tempel'
        };
    }

    const anon = getAnonymousUser();
    return {
        id: anon.id,
        email: anon.email,
        name: anon.user_metadata.name,
        city: anon.user_metadata.city
    };
};

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

export const getUserStats = async () => {
    const user = getActiveUser();

    // Primary: Firestore
    if (firebaseService.isEnabled()) {
        const fireTickets = await firebaseService.getUserTickets(user.id);
        const playerRecord = await firebaseService.getPlayer(user.id) as any;

        if (fireTickets.length > 0 || playerRecord) {
            return {
                highscore: playerRecord?.highscore || 0,
                tickets: fireTickets.length,
                ticketNames: fireTickets.map((t: any) => t.ticket_name)
            };
        }
    }

    // Fallback: Local Storage (Legacy)
    const localTickets = JSON.parse(localStorage.getItem('chinatetris_issued_tickets') || '[]');
    const userTickets = localTickets.filter((t: any) => t.user_id === user.id);
    const localPlayers = JSON.parse(localStorage.getItem('chinatetris_players') || '[]');
    const playerStats = localPlayers.find((p: any) => p.id === user.id);

    return {
        highscore: playerStats?.highscore || 0,
        tickets: userTickets.length,
        ticketNames: userTickets.map((t: any) => t.ticket_name)
    };
};

export const issueTickets = async (userId: string, email: string, count: number) => {
    if (count <= 0) return;

    // 1. Determine starting index based on total existing tickets (for deterministic IDs)
    const stats = await getUserStats();
    const startIdx = stats.tickets;

    const localTickets = JSON.parse(localStorage.getItem('chinatetris_issued_tickets') || '[]');

    for (let i = 0; i < count; i++) {
        const ticketData = {
            user_id: userId,
            email: email,
            ticket_name: generateTicketId(startIdx + i),
            created_at: new Date().toISOString()
        };

        // 2. Local Save (Cache)
        localTickets.push(ticketData);

        // 3. Firestore Map (Collection 'tickets')
        firebaseService.addTicket(ticketData);
    }
    localStorage.setItem('chinatetris_issued_tickets', JSON.stringify(localTickets));
};

export const submitScore = async (score: number, bonusTickets: number) => {
    const user = getActiveUser();
    const displayName = user.name || 'Speler';

    // 1. Local Update (Cache)
    const localPlayers = JSON.parse(localStorage.getItem('chinatetris_players') || '[]');
    let pIdx = localPlayers.findIndex((p: any) => p.id === user.id);
    const oldHighscore = pIdx >= 0 ? localPlayers[pIdx].highscore : 0;

    const playerData = {
        id: user.id,
        email: user.email,
        name: displayName,
        city: user.city || 'Lokaal',
        highscore: Math.max(oldHighscore, score),
        last_played: new Date().toISOString()
    };

    if (pIdx >= 0) localPlayers[pIdx] = playerData;
    else localPlayers.push(playerData);
    localStorage.setItem('chinatetris_players', JSON.stringify(localPlayers));

    // 2. Firestore Collection Mapping
    firebaseService.recordPlayer(playerData);

    // 3. Record session
    firebaseService.recordSession({
        user_id: user.id,
        score,
        tickets_earned: bonusTickets
    });

    // 4. Issue tickets
    if (bonusTickets > 0) {
        await issueTickets(user.id, user.email, bonusTickets);
    }
};

export const getLeaderboard = async () => {
    // 1. Firestore Primary
    if (firebaseService.isEnabled()) {
        const topScores = await firebaseService.getTopScores(5);
        if (topScores.length > 0) {
            return topScores.map((s: any) => ({
                name: s.name,
                city: s.city,
                highscore: s.highscore
            }));
        }
    }

    // 2. Local Fallback
    const localPlayers = JSON.parse(localStorage.getItem('chinatetris_players') || '[]');
    const sorted = [...localPlayers].sort((a, b) => b.highscore - a.highscore).slice(0, 5);

    return sorted.map((entry: any) => ({
        name: entry.name,
        city: entry.city,
        highscore: entry.highscore
    }));
};
