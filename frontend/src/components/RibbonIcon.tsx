import React, { useId } from 'react';

export interface RibbonIconProps {
  primaryColor: string;
  secondaryColor?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

/**
 * Check if a color is near-white / pearl
 */
function isPearlColor(color: string): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  if (
    c === '#ffffff' ||
    c === '#fff' ||
    c === '#f8fafc' ||
    c === '#f1f5f9' ||
    c === '#f0f9ff' ||
    c === '#f0fdfa' ||
    c === 'white' ||
    c === '#e2e8f0' ||
    c === '#fdf2f8' ||
    c === '#fafafa'
  ) {
    return true;
  }
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    let r = 255, g = 255, b = 255;
    if (c.length === 7) {
      r = parseInt(c.substring(1, 3), 16);
      g = parseInt(c.substring(3, 5), 16);
      b = parseInt(c.substring(5, 7), 16);
    } else if (c.length === 4) {
      r = parseInt(c[1] + c[1], 16);
      g = parseInt(c[2] + c[2], 16);
      b = parseInt(c[3] + c[3], 16);
    }
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 220;
  }
  return false;
}

export const RibbonIcon: React.FC<RibbonIconProps> = ({
  primaryColor,
  secondaryColor,
  size = 24,
  className = '',
  style = {},
  ariaLabel = 'Awareness Ribbon',
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const isPearl = isPearlColor(primaryColor);
  const filterId = `ribbon-filter-${uniqueId}`;
  const strokeOutline = isPearl ? '#94A3B8' : 'none';
  const strokeWidth = isPearl ? 1.2 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="1.8"
            stdDeviation={isPearl ? '2.2' : '1.4'}
            floodColor={isPearl ? '#334155' : '#000000'}
            floodOpacity={isPearl ? '0.32' : '0.2'}
          />
        </filter>

        <linearGradient
          id={`ribbon-shimmer-${uniqueId}`}
          x1="12"
          y1="6"
          x2="52"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* ================= 1. STRAND A (UNDER) ================= */}
        {/* Curves from apex through left loop, under crossover, to right tail */}
        <path
          d="M 32 5
             C 20 5, 13 15, 13 26
             C 13 34, 18 41, 26 47
             L 47 59
             L 42 49
             L 37 45
             C 31 39, 27 34, 25 29
             C 23 25, 23 19, 27 15
             C 29 13, 31 12, 32 12
             Z"
          fill={primaryColor}
          stroke={strokeOutline}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        <path
          d="M 32 5
             C 20 5, 13 15, 13 26
             C 13 34, 18 41, 26 47
             L 47 59
             L 42 49
             L 37 45
             C 31 39, 27 34, 25 29
             C 23 25, 23 19, 27 15
             C 29 13, 31 12, 32 12
             Z"
          fill={`url(#ribbon-shimmer-${uniqueId})`}
          pointerEvents="none"
        />

        {/* Two-tone center stripe on Strand A */}
        {secondaryColor && (
          <path
            d="M 32 8.5
               C 22.5 8.5, 18 16, 18 25
               C 18 32, 23 38, 30 44
               L 44.5 54"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* ================= 2. STRAND B (OVER) ================= */}
        {/* Curves from apex through right loop, OVER crossover, to left tail */}
        <path
          d="M 32 5
             C 44 5, 51 15, 51 26
             C 51 34, 46 41, 38 47
             L 17 59
             L 22 49
             L 27 45
             C 33 39, 37 34, 39 29
             C 41 25, 41 19, 37 15
             C 35 13, 33 12, 32 12
             Z"
          fill={primaryColor}
          stroke={strokeOutline}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        <path
          d="M 32 5
             C 44 5, 51 15, 51 26
             C 51 34, 46 41, 38 47
             L 17 59
             L 22 49
             L 27 45
             C 33 39, 37 34, 39 29
             C 41 25, 41 19, 37 15
             C 35 13, 33 12, 32 12
             Z"
          fill={`url(#ribbon-shimmer-${uniqueId})`}
          pointerEvents="none"
        />

        {/* Two-tone center stripe on Strand B */}
        {secondaryColor && (
          <path
            d="M 32 8.5
               C 41.5 8.5, 46 16, 46 25
               C 46 32, 41 38, 34 44
               L 19.5 54"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Realistic Crossover Overlap Shadow */}
        <path
          d="M 28 35 C 32 38, 36 38, 40 35"
          stroke="rgba(0, 0, 0, 0.28)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
};

export default RibbonIcon;
