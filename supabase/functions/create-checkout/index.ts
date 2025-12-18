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
        const { amount_eur, purchase_type, user_id } = await req.json()
        const SITE_URL = Deno.env.get('SITE_URL')

        if (!user_id || !SITE_URL) {
            throw new Error("Missing user_id or SITE_URL")
        }

        let sessionConfig: any = {
            payment_method_types: ['card', 'ideal', 'bancontact'],
            mode: 'payment',
            success_url: `${SITE_URL}/credits/success`,
            cancel_url: `${SITE_URL}/credits/cancel`,
            metadata: { user_id, purchase_type }
        }

        if (purchase_type === '1credit') {
            const priceId = Deno.env.get('PRICE_1_CREDIT_5_EURO')
            if (!priceId) throw new Error("Missing PRICE_1_CREDIT_5_EURO")
            sessionConfig.line_items = [{ price: priceId, quantity: 1 }]
        }
        else if (purchase_type === '2credits') {
            const priceId = Deno.env.get('PRICE_2_CREDITS_10_EURO')
            if (!priceId) throw new Error("Missing PRICE_2_CREDITS_10_EURO")
            sessionConfig.line_items = [{ price: priceId, quantity: 1 }]
        }
        else if (purchase_type === 'pwyw' && amount_eur) {
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Sponsor Donatie' },
                    unit_amount: Math.round(amount_eur * 100)
                },
                quantity: 1
            }]
        } else {
            throw new Error("Invalid purchase_type")
        }

        const session = await stripe.checkout.sessions.create(sessionConfig)

        return new Response(JSON.stringify({ url: session.url }), {
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
