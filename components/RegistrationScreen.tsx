import React, { useState } from 'react';
import { registerWithEmail, getAuthErrorMessage } from '../services/authService';

interface RegistrationScreenProps {
    onRegisterSuccess: (user: any) => void;
    onGoToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegisterSuccess, onGoToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowLoginPrompt(false);

        // Validate passwords match
        if (password !== repeatPassword) {
            setError('Wachtwoorden komen niet overeen');
            return;
        }

        // Validate name
        if (name.trim().length < 2) {
            setError('Vul je volledige naam in');
            return;
        }

        setIsLoading(true);

        try {
            const user = await registerWithEmail(email, password, name.trim());
            onRegisterSuccess(user);
        } catch (err: any) {
            const message = getAuthErrorMessage(err.code);
            setError(message);

            // Show login prompt if user already exists
            if (err.code === 'auth/email-already-in-use') {
                setShowLoginPrompt(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[100dvh] p-4 overflow-y-auto">
            <div className="w-full max-w-md my-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-6xl font-black text-red-500 mb-2"
                        style={{
                            WebkitTextStroke: '1px #fbbf24',
                            textShadow: '0 0 20px rgba(220, 38, 38, 0.5), 2px 2px 0 #991b1b'
                        }}>
                        CHINA TETRIS
                    </h1>
                    <p className="text-yellow-200/80 text-sm tracking-widest uppercase">Registreren</p>
                </div>

                {/* Form Container */}
                <div className="relative group">
                    <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.3)] p-[2px]">
                        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                        <div className="relative w-full bg-black/90 backdrop-blur-xl rounded-[calc(1rem-2px)] p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                        Naam (voor- en achternaam)
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                        placeholder="Jan de Vries"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                        placeholder="jouw@email.nl"
                                        required
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
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                        placeholder="Minimaal 6 karakters"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                {/* Repeat Password */}
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                                        Herhaal wachtwoord
                                    </label>
                                    <input
                                        type="password"
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                        placeholder="Herhaal je wachtwoord"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
                                        {error}
                                        {showLoginPrompt && (
                                            <button
                                                type="button"
                                                onClick={onGoToLogin}
                                                className="block w-full mt-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors underline underline-offset-2"
                                            >
                                                Ga naar inloggen →
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Laden...' : 'Registreren'}
                                </button>
                            </form>

                            {/* Login Link */}
                            <div className="mt-6 text-center">
                                <p className="text-gray-400 text-sm">
                                    Al een account?{' '}
                                    <button
                                        onClick={onGoToLogin}
                                        className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors underline underline-offset-2"
                                    >
                                        Log hier in
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationScreen;
