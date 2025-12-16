interface TeradayIconProps {
  size?: number;
  className?: string;
}

export function TeradayIcon({ size = 512, className }: TeradayIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5BC4A8" />
          <stop offset="50%" stopColor="#3d8b7d" />
          <stop offset="100%" stopColor="#2a6b5e" />
        </linearGradient>
        <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="leafShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1a4a40" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Fundo retangular preenchendo 100% - elimina cantos brancos */}
      <rect 
        x="0" 
        y="0" 
        width="512" 
        height="512" 
        fill="url(#tealGradient)"
      />
      
      {/* Folha estilizada maior e mais atraente */}
      <g transform="translate(256, 256)" filter="url(#leafShadow)">
        {/* Corpo da folha - maior e mais elegante */}
        <path 
          d="M-100 100 
             C -100 -50, -50 -130, 100 -150
             C 75 -50, 25 50, -100 100
             Z"
          fill="white"
          opacity="0.95"
          filter="url(#leafGlow)"
        />
        {/* Caule curvo mais elegante */}
        <path 
          d="M-100 100 
             C -50 75, 0 25, 50 -50"
          fill="none"
          stroke="rgba(42, 107, 94, 0.6)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Veias da folha para mais detalhes */}
        <path 
          d="M-60 60 C -30 30, 0 0, 30 -40"
          fill="none"
          stroke="rgba(42, 107, 94, 0.25)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path 
          d="M-40 75 C -20 50, 10 20, 40 -20"
          fill="none"
          stroke="rgba(42, 107, 94, 0.2)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default TeradayIcon;
