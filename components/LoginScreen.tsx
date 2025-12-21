import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginScreenProps {
    onBack: () => void;
    onSuccess: () => void;
    onGoToSignup: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onSuccess, onGoToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authService.login(email, password);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Er is een fout opgetreden bij het inloggen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[100dvh] p-6">
            <div className="w-full max-w-sm bg-black/90 backdrop-blur-2xl border-2 border-[#fbbf24]/40 rounded-3xl p-8 shadow-[0_0_60px_rgba(220,38,38,0.25)] relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>

                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                    <span>←</span> Terug
                </button>

                <div className="text-center mb-8 mt-4">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 uppercase tracking-tighter">
                        Inloggen
                    </h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Voer je tempel-gegevens in</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 ml-1 font-bold">Email Adres</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-gray-600"
                            placeholder="naam@voorbeeld.nl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 ml-1 font-bold">Wachtwoord</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 border border-red-400/30 uppercase tracking-widest mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Laden...' : 'Beveiligd Inloggen'}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={onGoToSignup}
                            className="text-[10px] text-gray-400 hover:text-yellow-400 uppercase tracking-widest transition-colors"
                        >
                            Nog geen account? <span className="text-yellow-500 font-bold underline decoration-yellow-500/30 underline-offset-4 ml-1">Registreer hier</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
