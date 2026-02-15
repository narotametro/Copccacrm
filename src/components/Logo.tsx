import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'default' }) => {
  
  return (
    <svg
      className={className}
      viewBox="0 0 450 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for text */}
        <linearGradient id={`textGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {variant === 'light' ? (
            <>
              <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f0abfc', stopOpacity: 1 }} />
            </>
          ) : (
            <>
              <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </>
          )}
        </linearGradient>
        
        {/* Gradient for binocular */}
        <linearGradient id={`binocularGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Binocular Icon - positioned to the left */}
      <g transform="translate(30, 40)">
        {/* Left lens */}
        <circle cx="-12" cy="0" r="14" fill={`url(#binocularGradient-${variant})`} opacity="0.9" />
        <circle cx="-12" cy="0" r="10" fill="#ffffff" opacity="0.3" />
        <circle cx="-12" cy="0" r="6" fill="#334155" opacity="0.6" />
        
        {/* Right lens */}
        <circle cx="12" cy="0" r="14" fill={`url(#binocularGradient-${variant})`} opacity="0.9" />
        <circle cx="12" cy="0" r="10" fill="#ffffff" opacity="0.3" />
        <circle cx="12" cy="0" r="6" fill="#334155" opacity="0.6" />
        
        {/* Bridge connecting the lenses */}
        <rect x="-5" y="-3" width="10" height="6" rx="2" fill={`url(#binocularGradient-${variant})`} opacity="0.9" />
        
        {/* Top adjustment knobs */}
        <circle cx="-12" cy="-16" r="3" fill={`url(#binocularGradient-${variant})`} opacity="0.8" />
        <circle cx="12" cy="-16" r="3" fill={`url(#binocularGradient-${variant})`} opacity="0.8" />
        
        {/* Lens highlight reflections */}
        <circle cx="-15" cy="-3" r="3" fill="#ffffff" opacity="0.6" />
        <circle cx="9" cy="-3" r="3" fill="#ffffff" opacity="0.6" />
      </g>

      {/* Text: COPCCA CRM - positioned closer to binocular */}
      <text
        x="65"
        y="50"
        fontFamily="Calibri, Arial, sans-serif"
        fontSize="38"
        fontWeight="800"
        fill={`url(#textGradient-${variant})`}
        stroke={`url(#textGradient-${variant})`}
        strokeWidth="0.5"
        textAnchor="start"
        letterSpacing="3"
      >
        COPCCA CRM
      </text>
    </svg>
  );
};
