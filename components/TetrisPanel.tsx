import React from 'react';

interface TetrisPanelProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

const TetrisPanel: React.FC<TetrisPanelProps> = ({ children, className = '', title }) => {
    return (
        <div className={`relative bg-[#111] border-4 border-[#C92A2A] p-6 shadow-[0_0_15px_#C92A2A] ${className}`}>
            {/* Pixel Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 bg-[#FFD700] -translate-x-1 -translate-y-1 z-10 box-decoration-clone" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-[#FFD700] translate-x-1 -translate-y-1 z-10" />
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#FFD700] -translate-x-1 translate-y-1 z-10" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#FFD700] translate-x-1 translate-y-1 z-10" />

            {/* Inner Border (Gold) */}
            <div className="absolute inset-1 border-2 border-[#FFD700] opacity-50 pointer-events-none" />

            {/* Header if provided */}
            {title && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#C92A2A] px-6 py-2 border-2 border-[#FFD700] shadow-[0_4px_0_#8B0000]">
                    <h2 className="text-[#FFD700] text-xl font-bold tracking-widest uppercase drop-shadow-md text-center font-arcade">
                        {title}
                    </h2>
                </div>
            )}

            {/* Content */}
            <div className="relative z-0">
                {children}
            </div>
        </div>
    );
};

export default TetrisPanel;
