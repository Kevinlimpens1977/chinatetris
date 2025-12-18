import { supabase } from './supabase';

export const getCredits = async (userId: string): Promise<number> => {
    console.log(`[getCredits] Input: userId=${userId}`);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('[getCredits] Query Error:', error);
            return 0; // Prevent crash, return 0
        }

        console.log(`[getCredits] Output:`, data);
        return data?.credits || 0;
    } catch (err) {
        console.error('[getCredits] Unexpected Error:', err);
        return 0;
    }
};

export const deductCredit = async (userId: string, currentCredits: number): Promise<boolean> => {
    console.log(`[deductCredit] Input: userId=${userId}, currentCredits=${currentCredits}`);
    // Direct update since SQL function was removed
    if (currentCredits < 1) return false;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ credits: currentCredits - 1 })
            .eq('id', userId);

        if (error) {
            console.error('[deductCredit] Update Error:', error);
            return false;
        }

        console.log('[deductCredit] Success');
        return true;
    } catch (err) {
        console.error('[deductCredit] Unexpected Error:', err);
        return false;
    }
};
