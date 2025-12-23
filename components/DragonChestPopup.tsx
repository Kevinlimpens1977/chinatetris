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

// Check for reduced motion preference
const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Enhanced animated counter hook with scale animation
const useAnimatedCoinCounter = (targetValue: number, isPopupOpen: boolean, duration: number = 1500) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [animationProgress, setAnimationProgress] = useState(0); // 0 = start, 1 = done
    const animationRef = useRef<number | null>(null);
    const hasAnimatedRef = useRef(false);

    useEffect(() => {
        // Reset when popup closes
        if (!isPopupOpen) {
            hasAnimatedRef.current = false;
            setDisplayValue(0);
            setAnimationProgress(0);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        // Skip if already animated this open session or target is 0
        if (hasAnimatedRef.current || targetValue <= 0) {
            if (targetValue > 0) {
                setDisplayValue(targetValue);
                setAnimationProgress(1);
            }
            return;
        }

        // Check reduced motion preference
        if (prefersReducedMotion()) {
            setDisplayValue(targetValue);
            setAnimationProgress(1);
            hasAnimatedRef.current = true;
            return;
        }

        // Small delay before starting animation (let popup appear first)
        const startDelay = setTimeout(() => {
            hasAnimatedRef.current = true;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // EaseOutQuart: fast start, slow finish
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);

                const currentValue = Math.round(targetValue * easeOutQuart);
                setDisplayValue(currentValue);
                setAnimationProgress(progress);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setDisplayValue(targetValue); // Ensure exact final value
                    setAnimationProgress(1);
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        }, 300); // 300ms delay for popup to fully appear

        return () => {
            clearTimeout(startDelay);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [targetValue, isPopupOpen, duration]);

    // Calculate scale: 1.0 → 1.15 at start, back to 1.0 at end
    // Peak scale at ~30% progress for "punch" effect
    const getScale = (): number => {
        if (animationProgress >= 1) return 1.0;
        if (animationProgress <= 0) return 1.0;
        // Bell curve peaking at 0.3 progress
        const peakProgress = 0.3;
        const scaleIntensity = 0.15;
        const normalizedProgress = animationProgress / peakProgress;
        if (animationProgress <= peakProgress) {
            return 1.0 + (scaleIntensity * normalizedProgress);
        } else {
            // Ease back to 1.0
            const fadeProgress = (animationProgress - peakProgress) / (1 - peakProgress);
            return 1.0 + (scaleIntensity * (1 - fadeProgress));
        }
    };

    // Calculate glow intensity: higher during animation
    const getGlowIntensity = (): number => {
        if (animationProgress >= 1) return 1.0;
        if (animationProgress <= 0) return 0.5;
        // Glow peaks at middle of animation
        return 0.5 + (0.8 * Math.sin(animationProgress * Math.PI));
    };

    return {
        displayValue,
        isAnimating: animationProgress > 0 && animationProgress < 1,
        scale: getScale(),
        glowIntensity: getGlowIntensity()
    };
};

const DragonChestPopup: React.FC<DragonChestPopupProps> = ({ isOpen, onClose }) => {
    const [data, setData] = useState<DragonChestData>({
        totalGoldenCoins: 0,
        totalCredits: 0,
        milestone500Reached: false,
        milestone500Distributed: false
    });

    const { displayValue: animatedCoins, scale, glowIntensity } = useAnimatedCoinCounter(data.totalGoldenCoins, isOpen);
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
                <div className="relative overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.4),0_0_30px_rgba(120,53,15,0.3)]">

                    {/* Animated Border - Amber/Orange tones with dark brown */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#78350f_0%,#d97706_20%,#f59e0b_25%,#d97706_30%,#78350f_50%,#d97706_70%,#f59e0b_75%,#d97706_80%,#78350f_100%)] animate-spin-slow opacity-80"></div>

                    {/* Inner Content - 60% opacity amber/brown background */}
                    <div className="relative m-[3px] bg-gradient-to-b from-amber-900/60 via-amber-800/60 to-amber-950/60 backdrop-blur-sm rounded-xl overflow-hidden">

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-amber-600/50 transition-all"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="pt-6 pb-4 px-6 text-center border-b border-amber-500/30">
                            <div className="text-4xl mb-2">🐉</div>
                            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 uppercase tracking-wider">
                                De Drakenschat
                            </h2>
                            <p className="text-sm text-amber-100/70 mt-1">Realtime Tussenstand</p>
                        </div>

                        {/* Main Content */}
                        <div className="p-6 space-y-6">

                            {/* Golden Coins - Large Display */}
                            <div className="text-center py-4">
                                <div
                                    className="relative inline-block transition-transform duration-75"
                                    style={{ transform: `scale(${scale})` }}
                                >
                                    {/* Coin glow effect - intensity varies during animation */}
                                    <div
                                        className="absolute inset-0 blur-xl rounded-full transition-opacity duration-75"
                                        style={{
                                            backgroundColor: `rgba(251, 191, 36, ${0.3 * glowIntensity})`,
                                            transform: `scale(${1 + (glowIntensity - 1) * 0.3})`
                                        }}
                                    ></div>
                                    <span
                                        className="relative text-5xl md:text-6xl font-black text-yellow-400 transition-all duration-75"
                                        style={{
                                            textShadow: `0 0 ${20 * glowIntensity}px rgba(251,191,36,${0.5 * glowIntensity}), 0 0 ${40 * glowIntensity}px rgba(251,191,36,${0.3 * glowIntensity})`
                                        }}
                                    >
                                        {animatedCoins.toLocaleString()}
                                    </span>
                                    <span className="ml-3 text-5xl md:text-6xl font-black text-amber-500 uppercase tracking-wide drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">MUNTEN</span>
                                </div>
                                <p className="text-base text-yellow-200/80 mt-3 font-medium">
                                    Gouden munten in de drakenkist
                                </p>
                            </div>

                            {/* Milestone Progress */}
                            <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🎁</span>
                                    <span className="text-sm text-gray-400 uppercase tracking-wide">
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

                                <p className="text-xs text-center">
                                    {data.milestone500Reached ? (
                                        <span className="text-green-400">✅ Bereikt! Alle bijdragers ontvingen +1 credit</span>
                                    ) : (
                                        <span className="text-yellow-200/60">
                                            Nog {Math.max(0, 500 - data.totalGoldenCoins)} munten te gaan • Alle bijdragers krijgen +1 gratis credit!
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Inspirational Text */}
                            <p className="text-center text-sm text-yellow-100/40 italic">
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
