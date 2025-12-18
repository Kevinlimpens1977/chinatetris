import React from 'react';
import TetrisPanel from './TetrisPanel';

interface CreditCancelScreenProps {
    onBack: () => void;
}

const CreditCancelScreen: React.FC<CreditCancelScreenProps> = ({ onBack }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <TetrisPanel title="GEANNULEERD" className="w-full max-w-md text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-xl text-white font-bold mb-4 uppercase tracking-widest">Transactie Geannuleerd</h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                    Er zijn geen kosten in rekening gebracht. Je kunt het portaal blijven verkennen.
                </p>
                <button
                    onClick={onBack}
                    className="w-full py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 uppercase tracking-widest text-xs"
                >
                    Terug naar Dashboard
                </button>
            </TetrisPanel>
        </div>
    );
};

export default CreditCancelScreen;
