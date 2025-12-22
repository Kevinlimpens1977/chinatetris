import { loadStripe, Stripe } from '@stripe/stripe-js';
import { TOKEN_PACKAGES } from '../constants';

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (singleton)
 */
export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        if (!STRIPE_PUBLISHABLE_KEY) {
            console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
            return Promise.resolve(null);
        }
        stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

/**
 * Get token package by ID
 */
export const getPackageById = (packageId: string) => {
    return TOKEN_PACKAGES.find(p => p.id === packageId);
};

/**
 * Create a Stripe checkout session via our API
 */
export const createCheckoutSession = async (
    uid: string,
    packageId: string
): Promise<{ sessionId: string; url: string } | null> => {
    const pkg = getPackageById(packageId);
    if (!pkg) {
        console.error(`Invalid package ID: ${packageId}`);
        return null;
    }

    try {
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid,
                packageId,
                tokens: pkg.tokens,
                priceEuroCents: pkg.priceEuroCents,
                label: pkg.label
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to create checkout session:', error);
            return null;
        }

        const data = await response.json();
        return { sessionId: data.sessionId, url: data.url };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return null;
    }
};

/**
 * Redirect to Stripe Checkout using the URL from the session
 * Note: stripe.redirectToCheckout is deprecated in newer versions
 */
export const redirectToCheckout = async (checkoutUrl: string): Promise<void> => {
    if (!checkoutUrl) {
        console.error('No checkout URL provided');
        return;
    }

    // Direct redirect to Stripe Checkout URL
    window.location.href = checkoutUrl;
};

/**
 * Start checkout flow for a package
 */
export const startCheckoutFlow = async (uid: string, packageId: string): Promise<boolean> => {
    console.log(`💳 Starting checkout for package ${packageId}, user ${uid}`);

    const session = await createCheckoutSession(uid, packageId);
    if (!session || !session.url) {
        console.error('Failed to create checkout session or no URL returned');
        return false;
    }

    // Redirect directly to the checkout URL
    redirectToCheckout(session.url);
    return true;
};
