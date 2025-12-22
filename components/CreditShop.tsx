import React, { useState } from 'react';
import { UserData } from '../types';
import { TOKEN_PACKAGES } from '../constants';
import { startCheckoutFlow } from '../services/stripeService';

interface CreditShopProps {
    user: UserData | null;
    onClose: () => void;
    onPurchaseSuccess?: () => void;
}

const CreditShop: React.FC<CreditShopProps> = ({ user, onClose, onPurchaseSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (packageId: string) => {
        if (!user?.uid) {
            setError('Je moet ingelogd zijn om tokens te kopen.');
            return;
        }

        setIsLoading(true);
        setSelectedPackage(packageId);
        setError(null);

        try {
            const success = await startCheckoutFlow(user.uid, packageId);
            if (!success) {
                setError('Er ging iets mis. Probeer opnieuw.');
            }
            // If successful, user will be redirected to Stripe
        } catch (err) {
            console.error('Purchase error:', err);
            setError('Betaling kon niet worden gestart. Probeer opnieuw.');
        } finally {
            setIsLoading(false);
            setSelectedPackage(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4 overflow-hidden">
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col">

                {/* Main Container with animated border */}
                <div className="relative w-full h-full flex flex-col rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.3)] overflow-hidden p-[2px] md:p-[3px]">
                    {/* Animated Border - Green & Gold for money theme */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#166534_0%,#fbbf24_20%,#166534_40%,#fbbf24_60%,#166534_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/90 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="shrink-0 p-6 pb-4 text-center relative">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
                            >
                                ✕
                            </button>

                            <div className="text-5xl mb-3">🪙</div>
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-2"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                TOKEN SHOP
                            </h1>
                            <p className="text-sm text-gray-400">
                                Koop tokens om ChinaTetris te spelen
                            </p>

                            {/* Current Balance */}
                            <div className="mt-4 inline-flex items-center gap-3 bg-green-900/30 border border-green-500/30 rounded-full px-6 py-2">
                                <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Huidige Saldo:</span>
                                <span className="text-2xl font-mono font-black text-green-300">{user?.credits || 0}</span>
                                <span className="text-green-400 text-sm">tokens</span>
                            </div>
                        </div>

                        {/* Token Packages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {TOKEN_PACKAGES.map((pkg, index) => {
                                const isPopular = pkg.id === 'pack_5';
                                const isBestValue = pkg.id === 'pack_3';

                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => handlePurchase(pkg.id)}
                                        disabled={isLoading}
                                        className={`
                                            relative w-full p-4 md:p-5 rounded-2xl border-2 transition-all duration-300
                                            ${isPopular
                                                ? 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500/50 hover:border-yellow-400'
                                                : 'bg-white/5 border-white/10 hover:border-green-500/50 hover:bg-white/10'
                                            }
                                            ${isLoading && selectedPackage === pkg.id ? 'opacity-50' : ''}
                                            disabled:cursor-not-allowed
                                            transform hover:scale-[1.02] active:scale-[0.98]
                                        `}
                                    >
                                        {/* Badge */}
                                        {isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                                                Meest Populair
                                            </div>
                                        )}
                                        {isBestValue && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-green-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                                                Beste Waarde
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left: Token info */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl md:text-4xl">
                                                    {pkg.tokens === 1 ? '🎮' : pkg.tokens === 3 ? '🎯' : '🏆'}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-black text-lg md:text-xl text-white">
                                                        {pkg.label}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {pkg.tokens} {pkg.tokens === 1 ? 'spel' : 'spellen'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Price */}
                                            <div className="text-right">
                                                <div className={`font-black text-xl md:text-2xl ${isPopular ? 'text-yellow-400' : 'text-green-400'}`}>
                                                    €{(pkg.priceEuroCents / 100).toFixed(2).replace('.', ',')}
                                                </div>
                                                {pkg.tokens > 1 && (
                                                    <div className="text-[10px] text-gray-500">
                                                        €{(pkg.priceEuroCents / 100 / pkg.tokens).toFixed(2).replace('.', ',')} per spel
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Loading indicator */}
                                        {isLoading && selectedPackage === pkg.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                                <div className="animate-spin text-3xl">🐉</div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mx-4 mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="shrink-0 p-4 pt-0 text-center">
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Betaling via Stripe. Je wordt doorgestuurd naar een beveiligde betaalpagina.
                                <br />
                                Tokens zijn alleen voor digitaal spelplezier en hebben geen geldwaarde.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditShop;
