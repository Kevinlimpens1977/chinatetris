import React, { useState } from 'react';

interface GhostInfoPanelProps {
    onClose?: () => void;
}

const GhostInfoPanel: React.FC<GhostInfoPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'ghost' | 'rewards'>('ghost');

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">

            {/* Wrapper */}
            <div className="relative group max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                {/* Lantern Decoration */}
                <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12">
                    <div className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">🏮</div>
                </div>

                {/* Container */}
                <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.3)] p-[2px] md:p-[3px]">
                    {/* Border */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-60"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/90 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] p-4 md:p-8">

                        {/* Header */}
                        <div className="text-center mb-4 md:mb-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-4xl animate-pulse">🎮</span>
                                <h2
                                    className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 uppercase tracking-tight"
                                    style={{
                                        textShadow: '0 0 30px rgba(220, 38, 38, 0.4)'
                                    }}
                                >
                                    Game Info
                                </h2>
                                <span className="text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>🐲</span>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('ghost')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all ${activeTab === 'ghost'
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                            >
                                👻 Ghost & Strafpunten
                            </button>
                            <button
                                onClick={() => setActiveTab('rewards')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all ${activeTab === 'rewards'
                                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                            >
                                🎁 Beloningen
                            </button>
                        </div>

                        {/* Ghost Tab Content */}
                        {activeTab === 'ghost' && (
                            <>
                                {/* Explanation */}
                                <div className="bg-white/5 rounded-xl p-4 md:p-6 mb-6 border border-purple-500/20">
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed text-center">
                                        <span className="font-bold text-purple-400">Ghost stenen</span> helpen je zien waar een blokje landt,
                                        maar kosten <span className="font-bold text-red-400">punten</span>.
                                        Hoe hoger het level, hoe hoger de straf.
                                        Vanaf <span className="font-bold text-red-400">level 7</span> kun je ghost weer gebruiken —
                                        <span className="font-bold text-yellow-400"> jij kiest: hulp of puntenverlies</span>.
                                    </p>
                                </div>

                                {/* Penalty Table */}
                                <div className="bg-gradient-to-br from-gray-900/50 to-purple-900/10 rounded-xl overflow-hidden border border-white/10 mb-6">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-3 gap-3 p-3 md:p-4 bg-black/40 border-b border-white/10">
                                        <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                            Level
                                        </div>
                                        <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                            Ghost Status
                                        </div>
                                        <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                            Strafpunten
                                        </div>
                                    </div>

                                    {/* Table Rows */}
                                    {[
                                        { level: '1', status: 'Toegestaan', penalty: '-3', color: 'green' },
                                        { level: '2', status: 'Toegestaan', penalty: '-5', color: 'green' },
                                        { level: '3-6', status: 'VERBODEN', penalty: '—', color: 'red' },
                                        { level: '7', status: 'Toegestaan', penalty: '-10', color: 'yellow' },
                                        { level: '8', status: 'Toegestaan', penalty: '-12', color: 'yellow' },
                                        { level: '9', status: 'Toegestaan', penalty: '-15', color: 'orange' },
                                        { level: '10', status: 'Toegestaan', penalty: '-20', color: 'red' },
                                    ].map((row, idx) => (
                                        <div
                                            key={idx}
                                            className={`grid grid-cols-3 gap-3 p-3 md:p-4 text-xs md:text-sm border-b border-white/5 last:border-0 items-center ${row.status === 'VERBODEN' ? 'bg-red-900/20' : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="text-center font-bold text-yellow-200">
                                                {row.level}
                                            </div>
                                            <div className={`text-center font-medium ${row.status === 'VERBODEN'
                                                ? 'text-red-400 font-black'
                                                : 'text-green-400'
                                                }`}>
                                                {row.status}
                                            </div>
                                            <div className={`text-center font-mono font-black ${row.color === 'green' ? 'text-green-400' :
                                                row.color === 'yellow' ? 'text-yellow-400' :
                                                    row.color === 'orange' ? 'text-orange-400' :
                                                        row.color === 'red' ? 'text-red-400' :
                                                            'text-gray-500'
                                                }`}>
                                                {row.penalty}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tips */}
                                <div className="bg-gradient-to-r from-purple-900/30 to-yellow-900/30 rounded-xl p-4 md:p-5 border border-purple-500/20 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <h3 className="text-sm md:text-base font-bold text-purple-400 mb-2">Pro Tips:</h3>
                                            <ul className="text-xs md:text-sm text-gray-300 space-y-1 list-disc list-inside">
                                                <li>Ghost is <span className="font-bold text-yellow-400">standaard UIT</span> - jij beslist wanneer je het gebruikt</li>
                                                <li>In <span className="font-bold text-red-500">level 3-6</span> is ghost volledig uitgeschakeld</li>
                                                <li>Vanaf <span className="font-bold text-green-400">level 7</span> krijg je een melding dat ghost weer beschikbaar is</li>
                                                <li>Gebruik ghost <span className="font-bold text-yellow-400">strategisch</span> - alleen wanneer je het echt nodig hebt!</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Rewards Tab Content */}
                        {activeTab === 'rewards' && (
                            <>
                                {/* Bonus Credit Section */}
                                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 md:p-6 mb-6 border border-green-500/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">🎰</span>
                                        <h3 className="text-lg md:text-xl font-bold text-green-400">Bonus Credit</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                                        Bereik <span className="font-bold text-green-400 text-lg">20.000 punten</span> tijdens een game en ontvang
                                        <span className="font-bold text-yellow-400"> +1 gratis credit!</span>
                                    </p>
                                    <div className="bg-black/30 rounded-lg p-3 flex items-center justify-center gap-4">
                                        <span className="text-2xl">🎯</span>
                                        <span className="text-yellow-400 font-bold">20.000 punten</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-green-400 font-bold">+1 Credit</span>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                </div>

                                {/* High Score Record Bonus */}
                                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 md:p-6 mb-6 border border-purple-500/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">👑</span>
                                        <h3 className="text-lg md:text-xl font-bold text-purple-400">Highscore Record Bonus</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                                        Verbreek de <span className="font-bold text-purple-400">overall hoogste score</span> en ontvang
                                        <span className="font-bold text-yellow-400"> +3 gratis credits!</span>
                                    </p>
                                    <div className="bg-black/30 rounded-lg p-3 flex items-center justify-center gap-4">
                                        <span className="text-2xl">🏆</span>
                                        <span className="text-purple-400 font-bold">Nieuw Record</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-green-400 font-bold">+3 Credits</span>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                </div>

                                {/* Ticket Leader Bonus */}
                                <div className="bg-gradient-to-r from-cyan-900/40 to-teal-900/40 rounded-xl p-4 md:p-6 mb-6 border border-cyan-500/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">🎟️</span>
                                        <h3 className="text-lg md:text-xl font-bold text-cyan-400">Ticket Leider Bonus</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                                        Wordt de <span className="font-bold text-cyan-400">nieuwe #1 ticket houder</span> door een andere speler in te halen en ontvang
                                        <span className="font-bold text-yellow-400"> +1 gratis credit!</span>
                                    </p>
                                    <div className="bg-black/30 rounded-lg p-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-2xl">🎟️</span>
                                            <span className="text-cyan-400 font-bold">Nieuwe #1</span>
                                            <span className="text-gray-500">→</span>
                                            <span className="text-green-400 font-bold">+1 Credit</span>
                                            <span className="text-2xl">💰</span>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center italic">
                                            ⚠️ Alleen bij het inhalen van een andere speler, niet bij eigen tickets toevoegen
                                        </p>
                                    </div>
                                </div>

                                {/* Ticket Thresholds Section */}
                                <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 rounded-xl p-4 md:p-6 mb-6 border border-yellow-500/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">🎟️</span>
                                        <h3 className="text-lg md:text-xl font-bold text-yellow-400">Tickets Verdienen</h3>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-4">
                                        Hoe hoger je score, hoe meer tickets je verdient. Meer tickets = grotere kans op de <span className="font-bold text-yellow-400">gouden munten</span>!
                                    </p>

                                    {/* Ticket Table */}
                                    <div className="bg-black/30 rounded-xl overflow-hidden border border-yellow-500/20">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 border-b border-white/10">
                                            <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                                Score
                                            </div>
                                            <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                                Tickets
                                            </div>
                                        </div>

                                        {/* Table Rows */}
                                        {[
                                            { score: '5.000+', tickets: '1', color: 'gray' },
                                            { score: '10.000+', tickets: '2', color: 'gray' },
                                            { score: '15.000+', tickets: '3', color: 'yellow' },
                                            { score: '20.000+', tickets: '4', color: 'yellow' },
                                            { score: '25.000+', tickets: '5', color: 'yellow' },
                                            { score: '30.000+', tickets: '6', color: 'orange' },
                                            { score: '40.000+', tickets: '8', color: 'orange' },
                                            { score: '50.000+', tickets: '10', color: 'red' },
                                            { score: '80.000+', tickets: '15', color: 'red', special: true },
                                        ].map((row, idx) => (
                                            <div
                                                key={idx}
                                                className={`grid grid-cols-2 gap-3 p-3 text-xs md:text-sm border-b border-white/5 last:border-0 items-center hover:bg-white/5 ${row.special ? 'bg-gradient-to-r from-red-900/30 to-yellow-900/30' : ''
                                                    }`}
                                            >
                                                <div className="text-center font-bold text-white">
                                                    {row.score}
                                                </div>
                                                <div className={`text-center font-mono font-black flex items-center justify-center gap-1 ${row.color === 'gray' ? 'text-gray-400' :
                                                    row.color === 'yellow' ? 'text-yellow-400' :
                                                        row.color === 'orange' ? 'text-orange-400' :
                                                            'text-red-400'
                                                    }`}>
                                                    🎟️ {row.tickets}
                                                    {row.special && <span className="ml-1">🏆</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dragon Chest Info */}
                                <div className="bg-gradient-to-r from-red-900/30 to-amber-900/30 rounded-xl p-4 md:p-5 border border-red-500/20 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🐉</span>
                                        <div>
                                            <h3 className="text-sm md:text-base font-bold text-red-400 mb-2">Verdeling van de Drakenkist Munten</h3>
                                            <p className="text-xs md:text-sm text-gray-300">
                                                Verzamel tickets door hoge scores te halen. Hoe meer tickets, hoe groter je kans op de
                                                <span className="font-bold text-yellow-400"> gouden munten uit de drakenkist</span>!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Close Button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-sm md:text-base shadow-lg transition-transform transform hover:scale-[1.02] uppercase tracking-wider border border-red-500/30"
                            >
                                Begrepen! 🐉
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GhostInfoPanel;
