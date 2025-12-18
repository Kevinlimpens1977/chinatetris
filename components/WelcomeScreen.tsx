import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface WelcomeScreenProps {
    onLogin: () => void;
    onRegister: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onRegister }) => {
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
            alert('Kon niet inloggen met Google. Probeer het later opnieuw.');
        }
    };

    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-4 md:p-8 overflow-y-auto">
            {/* Main Container */}
            <div className="glass-panel p-6 md:p-12 rounded-3xl max-w-2xl w-full shadow-2xl border border-yellow-500/20 relative bg-black/60 backdrop-blur-md text-center">

                {/* Header Decor */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-6xl animate-float">🎮</div>

                {/* Header */}
                <div className="mb-8 mt-4">
                    <h1 className="text-4xl md:text-6xl font-black leading-none mb-4"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            color: '#dc2626', // Red
                            WebkitTextStroke: '1px #fbbf24', // Gold Stroke
                            textShadow: `
                                0 0 20px rgba(220, 38, 38, 0.5),
                                2px 2px 0 #7f1d1d,
                                4px 4px 0 #450a0a,
                                6px 6px 15px rgba(0,0,0,0.5)
                            `
                        }}>
                        WELKOM BIJ<br />HET SPEL
                    </h1>
                </div>

                {/* Description */}
                <div className="space-y-6 mb-10 text-gray-200">
                    <p className="text-lg md:text-xl font-medium">
                        Dit is een digitaal spelplatform.
                    </p>
                    <p className="text-sm md:text-base opacity-90 leading-relaxed">
                        Je kunt spellen spelen met digitale credits. Geniet van een premium arcade-ervaring met hoogwaardige graphics en gameplay.
                    </p>
                </div>

                {/* Compliance Disclaimer */}
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-8 text-xs text-red-200/80">
                    <p className="font-bold mb-1 uppercase tracking-wider">Disclaimer</p>
                    <p>Betalingen zijn geen donaties of crowdfunding. Geen enkele aankoop garandeert een beloning. Alle transacties zijn voor digitale credits die uitsluitend worden gebruikt voor toegang tot het spel.</p>
                </div>

                {/* Actions */}
                <div className="space-y-4 max-w-sm mx-auto">
                    <button
                        onClick={onRegister}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2 border border-red-500/50"
                    >
                        <span>🕹️</span>
                        SPEEL HET SPEL
                    </button>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 rounded-xl bg-white text-gray-800 font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        <span>Inloggen met Google</span>
                    </button>

                    <div className="flex items-center gap-2 w-full my-2">
                        <div className="h-px bg-yellow-500/10 flex-1"></div>
                        <span className="text-[10px] text-yellow-500/30 uppercase">of</span>
                        <div className="h-px bg-yellow-500/10 flex-1"></div>
                    </div>

                    <button
                        onClick={onLogin}
                        className="w-full py-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 font-bold transition-colors border border-yellow-500/20 text-sm"
                    >
                        HEB JE AL EEN ACCOUNT? LOG IN
                    </button>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-12 pt-6 border-t border-white/5 text-[10px] text-gray-500">
                    <p>Dit platform verkoopt digitale credits voor toegang tot entertainment. Betalingen zijn geen donaties, investeringen of crowdfunding.</p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
