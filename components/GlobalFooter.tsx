import React from 'react';

const GlobalFooter: React.FC = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-[150] pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md border-t border-white/10 p-2 text-center text-[10px] md:text-xs text-gray-500 pointer-events-auto">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-1 md:gap-4 uppercase tracking-widest opacity-70">
                    <span>© 2024 DIGITAL GAME PORTAL</span>
                    <span className="hidden md:inline">|</span>
                    <span className="text-gray-400 font-bold">This platform sells digital credits for entertainment access.</span>
                    <span className="hidden md:inline">|</span>
                    <span>No payments are donations, investments, or crowdfunding.</span>
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
