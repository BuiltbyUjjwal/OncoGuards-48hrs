import React from 'react';
import { AssessmentIcon, HealthPulseIcon, CheckCircleIcon } from '../assets/MedicalIcons';
import { useTranslation } from 'react-i18next';
import './TrustPoints.css';

export const TrustPoints: React.FC = () => {
  const { t } = useTranslation();

  const trustItems = [
    {
      id: 'personalized-insights',
      title: t('trust.point1Title', 'Personalized Screening Guidance'),
      description: t('trust.point1Desc', 'Screening information based on your age, health history, and risk factors.'),
      icon: <AssessmentIcon size={20} className="trust-icon" />,
    },
    {
      id: 'health-awareness',
      title: t('trust.point2Title', 'Health Awareness'),
      description: t('trust.point2Desc', 'Simple guidance to help you understand your health and know when to seek medical advice.'),
      icon: <HealthPulseIcon size={20} className="trust-icon" />,
    },
  ];

  return (
    <div className="trust-points-container" role="region" aria-label="Trust and Security Highlights">
      <div className="trust-points-list">
        {trustItems.map((item) => (
          <div key={item.id} className="trust-point-card">
            <div className="trust-icon-box" aria-hidden="true">
              {item.icon}
            </div>
            <div className="trust-text-content">
              <div className="trust-title-row">
                <span className="trust-title">{item.title}</span>
                <CheckCircleIcon size={16} className="trust-check-icon" />
              </div>
              <p className="trust-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustPoints;
