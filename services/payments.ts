import { supabase } from './supabase';

console.log("ENV →", import.meta.env.VITE_SUPABASE_URL);
console.log("ENV SITE →", import.meta.env.VITE_SITE_URL);

export const buyCredits = async (purchaseType: '1credit' | '2credits' | 'pwyw', amount?: number) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Je moet ingelogd zijn om credits te kopen.");

        const body: any = {
            purchase_type: purchaseType,
            user_id: user.id
        };

        if (purchaseType === "pwyw") {
            if (!amount || amount <= 0) {
                throw new Error("Ongeldig bedrag.");
            }
            body.amount_eur = amount;
        }

        // 🟦 DEBUG 1 — environment variabelen
        console.log("ENV CHECK:", {
            SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
            SITE_URL: import.meta.env.VITE_SITE_URL
        });

        // 🟦 DEBUG 2 — body die wordt verstuurd
        console.log("EDGE CALL BODY:", body);

        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: body
        });

        // 🟦 DEBUG 3 — error response
        if (error) {
            console.error("EDGE RESPONSE ERROR:", error);
            throw new Error(error.message || "Fout bij verbinden met betaalserver.");
        }

        // 🟦 DEBUG 4 — success response
        if (data?.url) {
            console.log("EDGE RESPONSE SUCCESS:", data);
            window.location.href = data.url;
        } else {
            console.error("EDGE RESPONSE NO URL:", data);
            throw new Error("Geen betaallink ontvangen van de server.");
        }

    } catch (error: any) {
        console.error("Payment Flow Error:", error);
        alert(`Kon betaalpagina niet openen:\n${error.message || error}`);
    }
};
