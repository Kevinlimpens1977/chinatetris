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
        // Limit to last 100 for simplicity
        const sessions = await stripe.checkout.sessions.list({
            limit: 100,
            expand: ['data.payment_intent']
        });

        const payments = sessions.data.map(session => ({
            id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            status: session.payment_status,
            created: session.created,
            user_id: session.metadata?.user_id,
            credits: session.metadata?.credits
        }))

        return new Response(JSON.stringify({ payments }), {
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
