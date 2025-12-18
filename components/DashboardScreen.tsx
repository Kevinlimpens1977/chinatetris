import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getCredits } from '../services/credits';
import { UserData } from '../types';
import TetrisPanel from './TetrisPanel';

interface DashboardScreenProps {
    user: UserData;
    onPlay: () => void;
    onBuyCredits: () => void;
    onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onPlay, onBuyCredits, onLogout }) => {
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCredits = async () => {
            console.log('[Dashboard] Fetching user credits...');
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const c = await getCredits(authUser.id);
                    console.log(`[Dashboard] Credits loaded: ${c}`);
                    setCredits(c);
                } else {
                    console.warn('[Dashboard] No persisted user found during credit fetch');
                }
            } catch (err) {
                console.error('[Dashboard] Error fetching credits:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCredits();
    }, []);

    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
            <TetrisPanel title="DASHBOARD" className="w-full max-w-2xl">

                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-4 border-[#FFD700] shadow-[0_0_20px_#C92A2A] overflow-hidden mb-4 bg-black">
                            {/* Try getting avatar from Google metadata if available, else placeholder */}
                            <img
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-[#FFD700] font-arcade tracking-wider">{user.name}</h2>
                        <span className="text-white/60 text-sm">{user.city}</span>
                    </div>

                    {/* Stats & Credits */}
                    <div className="flex-1 w-full bg-black/40 p-6 rounded-lg border-2 border-[#C92A2A] flex flex-col items-center justify-center">
                        <span className="text-white text-sm uppercase tracking-widest mb-2">Jouw Saldo</span>

                        {loading ? (
                            <span className="text-white animate-pulse">...</span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-5xl font-bold text-[#FFD700] font-arcade drop-shadow-md">
                                    {credits ?? 0}
                                </span>
                                <span className="text-2xl">🏮</span>
                            </div>
                        )}
                        <p className="text-white/60 text-xs mt-2">Credits beschikbaar</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={onPlay}
                        className="py-4 px-6 rounded-lg border-b-4 font-arcade text-xl uppercase tracking-widest transition-all bg-gradient-to-r from-green-600 to-green-500 border-green-800 text-white hover:brightness-110 active:border-b-0 active:translate-y-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    >
                        ▶ START SPEL
                    </button>

                    <button
                        onClick={onBuyCredits}
                        className="py-4 px-6 rounded-lg bg-gradient-to-r from-[#C92A2A] to-[#FF0000] border-b-4 border-[#8B0000] text-[#FFD700] font-arcade text-xl uppercase tracking-widest hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(201,42,42,0.4)]"
                    >
                        + KOOP CREDITS
                    </button>

                    <div className="md:col-span-2 mt-4 text-center">
                        <button onClick={onLogout} className="text-white/50 hover:text-white text-sm underline">
                            Uitloggen
                        </button>
                    </div>
                </div>

            </TetrisPanel>
        </div>
    );
};

export default DashboardScreen;
