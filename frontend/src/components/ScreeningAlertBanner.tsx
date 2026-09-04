import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertsBellIcon } from '../assets/MedicalIcons';
import { getApplicableScreeningAlerts } from '../config/screeningGuidelines';
import { useAssessment } from '../context/AssessmentContext';
import './ScreeningAlertBanner.css';

interface ScreeningAlertBannerProps {
  className?: string;
}

const DISMISSED_ALERTS_KEY = 'oncoguards_dismissed_alerts_v1';

export const ScreeningAlertBanner: React.FC<ScreeningAlertBannerProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { state } = useAssessment();
  const { basicInfo, lifestyle } = state;

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, alertId];
      try {
        localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Determine user risk baseline flags
  const isSmoker = Boolean(
    lifestyle.isCurrentSmoker === true ||
    (typeof lifestyle.tobaccoUse === 'string' && lifestyle.tobaccoUse.includes('Smoke'))
  );

  const usesTobacco = Boolean(
    lifestyle.usesSmokelessTobacco === true ||
    (typeof lifestyle.tobaccoUse === 'string' && lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'Never')
  );

  const drinksAlcohol = Boolean(
    lifestyle.isAlcoholConsuming === true ||
    (typeof lifestyle.alcoholConsumption === 'string' &&
      (lifestyle.alcoholConsumption.includes('Regularly') || lifestyle.alcoholConsumption.includes('Occasionally')))
  );

  const alerts = getApplicableScreeningAlerts({
    age: basicInfo.age,
    gender: basicInfo.biologicalSex,
    isSmoker,
    usesTobacco,
    drinksAlcohol,
  }).filter((a) => !dismissedIds.includes(a.id));

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={`screening-alerts-container ${className}`} role="region" aria-label={t('alerts.title', 'Clinical Screening Reminders')}>
      {alerts.map((alert) => {
        const cancerKey = alert.cancerType.toLowerCase() as 'breast' | 'cervical' | 'lung' | 'oral';
        const cancerDisplayName = t(alert.cancerTypeKey || `screening.${cancerKey}.displayName`, alert.cancerType);
        const guidelineSource = t(alert.guidelineSourceKey || `screening.${cancerKey}.guidelineSource`, alert.guidelineSource);
        const alertTitle = t(alert.titleKey || `screening.${cancerKey}.alertTitle`, alert.title);
        const recommendation = t(alert.recommendationKey || `screening.${cancerKey}.baselineRecommendation`, alert.recommendation);
        const disclaimerText = t('common.clinicalDisclaimer', 'OncoGuards is a cancer risk-awareness and screening-support tool. It does not provide a medical diagnosis. Consult a qualified healthcare professional for medical evaluation.');

        return (
          <div key={alert.id} className="screening-alert-card" role="alert">
            <div className="screening-alert-left">
              <div className="screening-alert-icon-box" aria-hidden="true">
                <AlertsBellIcon size={20} />
              </div>
              <div className="screening-alert-content">
                <div className="screening-alert-header">
                  <h4 className="screening-alert-title">{alertTitle}</h4>
                  <span className="screening-alert-tag">{cancerDisplayName} {t('alerts.guidelineTag', 'Guideline')}</span>
                  <span className="screening-alert-source">{guidelineSource}</span>
                </div>
                <p className="screening-alert-body">{recommendation}</p>
                <span className="screening-alert-disclaimer">({disclaimerText})</span>
              </div>
            </div>
            <button
              type="button"
              className="screening-alert-dismiss-btn"
              onClick={() => handleDismiss(alert.id)}
              aria-label={`Dismiss ${alertTitle} reminder`}
              title={t('alerts.dismissBtn', 'Dismiss reminder')}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ScreeningAlertBanner;
