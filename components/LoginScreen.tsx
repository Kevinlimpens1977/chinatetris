import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginScreenProps {
    onBack: () => void;
    onLoginSuccess: () => void;
    onForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLoginSuccess, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResendConfirmation, setShowResendConfirmation] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResendConfirmation = async () => {
        if (!email) {
            setError('Please enter your email address first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (resendError) throw resendError;

            setResendSuccess(true);
            setShowResendConfirmation(false);
            setTimeout(() => setResendSuccess(false), 5000);
        } catch (err: any) {
            console.error('Resend error:', err);
            setError(err.message || 'Could not resend verification email.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in with Google:', error);
            setError('Could not log in with Google.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setError(null);
        setShowResendConfirmation(false);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.user) {
                onLoginSuccess();
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Could not log in.');
            if (err.message && (err.message.includes('Email not confirmed') || err.message.includes('confirm'))) {
                setShowResendConfirmation(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
            <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🕹️</div>

                <h2 className="text-2xl font-bold text-center mb-6 mt-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 uppercase tracking-widest">
                    Player Login
                </h2>

                {resendSuccess && (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-xl mb-4 text-sm text-center">
                        ✅ Verification email resent! Please check your inbox.
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {showResendConfirmation && (
                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-yellow-200 mb-3 text-center">
                            Did not receive the verification email?
                        </p>
                        <button
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={loading}
                            className="w-full py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            📧 Resend Email
                        </button>
                    </div>
                )}

                <div className="mb-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 rounded-xl bg-white text-gray-800 font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg mb-4"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        <span>Log in with Google</span>
                    </button>

                    <div className="flex items-center gap-2 w-full">
                        <div className="h-px bg-white/20 flex-1"></div>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">or with email</span>
                        <div className="h-px bg-white/20 flex-1"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-cyan-200 mb-1 font-bold">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-cyan-200 mb-1 font-bold">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest font-bold"
                    >
                        Forgot password?
                    </button>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors disabled:opacity-50 text-xs"
                        >
                            BACK
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-xs"
                        >
                            {loading ? 'LOGGING IN...' : 'LOG IN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
