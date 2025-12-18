import React, { useState } from 'react';
import { buyCredits } from '../services/payments';

const PayWhatYouWant: React.FC = () => {
    const [amount, setAmount] = useState<number>(15);
    const [loading, setLoading] = useState(false);

    const handleDonate = async () => {
        if (amount < 15) return;
        setLoading(true);
        await buyCredits('pwyw', amount);
        setLoading(false);
    };

    return (
        <div className="w-full bg-[#1a1a1a] border-2 border-[#C92A2A] rounded-lg p-6 shadow-md transition-all hover:border-[#FFD700]">
            <h3 className="text-xl font-bold text-white mb-2 font-arcade">Bepaal je eigen prijs</h3>
            <p className="text-white/60 text-sm mb-6">Steun ons met een extra donatie!</p>

            <div className="relative mb-6">
                <input
                    type="range"
                    min="15"
                    max="100"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
                />
            </div>

            <div className="text-center mb-6">
                <span className="text-white text-lg">Je doneert: </span>
                <span className="text-[#FFD700] text-3xl font-bold font-arcade drop-shadow-md">€{amount}</span>
            </div>

            <button
                onClick={handleDonate}
                disabled={loading}
                className="w-full py-4 bg-[#FFD700] text-black font-bold text-xl rounded font-arcade border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? 'Momentje...' : 'Betaal dit bedrag'}
            </button>
            <p className="text-center text-xs text-white/40 mt-3">Minimaal €15 voor 5 credits</p>
        </div>
    );
};

export default PayWhatYouWant;
