import React, { useState, useEffect } from 'react';
import { isAdmin } from '../utils/isAdmin';
import { auth } from '../services/firebase';

// Types for admin data
interface PlayerData {
    uid: string;
    email: string;
    displayName: string;
    credits: number;
    highscore: number;
    ticketCount: number;
    tickets: string[];
}

interface KPIData {
    totalRevenue: number;      // Bruto omzet
    netRevenue: number;        // Netto omzet (na iDEAL fees)
    transactionCount: number;  // Aantal transacties
    totalCreditsSold: number;
    totalTicketsIssued: number;
    totalPlayers: number;
    dragonChestCoins: number;
}

interface TopContributor {
    uid: string;
    email: string;
    totalContributed: number;
}

interface AdminDashboardProps {
    userEmail: string;
    onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userEmail, onBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [kpis, setKpis] = useState<KPIData>({
        totalRevenue: 0,
        netRevenue: 0,
        transactionCount: 0,
        totalCreditsSold: 0,
        totalTicketsIssued: 0,
        totalPlayers: 0,
        dragonChestCoins: 0
    });
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ ticketId: string; playerName: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Security check
    useEffect(() => {
        if (!isAdmin(userEmail)) {
            console.error('⛔ Non-admin attempted to access dashboard');
            onBack();
        }
    }, [userEmail, onBack]);

    // Load all admin data
    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setIsLoading(true);
        try {
            const { collection, getDocs, doc, getDoc, query, where } = await import('firebase/firestore');
            const { db } = await import('../services/firebase');

            if (!db) {
                console.error('Firestore not available');
                return;
            }

            // 1. Load transactions for revenue & credits sold
            // iDEAL fee: €0.29 flat per transaction
            const IDEAL_FEE = 0.29;
            const transactionsSnap = await getDocs(collection(db, 'transactions'));
            let totalRevenue = 0;
            let totalCreditsSold = 0;
            let transactionCount = 0;
            transactionsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'completed') {
                    totalRevenue += (data.amountCents || 0) / 100;
                    totalCreditsSold += data.credits || 0;
                    transactionCount++;
                }
            });
            const netRevenue = totalRevenue - (transactionCount * IDEAL_FEE);

            // 2. Load all tickets
            const ticketsSnap = await getDocs(collection(db, 'tickets'));
            const ticketsByUser: Record<string, string[]> = {};
            ticketsSnap.docs.forEach(doc => {
                const uid = doc.data().uid;
                if (!ticketsByUser[uid]) ticketsByUser[uid] = [];
                ticketsByUser[uid].push(doc.id);
            });

            // 3. Load all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const playersData: PlayerData[] = usersSnap.docs.map(doc => {
                const data = doc.data();
                const uid = doc.id;
                return {
                    uid,
                    email: data.email || '',
                    displayName: data.displayName || 'Onbekend',
                    credits: data.credits || 0,
                    highscore: data.highscore || 0,
                    ticketCount: ticketsByUser[uid]?.length || 0,
                    tickets: ticketsByUser[uid] || []
                };
            });

            // 4. Load Dragon Chest
            const chestDoc = await getDoc(doc(db, 'system', 'dragonChest'));
            const dragonChestCoins = chestDoc.exists() ? (chestDoc.data().totalGoldenCoins || 0) : 0;

            // 5. Load contributors
            const contributorsSnap = await getDocs(collection(db, 'contributors'));
            const contributors: TopContributor[] = contributorsSnap.docs
                .map(doc => ({
                    uid: doc.id,
                    email: '', // Will be filled from users
                    totalContributed: doc.data().totalContributed || 0
                }))
                .sort((a, b) => b.totalContributed - a.totalContributed)
                .slice(0, 5);

            // Enrich contributors with email from users
            for (const contributor of contributors) {
                const player = playersData.find(p => p.uid === contributor.uid);
                if (player) {
                    contributor.email = player.email;
                }
            }

            // Set state
            setKpis({
                totalRevenue,
                netRevenue,
                transactionCount,
                totalCreditsSold,
                totalTicketsIssued: ticketsSnap.size,
                totalPlayers: usersSnap.size,
                dragonChestCoins
            });
            setPlayers(playersData.sort((a, b) => b.ticketCount - a.ticketCount));
            setTopContributors(contributors);

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTicket = async () => {
        if (!deleteModal) return;

        setIsDeleting(true);
        try {
            const currentUser = auth?.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const idToken = await currentUser.getIdToken();

            const response = await fetch('/api/admin-delete-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ ticketId: deleteModal.ticketId })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete ticket');
            }

            // Update local state
            setPlayers(prev => prev.map(player => ({
                ...player,
                tickets: player.tickets.filter(t => t !== deleteModal.ticketId),
                ticketCount: player.tickets.filter(t => t !== deleteModal.ticketId).length
            })));

            setKpis(prev => ({
                ...prev,
                totalTicketsIssued: prev.totalTicketsIssued - 1
            }));

            setFeedback({ type: 'success', message: `Ticket ${deleteModal.ticketId} verwijderd!` });

        } catch (error: any) {
            console.error('Delete ticket error:', error);
            setFeedback({ type: 'error', message: error.message || 'Fout bij verwijderen' });
        } finally {
            setIsDeleting(false);
            setDeleteModal(null);
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    // Filter players based on search
    const filteredPlayers = players.filter(player =>
        player.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.uid.includes(searchQuery)
    );

    // Top 5 ticket holders for chart
    const topTicketHolders = [...players]
        .sort((a, b) => b.ticketCount - a.ticketCount)
        .slice(0, 5)
        .filter(p => p.ticketCount > 0);

    const maxTickets = topTicketHolders[0]?.ticketCount || 1;

    if (!isAdmin(userEmail)) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300">
                        ⚙️ Admin Dashboard
                    </h1>
                    <p className="text-sm text-yellow-100/60">
                        Ingelogd als: {userEmail}
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-red-800/50 hover:bg-red-700/50 rounded-lg text-white transition-colors"
                >
                    ← Terug
                </button>
            </div>

            {/* Feedback Toast */}
            {feedback && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {feedback.message}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin text-4xl">🐉</div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <KPICard
                            title="Bruto Omzet"
                            value={`€${kpis.totalRevenue.toFixed(2)}`}
                            icon="💰"
                            color="from-green-600 to-green-800"
                        />
                        <KPICard
                            title="Netto Omzet"
                            value={`€${kpis.netRevenue.toFixed(2)}`}
                            subtitle={`-€${(kpis.transactionCount * 0.29).toFixed(2)} iDEAL fees`}
                            icon="📊"
                            color="from-emerald-600 to-emerald-800"
                        />
                        <KPICard
                            title="Transacties"
                            value={kpis.transactionCount.toString()}
                            subtitle="iDEAL betalingen"
                            icon="🏦"
                            color="from-cyan-600 to-cyan-800"
                        />
                        <KPICard
                            title="Credits Verkocht"
                            value={kpis.totalCreditsSold.toString()}
                            icon="🎮"
                            color="from-blue-600 to-blue-800"
                        />
                        <KPICard
                            title="Tickets Uitgegeven"
                            value={kpis.totalTicketsIssued.toString()}
                            icon="🎫"
                            color="from-purple-600 to-purple-800"
                        />
                        <KPICard
                            title="Spelers"
                            value={kpis.totalPlayers.toString()}
                            icon="👥"
                            color="from-amber-600 to-amber-800"
                        />
                        <KPICard
                            title="Drakenschat"
                            value={`${kpis.dragonChestCoins} munten`}
                            icon="🐉"
                            color="from-red-600 to-red-800"
                        />
                    </div>

                    {/* Two-column layout for charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Top Ticket Holders */}
                        <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/20">
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">🏆 Top 5 Ticket Houders</h3>
                            {topTicketHolders.length === 0 ? (
                                <p className="text-gray-400">Geen tickets uitgegeven</p>
                            ) : (
                                <div className="space-y-3">
                                    {topTicketHolders.map((player, i) => (
                                        <div key={player.uid} className="flex items-center gap-3">
                                            <span className="text-lg w-6">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                                            <div className="flex-1">
                                                <div className="text-sm text-white truncate">{player.displayName}</div>
                                                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full transition-all"
                                                        style={{ width: `${(player.ticketCount / maxTickets) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-yellow-400 font-bold">{player.ticketCount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Contributors */}
                        <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/20">
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">💎 Top Bijdragers (Drakenschat)</h3>
                            {topContributors.length === 0 ? (
                                <p className="text-gray-400">Geen bijdragen</p>
                            ) : (
                                <div className="space-y-2">
                                    {topContributors.map((contributor, i) => (
                                        <div key={contributor.uid} className="flex items-center justify-between px-3 py-2 bg-black/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                                                <span className="text-sm truncate max-w-[150px]">{contributor.email || contributor.uid.slice(0, 8)}</span>
                                            </div>
                                            <span className="text-green-400 font-bold">€{contributor.totalContributed}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Player Table */}
                    <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-bold text-yellow-400">👥 Spelers & Tickets</h3>
                            <input
                                type="text"
                                placeholder="Zoek op naam, email of UID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none w-full md:w-64"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left py-2 px-2 text-gray-400">Naam</th>
                                        <th className="text-left py-2 px-2 text-gray-400 hidden md:table-cell">Email</th>
                                        <th className="text-right py-2 px-2 text-gray-400">Credits</th>
                                        <th className="text-right py-2 px-2 text-gray-400">Tickets</th>
                                        <th className="text-right py-2 px-2 text-gray-400 hidden md:table-cell">Highscore</th>
                                        <th className="text-center py-2 px-2 text-gray-400">Acties</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.map(player => (
                                        <React.Fragment key={player.uid}>
                                            <tr className="border-b border-gray-800 hover:bg-white/5">
                                                <td className="py-2 px-2">{player.displayName}</td>
                                                <td className="py-2 px-2 text-gray-400 hidden md:table-cell truncate max-w-[200px]">
                                                    {player.email}
                                                </td>
                                                <td className="py-2 px-2 text-right text-blue-400">{player.credits}</td>
                                                <td className="py-2 px-2 text-right text-yellow-400">{player.ticketCount}</td>
                                                <td className="py-2 px-2 text-right text-green-400 hidden md:table-cell">
                                                    {player.highscore.toLocaleString()}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    {player.ticketCount > 0 && (
                                                        <button
                                                            onClick={() => setExpandedPlayer(
                                                                expandedPlayer === player.uid ? null : player.uid
                                                            )}
                                                            className="text-xs px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 rounded"
                                                        >
                                                            {expandedPlayer === player.uid ? '▲' : '▼'} Tickets
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Expanded ticket list */}
                                            {expandedPlayer === player.uid && player.tickets.length > 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-4 bg-black/40">
                                                        <div className="text-xs text-gray-400 mb-2">
                                                            UID: <code className="bg-black/50 px-1 rounded">{player.uid}</code>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {player.tickets.map(ticketId => (
                                                                <div
                                                                    key={ticketId}
                                                                    className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-600/30 rounded px-2 py-1"
                                                                >
                                                                    <span className="text-xs text-yellow-300">{ticketId}</span>
                                                                    <button
                                                                        onClick={() => setDeleteModal({
                                                                            ticketId,
                                                                            playerName: player.displayName
                                                                        })}
                                                                        className="text-red-400 hover:text-red-300 text-xs"
                                                                        title="Verwijder ticket"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPlayers.length === 0 && (
                                <p className="text-center text-gray-400 py-8">Geen spelers gevonden</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gradient-to-b from-red-900 to-red-950 rounded-xl p-6 max-w-md mx-4 border border-red-500/30 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">⚠️ Ticket Verwijderen?</h3>
                        <p className="text-gray-300 mb-2">
                            Weet je zeker dat je dit ticket wilt verwijderen?
                        </p>
                        <div className="bg-black/30 rounded p-3 mb-4">
                            <p className="text-sm text-gray-400">Ticket ID:</p>
                            <code className="text-yellow-400">{deleteModal.ticketId}</code>
                            <p className="text-sm text-gray-400 mt-2">Eigenaar:</p>
                            <span className="text-white">{deleteModal.playerName}</span>
                        </div>
                        <p className="text-red-400 text-sm mb-4">
                            ⚠️ Deze actie kan niet ongedaan worden gemaakt!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                disabled={isDeleting}
                            >
                                Annuleren
                            </button>
                            <button
                                onClick={handleDeleteTicket}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// KPI Card Component
const KPICard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
}> = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-lg`}>
        <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-white/70 uppercase tracking-wide">{title}</span>
        </div>
        <div className="text-xl md:text-2xl font-black text-white">{value}</div>
        {subtitle && (
            <div className="text-xs text-white/50 mt-1">{subtitle}</div>
        )}
    </div>
);

export default AdminDashboard;
