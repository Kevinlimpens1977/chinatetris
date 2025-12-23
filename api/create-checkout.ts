import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('🛒 Create-checkout endpoint called');
    console.log('Method:', req.method);
    console.log('Host:', req.headers.host);
    console.log('Content-Type:', req.headers['content-type']);

    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Stripe not configured' });
    }

    try {
        // Log raw body for debugging
        console.log('📦 Request body:', JSON.stringify(req.body));

        const { uid, packageId, tokens, priceEuroCents, label } = req.body || {};

        console.log('📋 Parsed fields:', { uid, packageId, tokens, priceEuroCents, label });

        // Validate required fields
        if (!uid) {
            console.error('❌ Missing uid');
            return res.status(400).json({ error: 'Missing required field: uid' });
        }
        if (!packageId) {
            console.error('❌ Missing packageId');
            return res.status(400).json({ error: 'Missing required field: packageId' });
        }
        if (!tokens) {
            console.error('❌ Missing tokens');
            return res.status(400).json({ error: 'Missing required field: tokens' });
        }
        if (!priceEuroCents) {
            console.error('❌ Missing priceEuroCents');
            return res.status(400).json({ error: 'Missing required field: priceEuroCents' });
        }

        // Get the site URL from request origin or environment
        // Priority: request host > environment > fallback
        const host = req.headers.host || '';
        let siteUrl: string;

        if (host.includes('chinatetris.nl')) {
            siteUrl = 'https://www.chinatetris.nl';
        } else if (host.includes('chinatetris.vercel.app')) {
            siteUrl = 'https://chinatetris.vercel.app';
        } else if (process.env.VITE_SITE_URL) {
            siteUrl = process.env.VITE_SITE_URL;
        } else {
            siteUrl = `https://${host}`;
        }

        console.log('🌐 Using site URL:', siteUrl);

        // Create Stripe Checkout Session with iDEAL only (NL market)
        // iDEAL fee: €0.29 flat per transaction
        const session = await stripe.checkout.sessions.create({
            // iDEAL only - no credit card (lower fees, simpler for Dutch market)
            payment_method_types: ['ideal'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `ChinaTetris ${label || packageId}`,
                            description: `${tokens} speeltoken(s) voor ChinaTetris`,
                        },
                        unit_amount: Number(priceEuroCents),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Disable billing address and phone collection for simpler checkout
            billing_address_collection: 'auto',
            phone_number_collection: { enabled: false },
            success_url: `${siteUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}?payment=cancelled`,
            metadata: {
                uid: String(uid),
                packageId: String(packageId),
                tokens: String(tokens),
            },
        });

        console.log(`✅ Created checkout session ${session.id} for user ${uid}`);
        console.log('📍 Checkout URL:', session.url);

        return res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('❌ Error creating checkout session:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            details: error.message
        });
    }
}
