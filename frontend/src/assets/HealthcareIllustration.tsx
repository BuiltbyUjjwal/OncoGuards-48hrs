import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const HealthcareIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 'auto'
}) => {
  return (
    <svg
      viewBox="0 0 520 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width, height, maxWidth: '100%', display: 'block' }}
      aria-hidden="true"
    >
      {/* Background Subtle Grounding Shape */}
      <rect x="30" y="270" width="460" height="8" rx="4" fill="#D7E4EA" />
      <rect x="70" y="286" width="380" height="4" rx="2" fill="#E4EEF2" />

      {/* Background Central Health Analytics Dashboard Panel */}
      <g>
        {/* Main Analytics Card */}
        <rect
          x="120"
          y="40"
          width="280"
          height="220"
          rx="16"
          fill="#FFFFFF"
          stroke="#D7E4EA"
          strokeWidth="1.5"
        />
        {/* Card Header Bar */}
        <rect x="120" y="40" width="280" height="38" rx="16" fill="#F0F7FB" />
        <rect x="120" y="62" width="280" height="16" fill="#F0F7FB" />
        <line x1="120" y1="78" x2="400" y2="78" stroke="#D7E4EA" strokeWidth="1" />
        
        {/* Window Controls */}
        <circle cx="142" cy="59" r="4" fill="#9FCBE1" />
        <circle cx="156" cy="59" r="4" fill="#61BAC4" />
        <circle cx="170" cy="59" r="4" fill="#4A90E2" />
        
        {/* Header Title Placeholder */}
        <rect x="220" y="55" width="80" height="8" rx="4" fill="#6B7A90" />

        {/* AI Screening Indicator Chart */}
        <rect x="145" y="96" width="130" height="42" rx="8" fill="#F5FAFC" stroke="#D7E4EA" strokeWidth="1" />
        <rect x="157" y="106" width="45" height="6" rx="3" fill="#6B7A90" />
        <rect x="157" y="118" width="75" height="10" rx="5" fill="#4A90E2" />
        <rect x="238" y="118" width="25" height="10" rx="5" fill="#9FCBE1" />

        {/* Clinical Metrics Metric Card Right */}
        <rect x="285" y="96" width="90" height="42" rx="8" fill="#E8F5F5" stroke="#A6DCD9" strokeWidth="1" />
        <rect x="297" y="106" width="40" height="6" rx="3" fill="#1D837F" />
        <rect x="297" y="118" width="62" height="10" rx="5" fill="#1D837F" />

        {/* Pulse ECG Graph Waveform */}
        <rect x="145" y="150" width="230" height="64" rx="8" fill="#FAFDFF" stroke="#D7E4EA" strokeWidth="1" />
        <line x1="145" y1="182" x2="375" y2="182" stroke="#E4EEF2" strokeWidth="1" strokeDasharray="3 3" />
        
        <path
          d="M155 182 L185 182 L195 162 L205 200 L215 174 L225 182 L260 182 L270 156 L282 208 L294 170 L304 182 L365 182"
          stroke="#4A90E2"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Baseline Trust Badges inside card */}
        <rect x="145" y="226" width="65" height="18" rx="9" fill="#F0F7FB" />
        <rect x="157" y="232" width="40" height="6" rx="3" fill="#4A90E2" />
        
        <rect x="220" y="226" width="75" height="18" rx="9" fill="#E8F5F5" />
        <rect x="232" y="232" width="50" height="6" rx="3" fill="#1D837F" />
      </g>

      {/* Left Doctor Figure (Clinician / Specialist) */}
      <g>
        {/* Shadow */}
        <ellipse cx="90" cy="272" rx="34" ry="5" fill="#D7E4EA" />
        
        {/* Coat Body */}
        <path
          d="M62 170 C62 145 74 135 90 135 C106 135 118 145 118 170 L122 268 L58 268 Z"
          fill="#FFFFFF"
          stroke="#D7E4EA"
          strokeWidth="1.5"
        />
        {/* Inner Teal Scrub Shirt */}
        <path d="M80 135 L90 158 L100 135 Z" fill="#1D837F" />
        {/* Lapel details */}
        <path d="M78 135 L88 185 L72 268" stroke="#D7E4EA" strokeWidth="1.5" />
        <path d="M102 135 L92 185 L108 268" stroke="#D7E4EA" strokeWidth="1.5" />
        
        {/* Stethoscope around neck */}
        <path
          d="M82 136 C80 148 78 162 82 175 C85 184 94 186 96 178"
          stroke="#4A90E2"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M98 136 C100 148 102 162 98 175"
          stroke="#4A90E2"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="96" cy="180" r="3.5" fill="#61BAC4" stroke="#4A90E2" strokeWidth="1.5" />

        {/* Head and Hair */}
        <circle cx="90" cy="112" r="17" fill="#F0F4F8" stroke="#D7E4EA" strokeWidth="1.5" />
        {/* Professional Hair Style */}
        <path
          d="M74 110 C74 98 80 92 90 92 C100 92 106 98 106 110 C104 104 98 100 90 100 C82 100 76 104 74 110 Z"
          fill="#1F2D3D"
        />

        {/* Clinician's Digital Health Tablet */}
        <rect
          x="95"
          y="180"
          width="42"
          height="54"
          rx="6"
          fill="#1F2D3D"
          stroke="#D7E4EA"
          strokeWidth="1"
        />
        <rect x="99" y="184" width="34" height="46" rx="4" fill="#FFFFFF" />
        <rect x="104" y="190" width="24" height="4" rx="2" fill="#4A90E2" />
        <rect x="104" y="198" width="18" height="3" rx="1.5" fill="#9FCBE1" />
        <rect x="104" y="204" width="22" height="3" rx="1.5" fill="#61BAC4" />
        <circle cx="116" cy="220" r="5" fill="#1D837F" />
      </g>

      {/* Floating Medical AI Shield Floating Card (Right) */}
      <g>
        {/* Shield Floating Container */}
        <rect
          x="385"
          y="130"
          width="105"
          height="125"
          rx="14"
          fill="#FFFFFF"
          stroke="#D7E4EA"
          strokeWidth="1.5"
        />
        
        {/* Shield Badge */}
        <path
          d="M437 146 L416 156 V172 C416 186 425 198 437 202 C449 198 458 186 458 172 V156 L437 146 Z"
          fill="#4A90E2"
          stroke="#1D837F"
          strokeWidth="1.2"
        />
        <path
          d="M437 152 L421 159.5 V172 C421 183 428 193 437 196.5 C446 193 453 183 453 172 V159.5 L437 152 Z"
          fill="#FFFFFF"
        />
        {/* Medical Cross Inside Shield */}
        <rect x="434.5" y="162" width="5" height="17" rx="1" fill="#4A90E2" />
        <rect x="428.5" y="168" width="17" height="5" rx="1" fill="#4A90E2" />
        
        {/* Card Text lines */}
        <rect x="402" y="215" width="70" height="6" rx="3" fill="#1F2D3D" />
        <rect x="412" y="226" width="50" height="5" rx="2.5" fill="#61BAC4" />
        <rect x="418" y="235" width="38" height="4" rx="2" fill="#9FCBE1" />
      </g>

      {/* Floating AI Risk Guidance Pill (Top Right) */}
      <g>
        <rect
          x="340"
          y="18"
          width="155"
          height="38"
          rx="19"
          fill="#FFFFFF"
          stroke="#D7E4EA"
          strokeWidth="1.5"
        />
        <circle cx="360" cy="37" r="9" fill="#E8F5F5" />
        <circle cx="360" cy="37" r="4.5" fill="#1D837F" />
        <rect x="378" y="29" width="75" height="7" rx="3.5" fill="#1F2D3D" />
        <rect x="378" y="39" width="50" height="5" rx="2.5" fill="#61BAC4" />
      </g>

      {/* Floating Precision DNA Biomarker Node (Top Left) */}
      <g>
        <rect
          x="35"
          y="65"
          width="110"
          height="34"
          rx="17"
          fill="#FFFFFF"
          stroke="#D7E4EA"
          strokeWidth="1.5"
        />
        <circle cx="53" cy="82" r="8" fill="#EBF4FC" />
        <path d="M49 82 L57 82 M53 78 L53 86" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" />
        <rect x="68" y="75" width="48" height="6" rx="3" fill="#1F2D3D" />
        <rect x="68" y="85" width="32" height="4" rx="2" fill="#9FCBE1" />
      </g>
    </svg>
  );
};
