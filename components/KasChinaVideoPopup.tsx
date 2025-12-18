import React, { useState, useEffect, useRef } from 'react';
import { PagodaRoof } from './PagodaRoof';

interface KasChinaVideoPopupProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl?: string;
}

export const KasChinaVideoPopup: React.FC<KasChinaVideoPopupProps> = ({
    isOpen,
    onClose,
    videoUrl = "https://igpfvcihykgouwiulxwn.supabase.co/storage/v1/object/sign/kaschina/kas-china-promo.mp4?token=YOUR_TOKEN"
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            // Reset video when opening
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => { });
            }
        }
    }, [isOpen]);

    const handleClose = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        onClose();
    };

    const handleVideoEnded = () => {
        handleClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/90 backdrop-blur-md' : 'bg-black/0'
                }`}
            onClick={handleBackdropClick}
        >
            {/* Popup Content Container */}
            <div
                className={`relative max-w-4xl w-full transform transition-all duration-300 ease-out ${isAnimating
                    ? 'scale-100 translate-y-0 opacity-100'
                    : 'scale-95 translate-y-2 opacity-0'
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute -top-12 right-0 z-50 text-white/80 hover:text-white text-4xl font-bold transition-colors p-2"
                    aria-label="Sluiten"
                >
                    ✕
                </button>

                {/* PagodaRoof Header */}
                <PagodaRoof className="w-full h-auto mb-[-40px] relative z-10" />

                {/* Video Container */}
                <div className="relative bg-gradient-to-b from-red-950 to-black rounded-b-2xl border-4 border-t-0 border-yellow-600/50 shadow-[0_0_60px_rgba(198,0,1,0.4)] overflow-hidden">
                    {/* Golden corner decorations */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-yellow-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-yellow-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-yellow-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-yellow-500 rounded-br-lg"></div>

                    {/* Video Player */}
                    <div className="aspect-video w-full bg-black">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            autoPlay
                            playsInline
                            onEnded={handleVideoEnded}
                        >
                            <source src={videoUrl} type="video/mp4" />
                            Je browser ondersteunt geen video.
                        </video>
                    </div>

                    {/* Footer Text */}
                    <div className="bg-gradient-to-r from-red-900/80 via-red-800/80 to-red-900/80 p-4 text-center">
                        <p className="text-yellow-200 font-bold text-sm md:text-base tracking-wide">
                            🏮 Steun Kas' reis naar China! 🏮
                        </p>
                        <p className="text-yellow-100/70 text-xs mt-1">
                            Klik buiten de video of op ✕ om te sluiten
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KasChinaVideoPopup;
