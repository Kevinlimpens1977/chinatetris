import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import TetrisPanel from './TetrisPanel';

const AdminCredits: React.FC = () => {
    const [auth, setAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const checkPassword = () => {
        if (password === 'kevinmaaktalles') {
            setAuth(true);
            fetchData();
        } else {
            alert('Verkeerd wachtwoord!');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        console.log('[AdminCredits] Fetching data...');

        try {
            // 1. Fetch Users (Profiles)
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) {
                console.error('[AdminCredits] Profiles Fetch Error:', profilesError);
            } else {
                setUsers(profiles || []);
            }

            // 2. Fetch Payments (Mocked for current requirement)
            const paymentsData = { payments: [] };
            const paymentsError = null;

            if (paymentsError) {
                console.error('[AdminCredits] Payments Fetch Error:', paymentsError);
            } else {
                if (paymentsData?.payments) {
                    setPayments(paymentsData.payments);
                }
            }

        } catch (err) {
            console.error('[AdminCredits] Unexpected Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!auth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="bg-[#1a1a1a] p-8 rounded border-2 border-[#C92A2A] text-center">
                    <h2 className="text-[#FFD700] font-arcade mb-4 uppercase tracking-widest">ADMIN TOEGANG</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black border border-white text-white p-2 mb-4 w-full"
                        placeholder="Wachtwoord"
                    />
                    <button onClick={checkPassword} className="bg-[#C92A2A] text-white px-4 py-2 font-bold w-full hover:bg-red-700 uppercase tracking-widest">
                        INLOGGEN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-fade-in">
            <TetrisPanel title="GAME PORTAAL ADMIN" className="w-full max-w-6xl mx-auto">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 font-bold uppercase tracking-widest text-xs ${activeTab === 'users' ? 'bg-[#FFD700] text-black' : 'bg-[#333] text-white'}`}
                    >
                        Spelers
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-4 py-2 font-bold uppercase tracking-widest text-xs ${activeTab === 'payments' ? 'bg-[#FFD700] text-black' : 'bg-[#333] text-white'}`}
                    >
                        Stripe Transacties
                    </button>
                    <button
                        onClick={fetchData}
                        className="ml-auto px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-500 uppercase tracking-widest text-xs"
                    >
                        🔄 Verversen
                    </button>
                </div>

                {loading ? (
                    <div className="text-center text-[#FFD700] animate-pulse">Data laden...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#333] text-[#FFD700] font-arcade uppercase tracking-widest text-[10px]">
                                <tr>
                                    {activeTab === 'users' ? (
                                        <>
                                            <th className="p-3">Naam</th>
                                            <th className="p-3">Stad</th>
                                            <th className="p-3">Credits</th>
                                            <th className="p-3">Laatst Gespeeld</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-3">Bedrag</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">User ID</th>
                                            <th className="p-3">Credits Gegeven</th>
                                            <th className="p-3">Datum</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {activeTab === 'users' ? (
                                    users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5">
                                            <td className="p-3 font-bold">{u.name}</td>
                                            <td className="p-3 text-gray-400">{u.city}</td>
                                            <td className="p-3 text-[#FFD700] font-bold">{u.credits} cn</td>
                                            <td className="p-3 text-xs">{new Date(u.last_played || u.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    payments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5">
                                            <td className="p-3 font-bold">€{p.amount?.toFixed(2)}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs font-mono text-gray-500">{p.user_id?.substring(0, 8)}...</td>
                                            <td className="p-3 font-bold text-[#FFD700]">{p.credits}</td>
                                            <td className="p-3 text-xs">{new Date(p.created * 1000).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </TetrisPanel>
        </div>
    );
};

export default AdminCredits;
