import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    signInWithPopup,
    GoogleAuthProvider,
    User
} from 'firebase/auth';
import { auth } from './firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();


export interface AuthError {
    code: string;
    message: string;
}

/**
 * Login with email and password
 * @returns User object on success, throws error on failure
 */
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth not initialized');

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        // Rethrow with original code for handling in UI
        throw error;
    }
};

/**
 * Register new user with email and password
 * @returns User object on success, throws error on failure
 */
export const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string
): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth not initialized');

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Update the user's display name
        await updateProfile(result.user, { displayName });

        return result.user;
    } catch (error: any) {
        // Rethrow with original code for handling in UI
        throw error;
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    if (!auth) return;
    await firebaseSignOut(auth);
};

/**
 * Get the currently logged in user
 */
export const getCurrentUser = (): User | null => {
    if (!auth) return null;
    return auth.currentUser;
};

/**
 * Listen for auth state changes
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await sendPasswordResetEmail(auth, email);
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};


/**
 * Translate Firebase auth error codes to Dutch messages
 */
export const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Verkeerd email adres of wachtwoord';
        case 'auth/email-already-in-use':
            return 'Gebruiker bestaat al. Log in?';
        case 'auth/weak-password':
            return 'Wachtwoord moet minimaal 6 karakters zijn';
        case 'auth/too-many-requests':
            return 'Te veel pogingen. Probeer later opnieuw.';
        default:
            return 'Er is een fout opgetreden. Probeer opnieuw.';
    }
};
