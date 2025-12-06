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
          <stop offset="0%" stopColor="#4CAF93" />
          <stop offset="100%" stopColor="#2a6b5e" />
        </linearGradient>
        <filter id="leafGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Círculo de fundo - ocupa todo o espaço */}
      <circle 
        cx="256" 
        cy="256" 
        r="256" 
        fill="url(#tealGradient)"
      />
      
      {/* Folha estilizada no centro - design similar ao Lucide Leaf */}
      <g transform="translate(256, 256)" filter="url(#leafGlow)">
        {/* Corpo da folha */}
        <path 
          d="M-80 80 
             C -80 -40, -40 -100, 80 -120
             C 60 -40, 20 40, -80 80
             Z"
          fill="white"
          opacity="0.95"
        />
        {/* Caule curvo */}
        <path 
          d="M-80 80 
             C -40 60, 0 20, 40 -40"
          fill="none"
          stroke="rgba(42, 107, 94, 0.5)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default TeradayIcon;
