import React from 'react';

interface MixLogoProps {
  variant?: 'full' | 'icon' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const MixLogo: React.FC<MixLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-2xl', sub: 'text-[11px]' },
    lg: { icon: 48, text: 'text-3xl', sub: 'text-[13px]' },
    xl: { icon: 64, text: 'text-4xl', sub: 'text-[15px]' },
  };

  const currentSize = sizeMap[size];

  // SVG Geometric Emblem of Mix Store with Purple #7B2CF6, Orange #FF8A00, Cyan Blue #00B4D8, and White Metallic
  const Emblem = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_12px_rgba(123,44,246,0.35)]"
    >
      <defs>
        {/* Purple Gradient */}
        <linearGradient id="mixPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9353FF" />
          <stop offset="100%" stopColor="#7B2CF6" />
        </linearGradient>

        {/* Orange Accent Gradient */}
        <linearGradient id="mixOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA633" />
          <stop offset="100%" stopColor="#FF8A00" />
        </linearGradient>

        {/* Subtle Blue/Cyan Touch from logo */}
        <linearGradient id="mixBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>

        {/* Metallic Border */}
        <linearGradient id="mixSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>

      {/* Hexagonal/Rounded Base Shield */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="#111116"
        stroke="url(#mixPurpleGrad)"
        strokeWidth="2.5"
      />

      {/* Diagonal Brand Slash 1 (Blue Accent) */}
      <path
        d="M20 72L36 28H46L30 72H20Z"
        fill="url(#mixBlueGrad)"
      />

      {/* Main 'M' & 'X' Geometric Intersection (Purple Master) */}
      <path
        d="M32 72L50 34L68 72H58L50 54L42 72H32Z"
        fill="url(#mixPurpleGrad)"
      />

      {/* Dynamic Forward Slash (Electric Orange #FF8A00) */}
      <path
        d="M52 28L78 72H68L44 28H52Z"
        fill="url(#mixOrangeGrad)"
      />

      {/* Center Dynamic Spark/Apex (Pure White Metallic) */}
      <circle cx="50" cy="28" r="4.5" fill="#FFFFFF" />
      <circle cx="78" cy="72" r="3" fill="#FFA633" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} title="MIX Gestão">
        <Emblem />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <Emblem />
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`${currentSize.text} tracking-wider font-extrabold text-white`}
            style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
          >
            MIX
          </span>
          <span
            className={`${currentSize.text} tracking-wider font-extrabold text-[#FF8A00]`}
            style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
          >
            GESTÃO
          </span>
        </div>
        {showSubtitle && (
          <span className={`${currentSize.sub} font-medium tracking-[0.16em] uppercase text-zinc-400 mt-0.5`}>
            Mix Variedades Store
          </span>
        )}
      </div>
    </div>
  );
};
