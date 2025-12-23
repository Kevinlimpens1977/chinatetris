import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Admin email - only this user can delete tickets
const ADMIN_EMAIL = "Kevlimpens@gmail.com";

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    initializeApp({
        credential: cert(serviceAccount),
        projectId: 'chinatetris-c5706'
    });
}

const db = getFirestore();
const auth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Verify Firebase Auth token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token and get the user's email
        const decodedToken = await auth.verifyIdToken(idToken);
        const userEmail = decodedToken.email;

        console.log(`🔐 Admin delete ticket request from: ${userEmail}`);

        // 2. Check if user is admin
        if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            console.warn(`⛔ Non-admin user attempted ticket deletion: ${userEmail}`);
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // 3. Validate request body
        const { ticketId } = req.body;
        if (!ticketId || typeof ticketId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid ticketId' });
        }

        console.log(`🎫 Admin ${userEmail} deleting ticket: ${ticketId}`);

        // 4. Check if ticket exists
        const ticketRef = db.collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // 5. Delete the ticket
        await ticketRef.delete();

        console.log(`✅ Ticket ${ticketId} deleted successfully by admin ${userEmail}`);

        return res.status(200).json({
            success: true,
            message: `Ticket ${ticketId} deleted successfully`,
            deletedTicketId: ticketId
        });

    } catch (error: any) {
        console.error('❌ Admin delete ticket error:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired, please re-authenticate' });
        }
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
