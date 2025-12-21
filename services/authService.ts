import { auth, db } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const authService = {
    // Login with specific error message requirement
    async login(email: string, pass: string) {
        if (!auth) throw new Error("Auth not initialized");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            return userCredential.user;
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                throw new Error("Verkeerd email adres of wachtwoord");
            }
            throw error;
        }
    },

    // Signup with specific requirements
    async signup(email: string, pass: string, name: string, photoUrl?: string) {
        if (!auth) throw new Error("Auth not initialized");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

            // Update profile with name and photo
            await updateProfile(userCredential.user, {
                displayName: name,
                photoURL: photoUrl || null
            });

            // Note: User info is NOT saved to Firestore yet as per "don't save user info" 
            // but we could store basic metadata if needed later.

            return userCredential.user;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                throw new Error("Gebruiker bestaat al. Log in?");
            }
            throw error;
        }
    },

    async logout() {
        if (!auth) return;
        await signOut(auth);
    },

    onAuthStateChanged(callback: (user: User | null) => void) {
        if (!auth) return () => { };
        return onAuthStateChanged(auth, callback);
    },

    getCurrentUser() {
        return auth?.currentUser || null;
    }
};
