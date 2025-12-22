import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { uid, packageId, tokens, priceEuroCents, label } = req.body;

        // Validate required fields
        if (!uid || !packageId || !tokens || !priceEuroCents) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get the site URL from environment or request origin
        const siteUrl = process.env.VITE_SITE_URL ||
            `https://${req.headers.host}` ||
            'http://localhost:5173';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'ideal'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `ChinaTetris ${label}`,
                            description: `${tokens} speeltoken(s) voor ChinaTetris`,
                            images: ['https://chinatetris.vercel.app/dragon-icon.png'],
                        },
                        unit_amount: priceEuroCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${siteUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}?payment=cancelled`,
            metadata: {
                uid,
                packageId,
                tokens: tokens.toString(),
            },
        });

        console.log(`✅ Created checkout session ${session.id} for user ${uid}`);

        return res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            details: error.message
        });
    }
}
