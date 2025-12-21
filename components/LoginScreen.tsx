import React, { useState } from 'react';
import { loginWithEmail, sendPasswordReset, signInWithGoogle, getAuthErrorMessage } from '../services/authService';

const GOOGLE_ICON_URL = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

interface LoginScreenProps {
    onLoginSuccess: (user: any) => void;
    onGoToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await loginWithEmail(email, password);
            onLoginSuccess(user);
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await sendPasswordReset(email);
            setResetEmailSent(true);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError('Geen account gevonden met dit emailadres');
            } else if (err.code === 'auth/invalid-email') {
                setError('Voer een geldig emailadres in');
            } else {
                setError(getAuthErrorMessage(err.code));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setShowForgotPassword(false);
        setResetEmailSent(false);
        setError('');
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
            // Auth state listener will handle the redirect
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user') {
                // User closed popup, no error needed
            } else {
                setError(getAuthErrorMessage(err.code));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[100dvh] p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-6xl font-black text-red-500 mb-2"
                        style={{
                            WebkitTextStroke: '1px #fbbf24',
                            textShadow: '0 0 20px rgba(220, 38, 38, 0.5), 2px 2px 0 #991b1b'
                        }}>
                        CHINA TETRIS
                    </h1>
                    <p className="text-yellow-200/80 text-sm tracking-widest uppercase">
                        {showForgotPassword ? 'Wachtwoord vergeten' : 'Inloggen'}
                    </p>
                </div>

                {/* Form Container */}
                <div className="relative group">
                    <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.3)] p-[2px]">
                        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                        <div className="relative w-full bg-black/90 backdrop-blur-xl rounded-[calc(1rem-2px)] p-6 md:p-8">

                            {/* Password Reset Success */}
                            {resetEmailSent ? (
                                <div className="text-center space-y-6">
                                    <div className="text-5xl mb-4">✉️</div>
                                    <p className="text-green-400 text-lg font-medium">
                                        We sturen je een wachtwoord herstel link ...
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        Check je inbox (en spam folder) voor de reset link.
                                    </p>
                                    <button
                                        onClick={handleBackToLogin}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider border border-red-500/30"
                                    >
                                        Log in
                                    </button>
                                </div>
                            ) : showForgotPassword ? (
                                /* Forgot Password Form */
                                <form onSubmit={handlePasswordReset} className="space-y-5">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                            placeholder="jouw@email.nl"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Laden...' : 'Reset wachtwoord'}
                                    </button>

                                    {/* Back to Login */}
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleBackToLogin}
                                            className="text-gray-400 hover:text-white text-sm transition-colors"
                                        >
                                            ← Terug naar inloggen
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* Login Form */
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                            placeholder="jouw@email.nl"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                            Wachtwoord
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                            placeholder="••••••••"
                                            required
                                            autoComplete="current-password"
                                        />
                                    </div>

                                    {/* Forgot Password Link */}
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-gray-400 hover:text-yellow-400 text-xs transition-colors"
                                        >
                                            Wachtwoord vergeten?
                                        </button>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Laden...' : 'Inloggen'}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-px bg-white/10"></div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wider">of</span>
                                        <div className="flex-1 h-px bg-white/10"></div>
                                    </div>

                                    {/* Google Sign In */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <img src={GOOGLE_ICON_URL} alt="Google" className="w-6 h-6" />
                                        <span>Inloggen met Google</span>
                                    </button>
                                </form>
                            )}

                            {/* Register Link - only show on login form */}
                            {!showForgotPassword && !resetEmailSent && (
                                <div className="mt-6 text-center">
                                    <p className="text-gray-400 text-sm">
                                        Nog geen account?{' '}
                                        <button
                                            onClick={onGoToRegister}
                                            className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors underline underline-offset-2"
                                        >
                                            Registreer hier
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
