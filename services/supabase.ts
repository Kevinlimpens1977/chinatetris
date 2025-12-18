
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

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

export const submitScore = async (score: number, bonusTickets: number) => {
    console.log(`[submitScore] Input: score=${score}, bonusTickets=${bonusTickets}`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
        console.warn('[submitScore] No authenticated user found.');
        return;
    }

    // Get metadata safely
    const { name, city } = user.user_metadata;

    // Anonymize certain usernames - replace with 'inlog_speler' if name contains restricted keywords
    const rawName = (name || 'Player').toLowerCase();
    const restrictedKeywords = ['sas', 'saskia', 'wierts'];
    const isRestricted = restrictedKeywords.some(keyword => rawName.includes(keyword));
    const displayName = isRestricted ? 'inlog_speler' : (name || 'Player');

    // 1. Update Highscore & Tickets (Global Leaderboard)
    console.log('[submitScore] Calling update_china_highscore RPC...');
    const { error: hsError } = await supabase.rpc('update_china_highscore', {
        p_email: user.email,
        p_name: displayName,
        p_city: city || 'Onbekend',
        p_score: score,
        p_tickets: bonusTickets
    });

    if (hsError) {
        console.error('[submitScore] Error updating highscore:', hsError);
    } else {
        console.log('[submitScore] Highscore updated successfully.');
    }

    // 2. Record specific game play
    console.log('[submitScore] Inserting game play stats...');
    const { error: playError } = await supabase
        .from('china_game_plays')
        .insert({
            user_id: user.id,
            email: user.email,
            score: score,
            tickets_earned: bonusTickets,
            played_at: new Date().toISOString()
        });

    if (playError) {
        console.warn('[submitScore] Could not save game play stats:', playError);
    } else {
        console.log('[submitScore] Game play stats saved.');
    }
};

export const getLeaderboard = async () => {
    console.log('[getLeaderboard] Fetching leaderboard...');
    try {
        const { data, error } = await supabase
            .from('china_players')
            .select('name, city, highscore, lottery_tickets')
            .order('highscore', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[getLeaderboard] Error fetching leaderboard:', error);
            return [];
        }

        if (!data) return [];
        console.log(`[getLeaderboard] Fetched ${data.length} entries.`);

        // Filter unique names (keep highest score per name)
        const seenNames = new Set();
        const uniqueLeaderboard = [];

        for (const entry of data) {
            if (!seenNames.has(entry.name)) {
                seenNames.add(entry.name);
                uniqueLeaderboard.push(entry);
            }
        }
        return uniqueLeaderboard;
    } catch (err) {
        console.error('[getLeaderboard] Unexpected Error:', err);
        return [];
    }
};

export const ensurePlayerVerified = async (email: string) => {
    // In the new system, we trust the auth verification for now
};
