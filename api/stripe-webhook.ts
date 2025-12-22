import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Stripe - use API version that matches webhook or let Stripe auto-detect
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Initialize Firebase Admin
let db: FirebaseFirestore.Firestore;

function initializeFirebase() {
    if (!getApps().length) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            console.error('FIREBASE_SERVICE_ACCOUNT_KEY not configured');
            throw new Error('Firebase service account not configured');
        }

        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            initializeApp({
                credential: cert(serviceAccount),
                projectId: 'chinatetris-c5706',
            });
            console.log('Firebase Admin initialized successfully');
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
            throw new Error('Invalid Firebase service account configuration');
        }
    }
    return getFirestore();
}

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
    console.log('🔔 Stripe webhook received');
    console.log('Method:', req.method);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check required environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        console.error('❌ STRIPE_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Stripe secret key not configured' });
    }

    // Initialize Firebase
    try {
        db = initializeFirebase();
    } catch (e: any) {
        console.error('❌ Firebase initialization failed:', e.message);
        return res.status(500).json({ error: 'Firebase initialization failed' });
    }

    let event: Stripe.Event;

    try {
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            console.error('❌ No stripe-signature header');
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }

        console.log('📝 Verifying webhook signature...');
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log('✅ Webhook signature verified, event type:', event.type);
    } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log(`💳 Checkout session completed: ${session.id}`);
            console.log('📦 Session metadata:', JSON.stringify(session.metadata));

            // Extract metadata
            const uid = session.metadata?.uid;
            const packageId = session.metadata?.packageId;
            const tokensStr = session.metadata?.tokens;
            const tokens = tokensStr ? parseInt(tokensStr, 10) : 0;

            console.log(`📋 Extracted: uid=${uid}, packageId=${packageId}, tokens=${tokens}`);

            if (!uid) {
                console.error('❌ Missing uid in session metadata');
                return res.status(400).json({ error: 'Missing uid in metadata' });
            }

            if (!tokens || tokens <= 0) {
                console.error('❌ Invalid tokens value in session metadata');
                return res.status(400).json({ error: 'Invalid tokens in metadata' });
            }

            try {
                // Add credits to user
                console.log(`💰 Adding ${tokens} credits to user ${uid}...`);
                const userRef = db.collection('users').doc(uid);
                await userRef.set({
                    credits: FieldValue.increment(tokens),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`✅ Added ${tokens} credits to user ${uid}`);

                // Record the transaction
                console.log('📝 Recording transaction...');
                await db.collection('transactions').add({
                    uid,
                    stripeSessionId: session.id,
                    stripePaymentIntent: session.payment_intent,
                    packageId: packageId || 'unknown',
                    credits: tokens,
                    amountCents: session.amount_total || 0,
                    currency: session.currency || 'eur',
                    customerEmail: session.customer_details?.email || null,
                    status: 'completed',
                    createdAt: FieldValue.serverTimestamp(),
                    completedAt: FieldValue.serverTimestamp()
                });

                console.log(`✅ Transaction recorded for session ${session.id}`);

                // === PHASE 4: DRAGON CHEST TRACKING ===
                const amountEuros = Math.floor((session.amount_total || 0) / 100);
                const customerEmail = session.customer_details?.email || null;

                if (amountEuros > 0) {
                    // Step 3: Update dragon chest totals
                    console.log(`🐉 Updating Dragon Chest: +${amountEuros} coins, +${tokens} credits`);
                    const dragonChestRef = db.collection('system').doc('dragonChest');
                    await dragonChestRef.set({
                        totalGoldenCoins: FieldValue.increment(amountEuros),
                        totalCredits: FieldValue.increment(tokens),
                        lastUpdated: FieldValue.serverTimestamp()
                    }, { merge: true });

                    // Step 4: Register contributor
                    console.log(`📝 Registering contributor: ${uid} (${customerEmail})`);
                    const contributorRef = db.collection('contributors').doc(uid);
                    const contributorSnapshot = await contributorRef.get();

                    if (!contributorSnapshot.exists) {
                        // First contribution: initialize with reward500Claimed = false
                        await contributorRef.set({
                            uid,
                            email: customerEmail,
                            totalContributed: amountEuros,
                            lastContribution: FieldValue.serverTimestamp(),
                            reward500Claimed: false
                        });
                    } else {
                        // Subsequent contribution: only increment, preserve reward500Claimed
                        await contributorRef.set({
                            totalContributed: FieldValue.increment(amountEuros),
                            lastContribution: FieldValue.serverTimestamp()
                        }, { merge: true });
                    }

                    // Step 5: Check milestone
                    const chestDoc = await dragonChestRef.get();
                    const chestData = chestDoc.data() || {};
                    const totalCoins = chestData.totalGoldenCoins || 0;
                    const milestoneReached = chestData.milestones?.['500']?.reached === true;

                    console.log(`🎯 Milestone check: ${totalCoins} coins, reached: ${milestoneReached}`);

                    if (totalCoins >= 500 && !milestoneReached) {
                        console.log('🎉 500-coin milestone reached! Starting reward distribution...');

                        // Step 5a: Mark milestone as reached FIRST (idempotency lock)
                        await dragonChestRef.set({
                            milestones: {
                                '500': {
                                    reached: true,
                                    reachedAt: FieldValue.serverTimestamp(),
                                    rewardsDistributed: false
                                }
                            }
                        }, { merge: true });

                        // Step 5b: Distribute rewards to all contributors
                        const contributorsSnapshot = await db.collection('contributors').get();
                        let rewardsCount = 0;

                        for (const doc of contributorsSnapshot.docs) {
                            const contributorUid = doc.id;
                            const contributorData = doc.data();

                            if (contributorData.reward500Claimed !== true) {
                                // Add 1 credit to contributor
                                await db.collection('users').doc(contributorUid).set({
                                    credits: FieldValue.increment(1),
                                    updatedAt: FieldValue.serverTimestamp()
                                }, { merge: true });

                                // Mark as claimed
                                await db.collection('contributors').doc(contributorUid).set({
                                    reward500Claimed: true
                                }, { merge: true });

                                rewardsCount++;
                                console.log(`🎁 Rewarded +1 credit to ${contributorUid}`);
                            }
                        }

                        // Step 5c: Mark distribution complete
                        await dragonChestRef.set({
                            milestones: {
                                '500': {
                                    rewardsDistributed: true
                                }
                            }
                        }, { merge: true });

                        console.log(`✅ Milestone 500 complete: ${rewardsCount} contributors rewarded`);
                    }
                }
            } catch (error: any) {
                console.error('❌ Error processing payment:', error.message);
                console.error('Stack:', error.stack);
                return res.status(500).json({ error: 'Failed to process payment', details: error.message });
            }
            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`⏰ Checkout session expired: ${session.id}`);
            break;
        }

        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('✅ Webhook processed successfully');
    return res.status(200).json({ received: true });
}
