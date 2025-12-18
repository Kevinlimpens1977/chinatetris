import React from 'react';
import TetrisPanel from './TetrisPanel';

interface ChineseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const ChineseModal: React.FC<ChineseModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md mx-4 transform transition-all scale-100">
                <TetrisPanel title={title}>
                    {children}

                    {/* Close Button X */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-[#C92A2A] hover:text-[#FFD700] font-bold text-xl p-2"
                    >
                        ✕
                    </button>
                </TetrisPanel>
            </div>
        </div>
    );
};

export default ChineseModal;
