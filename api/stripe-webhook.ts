import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});

// Initialize Firebase Admin
if (!getApps().length) {
    // For Vercel, use environment variable for service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

    initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
        projectId: 'chinatetris-c5706',
    });
}

const db = getFirestore();

export const config = {
    api: {
        bodyParser: false, // Stripe requires raw body for webhook signature verification
    },
};

// Helper to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'] as string;

        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log(`💳 Checkout session completed: ${session.id}`);

            // Extract metadata
            const uid = session.metadata?.uid;
            const packageId = session.metadata?.packageId;
            const tokens = parseInt(session.metadata?.tokens || '0', 10);

            if (!uid || !tokens) {
                console.error('Missing uid or tokens in session metadata');
                return res.status(400).json({ error: 'Missing metadata' });
            }

            try {
                // Add credits to user
                const userRef = db.collection('users').doc(uid);
                await userRef.set({
                    credits: FieldValue.increment(tokens),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`💰 Added ${tokens} credits to user ${uid}`);

                // Record the transaction
                await db.collection('transactions').add({
                    uid,
                    stripeSessionId: session.id,
                    packageId,
                    credits: tokens,
                    amountCents: session.amount_total,
                    status: 'completed',
                    createdAt: FieldValue.serverTimestamp(),
                    completedAt: FieldValue.serverTimestamp()
                });

                console.log(`📝 Transaction recorded for session ${session.id}`);
            } catch (error) {
                console.error('Error processing payment:', error);
                return res.status(500).json({ error: 'Failed to process payment' });
            }
            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`⏰ Checkout session expired: ${session.id}`);
            // Optionally record failed transaction
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
}
