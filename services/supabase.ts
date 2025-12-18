
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
    bonus_tickets: number; // For TitleScreen display
    last_played: string;
    is_verified: boolean;
}

const generateTicketId = (index: number): string => {
    // index starts at 0
    // Ticket_A_100 to 999 (900 tickets)
    // Then Ticket_B_101 to 999...
    const batchSizeA = 900;
    if (index < batchSizeA) {
        const itemIndex = index + 100;
        return `Ticket_A_${itemIndex}`;
    }

    const indexAfterA = index - batchSizeA;
    const batchSizeOther = 899; // 101 to 999
    const batchIndex = Math.floor(indexAfterA / batchSizeOther) + 1; // 1 is 'B'
    const itemIndex = (indexAfterA % batchSizeOther) + 101;

    const batchLetter = String.fromCharCode(65 + batchIndex);
    return `Ticket_${batchLetter}_${itemIndex}`;
};

export const getUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('china_players')
        .select('highscore, lottery_tickets')
        .eq('email', user.email)
        .maybeSingle();

    if (error) {
        console.error('[getUserStats] Error:', error);
        return null;
    }

    return {
        highscore: data?.highscore || 0,
        tickets: data?.lottery_tickets || 0
    };
};

export const issueTickets = async (userId: string, email: string, count: number) => {
    if (count <= 0) return;

    try {
        // Get current total tickets across all users to determine names
        const { count: totalTickets, error: countError } = await supabase
            .from('china_issued_tickets')
            .select('*', { count: 'exact', head: true });

        if (countError && countError.code !== 'PGRST116') {
            console.error('[issueTickets] Count Error:', countError);
        }

        const startIdx = totalTickets || 0;
        const newTickets = [];

        for (let i = 0; i < count; i++) {
            newTickets.push({
                user_id: userId,
                email: email,
                ticket_name: generateTicketId(startIdx + i)
            });
        }

        const { error: insertError } = await supabase
            .from('china_issued_tickets')
            .insert(newTickets);

        if (insertError) {
            console.error('[issueTickets] Insert Error:', insertError);
        }
    } catch (err) {
        console.error('[issueTickets] Unexpected Error:', err);
    }
};

export const submitScore = async (score: number, bonusTickets: number) => {
    console.log(`[submitScore] Input: score=${score}, bonusTickets=${bonusTickets}`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
        console.warn('[submitScore] No authenticated user found.');
        return;
    }

    // Get metadata safely
    const { name, city } = user.user_metadata;

    // Anonymize certain usernames
    const rawName = (name || 'Player').toLowerCase();
    const restrictedKeywords = ['sas', 'saskia', 'wierts'];
    const isRestricted = restrictedKeywords.some(keyword => rawName.includes(keyword));
    const displayName = isRestricted ? 'inlog_speler' : (name || 'Player');

    // 1. Update Highscore & Tickets (Global Leaderboard / china_players)
    try {
        console.log(`[submitScore] Upserting to china_players for ${user.email}...`);

        // Fetch current stats to accumulate tickets correctly
        const { data: currentPlayer, error: fetchError } = await supabase
            .from('china_players')
            .select('highscore, lottery_tickets')
            .eq('email', user.email)
            .maybeSingle();

        if (fetchError) console.warn('[submitScore] Fetch error:', fetchError);

        const oldHighscore = currentPlayer?.highscore || 0;
        const oldTickets = currentPlayer?.lottery_tickets || 0;

        const { error: upsertError } = await supabase
            .from('china_players')
            .upsert({
                email: user.email,
                name: displayName,
                city: city || 'Onbekend',
                highscore: Math.max(oldHighscore, score),
                lottery_tickets: oldTickets + bonusTickets,
                last_played: new Date().toISOString()
            }, {
                onConflict: 'email'
            });

        if (upsertError) {
            console.error('[submitScore] Upsert Error:', upsertError);
            // Fallback RPC
            const { error: rpcError } = await supabase.rpc('update_china_highscore', {
                p_email: user.email,
                p_name: displayName,
                p_city: city || 'Onbekend',
                p_score: score,
                p_tickets: bonusTickets
            });
            if (rpcError) console.error('[submitScore] RPC Fallback Error:', rpcError);
        } else {
            console.log('[submitScore] Successfully updated china_players.');
        }
    } catch (err) {
        console.error('[submitScore] Unexpected error during highscore submission:', err);
    }

    // 1b. Issue individual tickets in the database with names
    if (bonusTickets > 0) {
        await issueTickets(user.id, user.email, bonusTickets);
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
            .limit(5);

        if (error) {
            console.error('[getLeaderboard] Error fetching leaderboard:', error);
            return [];
        }

        console.log(`[getLeaderboard] Data received:`, data);

        // Map database fields to application interface
        return (data || []).map(entry => ({
            name: entry.name,
            city: entry.city,
            highscore: entry.highscore,
            bonusTickets: entry.lottery_tickets
        }));
    } catch (err) {
        console.error('[getLeaderboard] Unexpected Error:', err);
        return [];
    }
};

export const ensurePlayerVerified = async (email: string) => {
    // In the new system, we trust the auth verification for now
};
