import React, { useState } from 'react';
import { buyCredits } from '../services/payments';

const PayWhatYouWant: React.FC = () => {
    const [amount, setAmount] = useState<number>(15);
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        if (amount < 15) return;
        setLoading(true);
        await buyCredits('pwyw', amount);
        setLoading(false);
    };

    return (
        <div className="w-full bg-[#1a1a1a] border-2 border-[#C92A2A] rounded-lg p-6 shadow-md transition-all hover:border-[#FFD700]">
            <h3 className="text-xl font-bold text-white mb-2 font-arcade">Custom Credit Bundle</h3>
            <p className="text-white/60 text-sm mb-6">Purchase a custom bundle of digital credits to continue playing.</p>

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
                <span className="text-white text-lg">Total Price: </span>
                <span className="text-[#FFD700] text-3xl font-bold font-arcade drop-shadow-md">€{amount}</span>
            </div>

            <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-4 bg-[#FFD700] text-black font-bold text-xl rounded font-arcade border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? 'Processing...' : 'Purchase Credits'}
            </button>
            <p className="text-center text-xs text-white/40 mt-3">Minimum €15 for 5 digital credits</p>
        </div>
    );
};

export default PayWhatYouWant;
