import React, { useState } from 'react';
import { LeaderboardEntry, UserData } from '../types';
import GhostInfoPanel from './GhostInfoPanel';
import DragonChestPopup from './DragonChestPopup';
import CountdownTile from './CountdownTile';

interface TitleScreenProps {
    onStart: () => void;
    onLogout: () => void;
    onOpenCreditShop: () => void;
    leaderboard: LeaderboardEntry[];
    user: UserData | null;
}

interface ChinaContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    noPadding?: boolean;
}

// Helper: Festive Container with Animated Gradient Border (China Theme)
const ChinaContainer: React.FC<ChinaContainerProps> = ({
    children,
    className = "",
    delay = 0,
    noPadding = false
}) => {
    return (
        <div
            className={`relative group ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Clipping Container for Border Effect */}
            <div className="relative w-full h-full overflow-hidden rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] p-[2px] md:p-[3px]">
                {/* Animated Spinning Border - Red & Gold */}
                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                {/* Inner Content */}
                <div className={`relative h-full w-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-2px)] md:rounded-[calc(0.75rem-3px)] overflow-hidden ${noPadding ? "" : "p-4 md:p-6"}`}>
                    {/* Golden shine on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/0 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Helper function to format names for privacy (GDPR compliant)
// Shows first name + first letter of last name only
const formatPrivacyName = (fullName: string | undefined): string => {
    if (!fullName) return 'PLAYER';

    // Split by space or underscore
    const parts = fullName.replace(/_/g, ' ').trim().split(/\s+/);

    if (parts.length === 1) {
        // Only one name, show it as-is
        return parts[0].toUpperCase();
    }

    // First name + first letter of last name
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();

    return `${firstName.toUpperCase()}_${lastInitial}.`;
};

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onLogout, onOpenCreditShop, leaderboard, user }) => {
    const [showGhostInfo, setShowGhostInfo] = useState(false);
    const [showDragonChest, setShowDragonChest] = useState(false);

    const hasCredits = (user?.credits || 0) > 0;

    const handleStartClick = () => {
        if (hasCredits) {
            onStart();
        } else {
            onOpenCreditShop();
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center w-full h-full min-h-[100dvh] overflow-y-auto overflow-x-hidden py-4 px-4 md:py-8">


            {/* HEADER SECTION */}

            <div className="flex flex-col items-center justify-center mt-8 md:mt-12 w-full shrink-0 relative z-10 text-center">

                {/* 3D Title */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-none mb-4 md:mb-6 relative z-10 text-center select-none"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        color: '#ef4444',
                        WebkitTextStroke: '2px #fbbf24',
                        textShadow: `
                            0 0 20px rgba(220, 38, 38, 0.5),
                            2px 2px 0 #991b1b,
                            4px 4px 0 #450a0a,
                            6px 6px 15px rgba(0,0,0,0.5)
                        `
                    }}>
                    CHINA<br />TETRIS
                </h1>

                {/* Dragon Chest Button - BELOW TITLE with enhanced styling */}
                <button
                    onClick={() => setShowDragonChest(true)}
                    className="relative inline-block mb-6 cursor-pointer hover:scale-110 transition-all duration-300 group"
                >
                    {/* Animated fire/gold glow background */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 animate-pulse transition-opacity"></div>

                    {/* Secondary pulsing ring */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-xl opacity-0 group-hover:opacity-50 animate-ping"></div>

                    {/* Shimmer effect - always running */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent -translate-x-full animate-shimmer"></div>
                    </div>

                    {/* Button content */}
                    <div className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-6 py-3 rounded-xl border-2 border-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] flex items-center gap-3">
                        <span className="text-2xl md:text-3xl animate-bounce">🐉</span>
                        <span className="text-sm md:text-base font-black uppercase tracking-wider text-red-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
                            Bekijk de Drakenschat
                        </span>
                        <span className="text-2xl md:text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🐉</span>
                    </div>
                </button>

                {/* User Info & Action */}
                <div className="w-full max-w-md mx-auto mb-8">
                    <ChinaContainer className="w-full">
                        <div className="flex flex-col gap-6 items-center p-4">

                            {/* Welcome User */}
                            {user && (
                                <div className="text-center flex flex-col items-center gap-3">
                                    <p className="text-sm md:text-base text-yellow-100/80 flex items-center justify-center gap-2">
                                        Ni hao, <span className="font-bold text-white text-lg">{user.name}</span>
                                    </p>
                                    <button
                                        onClick={onLogout}
                                        className="px-4 py-1.5 rounded-full bg-gray-700/60 hover:bg-red-600/80 text-gray-300 hover:text-white text-xs font-medium uppercase tracking-wider transition-all duration-200 border border-gray-600/50 hover:border-red-500/50"
                                    >
                                        Uitloggen
                                    </button>
                                </div>
                            )}


                            {/* CTA Button */}
                            <button
                                onClick={handleStartClick}
                                className={`group relative w-full px-8 py-4 rounded-full text-white font-black text-xl md:text-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border ${hasCredits
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] hover:from-red-500 hover:to-red-600 border-red-400/30'
                                    : 'bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] hover:from-green-500 hover:to-green-600 border-green-400/30'
                                    }`}
                            >
                                <span className="animate-bounce">{hasCredits ? '🕹️' : '🪙'}</span>
                                {hasCredits ? 'SPEEL SPEL' : 'KOOP TOKENS'}
                                <span className="animate-bounce delay-100">{hasCredits ? '🕹️' : '💳'}</span>
                            </button>

                            {/* Buy More Tokens (only shown if has credits) */}
                            {hasCredits && (
                                <button
                                    onClick={onOpenCreditShop}
                                    className="group relative w-full px-6 py-2 rounded-full bg-gradient-to-r from-green-700/80 to-emerald-700/80 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xs md:text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-green-400/20"
                                >
                                    <span className="text-base">💰</span>
                                    <span>Meer Tokens Kopen</span>
                                </button>
                            )}

                            {/* Ghost Info Button */}
                            <button
                                onClick={() => setShowGhostInfo(true)}
                                className="group relative w-full sm:w-auto px-6 py-2 rounded-full bg-gradient-to-r from-yellow-700/80 to-amber-700/80 hover:from-yellow-600 hover:to-amber-600 text-white font-bold text-xs md:text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-yellow-400/20"
                            >
                                <span className="text-lg">👻</span>
                                <span>Geest & Strafpunten Info</span>
                            </button>
                        </div>
                    </ChinaContainer>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="w-full flex flex-col md:flex-row justify-center items-start gap-6 md:gap-8 pb-8 px-2">

                {/* Left Column: Info Boxes */}
                <div className="flex flex-col gap-4 md:gap-6 text-left w-full md:w-auto md:max-w-[400px]">
                    <ChinaContainer className="bg-gradient-to-br from-red-950/40 to-black/60">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">🏆</div>
                            <div>
                                <h3 className="text-yellow-400 font-black text-sm md:text-lg mb-1">Jouw Prestaties</h3>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 uppercase font-bold tracking-widest">Tokens:</span>
                                        <span className={`text-lg md:text-xl font-mono font-black ${hasCredits ? 'text-green-400' : 'text-red-400'}`}>{user?.credits || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 uppercase font-bold tracking-widest">Highscore:</span>
                                        <span className="text-lg md:text-xl font-mono font-black text-white">{(user?.highscore || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 uppercase font-bold tracking-widest">Tickets:</span>
                                        <span className="text-lg md:text-xl font-mono font-black text-yellow-400">{user?.tickets || 0}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-yellow-100/40 mt-2 leading-tight">
                                    Je persoonlijke record en totaal aantal verzamelde tickets uit alle gespeelde spellen.
                                </p>
                            </div>
                        </div>
                    </ChinaContainer>

                    <ChinaContainer className="bg-gradient-to-br from-yellow-950/40 to-black/60" delay={200}>
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">🎟️</div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-yellow-200 font-black text-sm md:text-lg mb-1">Ticket Collectie</h3>
                                <div className="text-xs text-yellow-100/60 uppercase tracking-widest font-bold mb-2">Unieke ID's in jouw bezit:</div>

                                {user?.ticketNames && user.ticketNames.length > 0 ? (
                                    <div className="mt-1 mb-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-2">
                                            {user.ticketNames.map((name, i) => (
                                                <div key={i} className="bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1 text-xs font-mono text-yellow-200 flex items-center gap-1 group/ticket hover:bg-yellow-400/20 transition-colors">
                                                    <span className="opacity-50">#</span>
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center border border-dashed border-white/10 rounded mb-3">
                                        <p className="text-xs text-gray-500 italic">Nog geen unieke tickets gewonnen.</p>
                                    </div>
                                )}

                                <p className="text-[11px] text-gray-500 italic leading-tight">
                                    Hoe meer tickets hoe meer kans op de gouden munten
                                </p>
                            </div>
                        </div>
                    </ChinaContainer>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="h-full min-h-[300px] w-full md:w-auto md:min-w-[240px] md:max-w-[300px]">
                    <ChinaContainer className="h-full flex flex-col bg-gradient-to-b from-red-950/60 to-black/80" noPadding={true}>
                        {/* Retro Header */}
                        <div className="p-3 md:p-4 border-b border-red-500/30 text-center shrink-0">
                            <h2 className="text-sm md:text-base font-black uppercase tracking-[0.3em] text-red-400"
                                style={{ fontFamily: 'monospace', textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
                                HOOGSTE SCORE
                            </h2>
                        </div>

                        {/* Retro Leaderboard List */}
                        <div className="flex-1 p-3 md:p-4 overflow-y-auto scrollbar-hide">
                            {leaderboard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                    <span className="text-4xl mb-2 opacity-50">🐉</span>
                                    <p className="text-sm italic font-mono">WAITING FOR PLAYERS...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.slice(0, 7).map((entry, idx) => {
                                        // Retro color scheme: Gold, Silver, Bronze for top 3
                                        const rankColors = [
                                            'text-yellow-400', // #1 Gold
                                            'text-cyan-400',   // #2 Cyan/Silver
                                            'text-green-400',  // #3 Green/Bronze
                                        ];
                                        const scoreColors = [
                                            'text-yellow-400',
                                            'text-cyan-400',
                                            'text-green-400',
                                        ];
                                        const rankColor = rankColors[idx] || 'text-gray-400';
                                        const scoreColor = scoreColors[idx] || 'text-white';

                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between font-mono text-xs md:text-sm tracking-wide"
                                                style={{ fontFamily: 'monospace' }}
                                            >
                                                {/* Rank & Name */}
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className={`${rankColor} font-black w-6 shrink-0`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-white font-bold uppercase truncate">
                                                        {formatPrivacyName(entry.name)}
                                                    </span>
                                                </div>
                                                {/* Score */}
                                                <span className={`${scoreColor} font-black tabular-nums shrink-0 ml-2`}>
                                                    {entry.highscore?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ChinaContainer>
                </div>
            </div>

            {/* Countdown Tile - Full width at bottom */}
            <div className="w-full flex justify-center px-2 pb-8">
                <div className="w-full" style={{ maxWidth: 'calc(400px + 300px + 2rem)' }}>
                    <CountdownTile />
                </div>
            </div>

            {/* Ghost Info Panel Modal */}
            {showGhostInfo && (
                <GhostInfoPanel onClose={() => setShowGhostInfo(false)} />
            )}

            {/* Dragon Chest Popup Modal */}
            <DragonChestPopup
                isOpen={showDragonChest}
                onClose={() => setShowDragonChest(false)}
            />
        </div>
    );
};

export default TitleScreen;