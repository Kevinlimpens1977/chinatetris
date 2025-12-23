import React, { useState, useEffect } from 'react';

interface TimeLeft {
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    totalDays: number;
    totalHours: number;
}

const CountdownTile: React.FC = () => {
    // Target date: Saturday 25 April 2026 at 17:00 (Dutch time)
    const targetDate = new Date('2026-04-25T17:00:00+02:00');

    const calculateTimeLeft = (): TimeLeft => {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();

        if (difference <= 0) {
            return { weeks: 0, days: 0, hours: 0, minutes: 0, totalDays: 0, totalHours: 0 };
        }

        const totalHours = Math.floor(difference / (1000 * 60 * 60));
        const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(totalDays / 7);
        const days = totalDays % 7;
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        return { weeks, days, hours, minutes, totalDays, totalHours };
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const isLastDay = timeLeft.totalDays < 1;
    const isLastWeek = timeLeft.totalDays < 7 && !isLastDay;

    return (
        <div className="relative w-full">
            {/* Subtle glowing border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/40 via-amber-400/40 to-yellow-500/40 rounded-xl blur-sm"></div>

            {/* Main container - more transparent */}
            <div className="relative bg-gradient-to-br from-red-900/40 via-red-800/30 to-amber-900/30 backdrop-blur-sm rounded-xl border border-yellow-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)] overflow-hidden">

                {/* Content - compact layout */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 md:p-4">

                    {/* Left side: Title and date */}
                    <div className="text-center md:text-left">
                        <h3 className="text-yellow-300 font-black text-xs md:text-sm uppercase tracking-wider">
                            GROTE TREKKING
                        </h3>
                        <p className="text-yellow-100/60 text-[10px] md:text-xs">25 april 2026 om 17:00</p>
                    </div>

                    {/* Center: Countdown display */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Show weeks and days when > 7 days */}
                        {!isLastWeek && !isLastDay && (
                            <>
                                <div className="text-center">
                                    <div className="bg-black/30 rounded-lg px-2 py-1 md:px-3 md:py-2 border border-yellow-500/20">
                                        <span className="text-xl md:text-2xl font-black text-yellow-400 font-mono tabular-nums">
                                            {timeLeft.weeks}
                                        </span>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] text-yellow-200/70 uppercase tracking-widest mt-0.5 block">
                                        weken
                                    </span>
                                </div>
                                <span className="text-yellow-500/70 text-lg md:text-xl font-bold pb-3">:</span>
                                <div className="text-center">
                                    <div className="bg-black/30 rounded-lg px-2 py-1 md:px-3 md:py-2 border border-yellow-500/20">
                                        <span className="text-xl md:text-2xl font-black text-yellow-400 font-mono tabular-nums">
                                            {timeLeft.days}
                                        </span>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] text-yellow-200/70 uppercase tracking-widest mt-0.5 block">
                                        dagen
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Show days and hours during last week */}
                        {isLastWeek && (
                            <>
                                <div className="text-center">
                                    <div className="bg-black/30 rounded-lg px-2 py-1 md:px-3 md:py-2 border border-red-500/40">
                                        <span className="text-xl md:text-2xl font-black text-red-400 font-mono tabular-nums">
                                            {timeLeft.totalDays}
                                        </span>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] text-yellow-200/70 uppercase tracking-widest mt-0.5 block">
                                        dagen
                                    </span>
                                </div>
                                <span className="text-yellow-500/70 text-lg md:text-xl font-bold pb-3">:</span>
                                <div className="text-center">
                                    <div className="bg-black/30 rounded-lg px-2 py-1 md:px-3 md:py-2 border border-red-500/40">
                                        <span className="text-xl md:text-2xl font-black text-red-400 font-mono tabular-nums">
                                            {timeLeft.hours}
                                        </span>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] text-yellow-200/70 uppercase tracking-widest mt-0.5 block">
                                        uren
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Show only hours on the last day */}
                        {isLastDay && (
                            <div className="text-center">
                                <div className="bg-black/30 rounded-lg px-4 py-2 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                    <span className="text-2xl md:text-3xl font-black text-red-400 font-mono tabular-nums">
                                        {timeLeft.totalHours}
                                    </span>
                                </div>
                                <span className="text-[10px] text-red-300/80 uppercase tracking-widest mt-0.5 block font-bold">
                                    uren te gaan!
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right side: Prize description */}
                    <div className="text-center md:text-right max-w-[200px]">
                        <p className="text-yellow-100/80 text-[10px] md:text-xs leading-snug">
                            <span className="text-yellow-400 font-bold">25%</span> van de gouden munten
                            wordt verdeeld over alle tickets
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountdownTile;
