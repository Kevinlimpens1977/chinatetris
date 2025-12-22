import React, { useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebase';

interface DragonChestData {
    totalGoldenCoins: number;
    totalCredits: number;
    milestone500Reached: boolean;
    milestone500Distributed: boolean;
}

interface DragonChestPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animated counter hook
const useAnimatedCounter = (targetValue: number, duration: number = 1000) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const difference = targetValue - startValue;

        if (difference === 0) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentValue = Math.round(startValue + difference * easeOutQuart);
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = targetValue;
            }
        };

        requestAnimationFrame(animate);
    }, [targetValue, duration]);

    return displayValue;
};

const DragonChestPopup: React.FC<DragonChestPopupProps> = ({ isOpen, onClose }) => {
    const [data, setData] = useState<DragonChestData>({
        totalGoldenCoins: 0,
        totalCredits: 0,
        milestone500Reached: false,
        milestone500Distributed: false
    });

    const animatedCoins = useAnimatedCounter(data.totalGoldenCoins);
    const popupRef = useRef<HTMLDivElement>(null);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!isOpen) return;

        const unsubscribe = firebaseService.subscribeToDragonChest((newData) => {
            setData(newData);
        });

        return () => unsubscribe();
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const progress500 = Math.min((data.totalGoldenCoins / 500) * 100, 100);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={popupRef}
                className="relative w-[90vw] max-w-md mx-4 animate-scale-bounce"
            >
                {/* Dragon Chest Container */}
                <div className="relative overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(220,38,38,0.4),0_0_30px_rgba(251,191,36,0.3)]">

                    {/* Animated Border */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_15%,#b91c1c_30%,#fbbf24_45%,#b91c1c_60%,#fbbf24_75%,#b91c1c_90%,#fbbf24_100%)] animate-spin-slow opacity-80 p-[3px] rounded-2xl"></div>

                    {/* Inner Content */}
                    <div className="relative m-[3px] bg-gradient-to-b from-red-950 via-red-900/95 to-black rounded-xl overflow-hidden">

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-red-600/50 transition-all"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="pt-6 pb-4 px-6 text-center border-b border-yellow-500/20">
                            <div className="text-4xl mb-2">🐉</div>
                            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 uppercase tracking-wider">
                                De Drakenschat
                            </h2>
                            <p className="text-xs text-yellow-100/60 mt-1">Realtime Tussenstand</p>
                        </div>

                        {/* Main Content */}
                        <div className="p-6 space-y-6">

                            {/* Golden Coins - Large Display */}
                            <div className="text-center py-4">
                                <div className="relative inline-block">
                                    {/* Coin glow effect */}
                                    <div className="absolute inset-0 blur-xl bg-yellow-400/30 rounded-full"></div>
                                    <span className="relative text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                                        {animatedCoins.toLocaleString()}
                                    </span>
                                    <span className="ml-2 text-3xl">🪙</span>
                                </div>
                                <p className="text-sm text-yellow-200/80 mt-3 font-medium">
                                    Gouden munten in de drakenkist
                                </p>
                            </div>

                            {/* Credits Display */}
                            <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">💳</span>
                                        <span className="text-xs text-gray-400 uppercase tracking-wide">Totaal opgehaald</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-400">
                                        €{data.totalCredits}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 text-center">
                                    1 euro = 1 gouden munt
                                </p>
                            </div>

                            {/* Milestone Progress */}
                            <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🎁</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                                        Mijlpaal: 500 munten
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-3 bg-black/50 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                                        style={{ width: `${progress500}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-center">
                                    {data.milestone500Reached ? (
                                        <span className="text-green-400">✅ Bereikt! Alle bijdragers ontvingen +1 credit</span>
                                    ) : (
                                        <span className="text-yellow-200/60">
                                            Nog {500 - data.totalGoldenCoins} munten te gaan • Alle bijdragers krijgen +1 gratis credit!
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Inspirational Text */}
                            <p className="text-center text-xs text-yellow-100/40 italic">
                                "Elke bijdrage helpt de draak ontwaken"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DragonChestPopup;
