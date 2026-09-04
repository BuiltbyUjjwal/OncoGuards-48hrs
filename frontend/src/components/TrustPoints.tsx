import React from 'react';
import { AssessmentIcon, HealthPulseIcon, CheckCircleIcon } from '../assets/MedicalIcons';
import './TrustPoints.css';

interface TrustPointItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const trustItems: TrustPointItem[] = [
  {
    id: 'personalized-insights',
    title: 'Personalized Screening Guidance',
    description: 'Screening information based on your age, health history, and risk factors.',
    icon: <AssessmentIcon size={20} className="trust-icon" />,
  },
  {
    id: 'health-awareness',
    title: 'Health Awareness',
    description: 'Simple guidance to help you understand your health and know when to seek medical advice.',
    icon: <HealthPulseIcon size={20} className="trust-icon" />,
  },
];

export const TrustPoints: React.FC = () => {
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
