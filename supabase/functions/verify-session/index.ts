import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.11.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { session_id } = await req.json()

        if (!session_id) {
            throw new Error("Missing session_id")
        }

        const session = await stripe.checkout.sessions.retrieve(session_id)

        // Validate status
        if (session.payment_status !== 'paid') {
            throw new Error("Payment not paid yet")
        }

        // Extract metadata
        const user_id = session.metadata?.user_id
        const credits = parseInt(session.metadata?.credits || '0', 10)

        if (!user_id || !credits) {
            // Should ideally handle pwyw calculation here too if metadata logic is complex
            // But per current create-checkout, we store credits in metadata.
            throw new Error("Invalid session metadata")
        }

        return new Response(JSON.stringify({
            verified: true,
            user_id,
            credits
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
