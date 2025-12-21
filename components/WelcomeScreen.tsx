import React from 'react';

interface WelcomeScreenProps {
    onGoToLogin: () => void;
    onGoToRegistration: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGoToLogin, onGoToRegistration }) => {
    return (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[100dvh] p-6 text-center">
            {/* Logo Section */}
            <div className="mb-12 animate-float">
                <div className="text-8xl mb-4">🐉</div>
                <h1 className="text-6xl md:text-8xl font-black leading-none text-[#ef4444]"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        WebkitTextStroke: '2px #fbbf24',
                        textShadow: '0 0 20px rgba(220, 38, 38, 0.5), 4px 4px 0 #450a0a'
                    }}>
                    CHINA<br />TETRIS
                </h1>
            </div>

            {/* Action Card */}
            <div className="w-full max-w-sm bg-black/80 backdrop-blur-xl border-2 border-[#fbbf24]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <h2 className="text-2xl font-bold text-yellow-100 mb-2 uppercase tracking-widest">
                    Welkom bij de Tempel
                </h2>
                <p className="text-gray-400 text-sm mb-8 italic">
                    Log in of registreer om je score te vereeuwigen op het wereldwijde klassement.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onGoToLogin}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 border border-red-400/30 uppercase tracking-widest"
                    >
                        Inloggen
                    </button>

                    <button
                        onClick={onGoToRegistration}
                        className="w-full py-4 bg-yellow-500/10 hover:bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
                    >
                        Registreren
                    </button>
                </div>
            </div>

            {/* Footer info */}
            <div className="mt-12 text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">
                Premium Digitaal Gamen &copy; 2025
            </div>
        </div>
    );
};

export default WelcomeScreen;
