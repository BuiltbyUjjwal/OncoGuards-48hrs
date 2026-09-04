import React from 'react';

interface RiskGaugeSemiCircleProps {
  score?: number; // kept for interface compatibility, not rendered
  category?: string;
  isBackendReady?: boolean;
}

export const RiskGaugeSemiCircle: React.FC<RiskGaugeSemiCircleProps> = ({
  category = 'Moderate Risk',
  isBackendReady = false,
}) => {
  const catLower = (category || '').toLowerCase();
  
  // Format clean display category: LOWER / MODERATE / HIGHER
  let formattedCategory = 'MODERATE RISK';
  let needleRotation = 0; // Center (Moderate)
  let badgeColorClass = 'cat-mod';

  if (catLower.includes('low')) {
    formattedCategory = 'LOWER RISK';
    needleRotation = -52; // Pointing to Lower Risk arc
    badgeColorClass = 'cat-low';
  } else if (catLower.includes('high')) {
    formattedCategory = 'HIGHER RISK';
    needleRotation = 52; // Pointing to Higher Risk arc
    badgeColorClass = 'cat-high';
  } else {
    formattedCategory = 'MODERATE RISK';
    needleRotation = 0;
    badgeColorClass = 'cat-mod';
  }

  return (
    <div
      className="risk-gauge-wrapper"
      role="meter"
      aria-label="Overall Cancer Risk Category Meter"
      aria-valuetext={formattedCategory}
    >
      <svg
        viewBox="0 0 320 185"
        className="risk-gauge-svg"
        role="img"
        aria-label={`Risk Gauge displaying ${formattedCategory}`}
      >
        {/* Background Arc Tracks */}
        <defs>
          {/* Lower Risk Segment */}
          <linearGradient id="gaugeLowerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
          {/* Moderate Risk Segment */}
          <linearGradient id="gaugeModGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#3B82B6" />
          </linearGradient>
          {/* Higher Risk Segment */}
          <linearGradient id="gaugeHighGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>

        {/* 1. Track: Lower Risk Arc (180deg to 120deg) */}
        <path
          d="M 30 160 A 130 130 0 0 1 95 47.4"
          fill="none"
          stroke="url(#gaugeLowerGrad)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* 2. Track: Moderate Risk Arc (120deg to 60deg) */}
        <path
          d="M 103 42.8 A 130 130 0 0 1 217 42.8"
          fill="none"
          stroke="url(#gaugeModGrad)"
          strokeWidth="20"
        />

        {/* 3. Track: Higher Risk Arc (60deg to 0deg) */}
        <path
          d="M 225 47.4 A 130 130 0 0 1 290 160"
          fill="none"
          stroke="url(#gaugeHighGrad)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Visual Category Range Labels (No numeric percentages) */}
        <text x="54" y="180" fill="#0F766E" fontSize="12" fontWeight="800" textAnchor="middle">
          LOWER
        </text>
        <text x="160" y="24" fill="#3B82B6" fontSize="12" fontWeight="800" textAnchor="middle">
          MODERATE
        </text>
        <text x="266" y="180" fill="#E11D48" fontSize="12" fontWeight="800" textAnchor="middle">
          HIGHER
        </text>

        {/* Gauge Center Needle Indicator */}
        <g
          transform={`translate(160, 160) rotate(${needleRotation})`}
          style={{ transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {/* Needle Arrow */}
          <polygon points="-4,0 0,-120 4,0" fill="#16324F" />
          <circle cx="0" cy="0" r="10" fill="#3B82B6" stroke="#FFFFFF" strokeWidth="3" />
        </g>
      </svg>

      {/* Category Display Center */}
      <div className="gauge-center-badge">
        <span className={`gauge-category-pill ${badgeColorClass}`} style={{ fontSize: '1.15rem', padding: '6px 18px' }}>
          {formattedCategory}
        </span>
        <span className="gauge-api-tag">
          {isBackendReady ? 'Clinical Risk Stratification' : 'Structured for FastAPI Backend Endpoint'}
        </span>
      </div>
    </div>
  );
};

export default RiskGaugeSemiCircle;
