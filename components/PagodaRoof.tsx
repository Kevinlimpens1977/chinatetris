import React from 'react';

type PagodaRoofProps = {
    className?: string;
};

export const PagodaRoof: React.FC<PagodaRoofProps> = ({ className = "" }) => {
    const styles = `
    @keyframes swingLantern {
      0%   { transform: rotate(-4deg); }
      50%  { transform: rotate(4deg); }
      100% { transform: rotate(-4deg); }
    }

    @keyframes glowPulse {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(198, 0, 1, 0.6)); }
      50% { filter: drop-shadow(0 0 15px rgba(198, 0, 1, 0.9)); }
    }

    .lantern-swing {
      transform-origin: 0px -30px;
      animation: swingLantern 2.8s ease-in-out infinite;
    }

    .lantern-swing-delayed {
      transform-origin: 0px -30px;
      animation: swingLantern 2.8s ease-in-out infinite;
      animation-delay: 0.5s;
    }

    .roof-glow {
      animation: glowPulse 3s ease-in-out infinite;
    }
  `;

    return (
        <svg
            className={className}
            viewBox="0 0 800 220"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
        >
            <style>{styles}</style>

            {/* Achterste schaduwlaag */}
            <path
                d="M20 150 Q200 40 400 80 Q600 40 780 150 L780 170 Q600 100 400 140 Q200 100 20 170 Z"
                fill="#8A0000"
                opacity="0.45"
            />

            {/* Hoofd dakdeel */}
            <path
                className="roof-glow"
                d="M20 140 Q200 30 400 70 Q600 30 780 140 L780 165 Q600 95 400 130 Q200 95 20 165 Z"
                fill="url(#roofGradient)"
            />

            {/* Gouden bovenrand */}
            <path
                d="M20 140 Q200 30 400 70 Q600 30 780 140"
                stroke="#DAA520"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
            />

            {/* Gouden horns links */}
            <path
                d="M20 140 Q0 120 5 100"
                stroke="#DAA520"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
            />

            {/* Gouden horns rechts */}
            <path
                d="M780 140 Q800 120 795 100"
                stroke="#DAA520"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
            />

            {/* Lampion links (swing) */}
            <g className="lantern-swing" transform="translate(90,150)">
                <circle cx="0" cy="0" r="14" fill="#C60001" stroke="#DAA520" strokeWidth="3" />
                <circle cx="0" cy="0" r="6" fill="#DAA520" opacity="0.3" />
                <line x1="0" y1="-14" x2="0" y2="-30" stroke="#DAA520" strokeWidth="3" />
            </g>

            {/* Lampion rechts (andere fase) */}
            <g className="lantern-swing-delayed" transform="translate(710,150)">
                <circle cx="0" cy="0" r="14" fill="#C60001" stroke="#DAA520" strokeWidth="3" />
                <circle cx="0" cy="0" r="6" fill="#DAA520" opacity="0.3" />
                <line x1="0" y1="-14" x2="0" y2="-30" stroke="#DAA520" strokeWidth="3" />
            </g>

            <defs>
                <linearGradient id="roofGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C60001" />
                    <stop offset="50%" stopColor="#A00000" />
                    <stop offset="100%" stopColor="#6A0000" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default PagodaRoof;
