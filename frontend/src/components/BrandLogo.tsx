import React, { useState } from 'react';
import { ShieldCrossIcon } from '../assets/MedicalIcons';
import './BrandLogo.css';

interface BrandLogoProps {
  size?: 'small' | 'normal' | 'large';
  className?: string;
  showTagline?: boolean;
  subtitle?: string;
  variant?: 'lockup' | 'full-banner' | 'icon-only';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'normal',
  className = '',
  showTagline = true,
  subtitle = 'AI-Powered Cancer Risk Assessment',
  variant = 'lockup',
}) => {
  const [imgError, setImgError] = useState(false);
  const iconSize = size === 'large' ? 48 : size === 'small' ? 28 : 38;

  if (variant === 'full-banner') {
    return (
      <div className={`brand-logo-container brand-logo-banner brand-logo-${size} ${className}`}>
        <img
          src="/logo-full.png"
          alt="OncoGuards AI - AI-Powered Cancer Risk Assessment"
          className="brand-full-banner-img"
        />
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div className={`brand-icon-wrapper brand-icon-only brand-icon-${size} ${className}`} title="OncoGuards AI">
        {!imgError ? (
          <img
            src="/logo-icon.png"
            alt="OncoGuards AI"
            className="brand-icon-img"
            width={iconSize}
            height={iconSize}
            onError={() => setImgError(true)}
          />
        ) : (
          <ShieldCrossIcon size={iconSize} />
        )}
      </div>
    );
  }

  return (
    <div className={`brand-logo-container brand-logo-${size} ${className}`}>
      <div className="brand-icon-wrapper" aria-hidden="true">
        {!imgError ? (
          <img
            src="/logo-icon.png"
            alt="OncoGuards AI Logo"
            className="brand-icon-img"
            width={iconSize}
            height={iconSize}
            onError={() => setImgError(true)}
          />
        ) : (
          <ShieldCrossIcon size={iconSize} />
        )}
      </div>
      <div className="brand-text-group">
        <div className="brand-title-row">
          <span className="brand-name">OncoGuard</span>
          <span className="brand-badge" aria-label="Artificial Intelligence">AI</span>
        </div>
        {showTagline && (
          <span className="brand-subtext">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
