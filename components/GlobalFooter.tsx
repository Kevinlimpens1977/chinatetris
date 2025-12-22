import React from 'react';
import { GameState } from '../types';

interface GlobalFooterProps {
    gameState?: GameState;
}

const GlobalFooter: React.FC<GlobalFooterProps> = ({ gameState }) => {
    // Hide footer during gameplay
    if (gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.LEVEL_UP) {
        return null;
    }

    return (
        <footer className="fixed bottom-0 left-0 w-full z-[150] pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md border-t border-white/10 p-2 text-center text-[10px] md:text-xs text-gray-500 pointer-events-auto">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-1 md:gap-4 uppercase tracking-widest opacity-70">
                    <span>© 2024 DIGITAAL GAME PORTAAL</span>
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
