import React, { useState } from 'react';
import { buyCredits } from '../services/payments';
import PayWhatYouWant from './PayWhatYouWant';

interface CreditShopProps {
    onClose: () => void;
    onDevPlay?: () => void;
}

const CreditShop: React.FC<CreditShopProps> = ({ onClose, onDevPlay }) => {
    const [loading, setLoading] = useState(false);
    const [showPwyw, setShowPwyw] = useState(false);

    const handleBuy = async (type: '1credit' | '2credits' | 'pwyw', amount?: number) => {
        setLoading(true);
        await buyCredits(type, amount);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-2xl bg-black border-4 border-[#C92A2A] rounded-lg shadow-[0_0_30px_rgba(201,42,42,0.5)] p-6 md:p-8 animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-[#FFD700] text-xl font-bold transition-colors"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#FFD700] font-arcade tracking-wider mb-2 drop-shadow-md">
                        CREDIT SHOP
                    </h2>
                    <p className="text-white/80 text-lg">
                        Steun onze reis en speel verder!
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-2xl">
                        🏮 🧧 🏮
                    </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Option 1 */}
                    <button
                        onClick={() => handleBuy('1credit')}
                        disabled={loading}
                        className="group relative flex flex-col items-center p-4 bg-[#1a1a1a] border-2 border-[#C92A2A] hover:border-[#FFD700] hover:-translate-y-1 transition-all rounded-lg"
                    >
                        <span className="text-4xl mb-2">💎</span>
                        <h3 className="text-xl font-bold text-white mb-1">1 Credit</h3>
                        <p className="text-[#FFD700] font-bold text-lg">€5,00</p>
                        <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </button>

                    {/* Option 2 */}
                    <button
                        onClick={() => handleBuy('2credits')}
                        disabled={loading}
                        className="group relative flex flex-col items-center p-4 bg-[#1a1a1a] border-2 border-[#C92A2A] hover:border-[#FFD700] hover:-translate-y-1 transition-all rounded-lg"
                    >
                        <div className="absolute -top-3 bg-[#FFD700] text-black text-xs font-bold px-2 py-0.5 rounded shadow">
                            POPULAIR
                        </div>
                        <span className="text-4xl mb-2">💎💎</span>
                        <h3 className="text-xl font-bold text-white mb-1">2 Credits</h3>
                        <p className="text-[#FFD700] font-bold text-lg">€10,00</p>
                        <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </button>

                    {/* Option 3 (PWYW) */}
                    <button
                        onClick={() => setShowPwyw(true)}
                        disabled={loading}
                        className="group relative flex flex-col items-center p-4 bg-[#1a1a1a] border-2 border-[#C92A2A] hover:border-[#FFD700] hover:-translate-y-1 transition-all rounded-lg"
                    >
                        <span className="text-4xl mb-2">💝</span>
                        <h3 className="text-xl font-bold text-white mb-1">Sponsor</h3>
                        <p className="text-[#FFD700] font-bold text-lg">Kies bedrag</p>
                        <span className="text-xs text-white/50 mt-1">Min. €15</span>
                        <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </button>
                </div>

                {/* DEV BUTTON */}
                {onDevPlay && (
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={onDevPlay}
                            className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest border border-gray-500/30 px-3 py-1 rounded hover:bg-white/5 transition-all"
                        >
                            ondanks nul credits toch spelen
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center text-[#FFD700] animate-pulse my-4 font-bold">
                        Even geduld, we openen de betaalpagina...
                    </div>
                )}

                {/* PWYW Modal Overlay */}
                {showPwyw && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/95 rounded-lg p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm relative">
                            <button
                                onClick={() => setShowPwyw(false)}
                                className="absolute -top-2 -right-2 text-white hover:text-red-500 font-bold p-2"
                            >
                                ✕
                            </button>
                            <PayWhatYouWant />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditShop;
