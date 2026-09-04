import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  ClockIcon,
  SecureShieldIcon,
  ShieldCrossIcon,
} from '../assets/MedicalIcons';
import './AssessmentSidePanel.css';

export interface AssessmentSidePanelProps {
  currentStep: number; // 1, 2, 3, 4, 5
  totalSteps?: number;
  completedSections?: number[];
  isFemale?: boolean;
}

interface StepItem {
  id: number;
  label: string;
  sublabel: string;
}

export const AssessmentSidePanel: React.FC<AssessmentSidePanelProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const { t } = useTranslation();

  const steps: StepItem[] = [
    { id: 1, label: t('basicInfo.title', 'Personal Profile'), sublabel: t('basicInfo.stepSubtitle', 'Demographics & Location') },
    { id: 2, label: t('lifestyle.title', 'Your Lifestyle'), sublabel: t('lifestyle.stepSubtitle', 'Habits & Activity') },
    { id: 3, label: t('medicalHistory.title', 'Medical & Family History'), sublabel: t('medicalHistory.stepSubtitle', 'Hereditary & Screenings') },
    { id: 4, label: t('symptoms.title', 'Current Symptoms'), sublabel: t('symptoms.stepSubtitle', 'Symptom Check & Duration') },
  ];

  // Map 1-5 step to 1-4 visual progress index
  const normalizedCurrent = currentStep === 5 ? 4 : currentStep;
  const progressPercent = Math.min(Math.round(((normalizedCurrent - 1) / totalSteps) * 100), 100);

  const getEstTime = () => {
    switch (normalizedCurrent) {
      case 1:
        return t('common.approx46Mins', 'Approx. 4–6 mins remaining');
      case 2:
        return t('common.approx34Mins', 'Approx. 3–4 mins remaining');
      case 3:
        return t('common.approx2Mins', 'Approx. 2 mins remaining');
      case 4:
        return t('common.approxFinalMins', 'Final step • ~1 min remaining');
      default:
        return t('common.approx5Mins', 'Approx. 5 mins');
    }
  };

  return (
    <aside className="assessment-side-panel" aria-label="Assessment Progress Sidebar">
      {/* Top Header Card: Progress & Steps */}
      <div className="side-panel-card">
        <div className="panel-header-row">
          <div className="panel-badge">
            <ShieldCrossIcon size={16} color="#2563EB" />
            <span>{t('dashboard.guidedAiAssessment', 'Guided AI Assessment')}</span>
          </div>
          <span className="panel-step-indicator">
            {t('common.stepIndicator', { current: normalizedCurrent, total: totalSteps, defaultValue: `Step ${normalizedCurrent} of ${totalSteps}` })}
          </span>
        </div>

        <h3 className="panel-title">{t('common.yourProgress', 'Your Progress')}</h3>

        {/* Progress Bar */}
        <div className="panel-progress-block">
          <div className="panel-progress-labels">
            <span className="progress-status-text">{t('common.overallCompletion', 'Overall Completion')}</span>
            <span className="progress-pct-number">{progressPercent}%</span>
          </div>
          <div className="panel-progress-track">
            <div className="panel-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Steps Checklist */}
        <div className="panel-steps-list">
          {steps.map((step) => {
            const isCompleted = normalizedCurrent > step.id;
            const isCurrent = normalizedCurrent === step.id;
            const isUpcoming = normalizedCurrent < step.id;

            return (
              <div
                key={step.id}
                className={`panel-step-item ${isCompleted ? 'is-completed' : ''} ${
                  isCurrent ? 'is-current' : ''
                } ${isUpcoming ? 'is-upcoming' : ''}`}
              >
                <div className="step-bullet-wrapper">
                  {isCompleted ? (
                    <div className="step-done-circle" aria-label="Completed">
                      <CheckCircleIcon size={16} color="#0F766E" />
                    </div>
                  ) : isCurrent ? (
                    <div className="step-active-circle" aria-label="Current Step">
                      <span className="step-active-dot" />
                    </div>
                  ) : (
                    <div className="step-pending-circle" aria-label="Upcoming Step">
                      <span>{step.id}</span>
                    </div>
                  )}
                </div>

                <div className="step-info-col">
                  <span className="step-label-main">{step.label}</span>
                  <span className="step-label-sub">{step.sublabel}</span>
                </div>

                {isCurrent && <span className="step-current-tag">{t('common.current', 'Current')}</span>}
              </div>
            );
          })}
        </div>

        {/* Time Remaining */}
        <div className="panel-time-remaining">
          <ClockIcon size={15} color="#64748B" />
          <span>{getEstTime()}</span>
        </div>
      </div>

      {/* Trust & Privacy Reassurance Card */}
      <div className="side-reassurance-card">
        <div className="reassurance-icon-box">
          <SecureShieldIcon size={18} color="#0F766E" />
        </div>
        <div className="reassurance-text-col">
          <h4 className="reassurance-heading">{t('common.confidentialSecure', '100% Confidential & Secure')}</h4>
          <p className="reassurance-body">
            {t('common.confidentialDesc', 'Your health responses are evaluated against evidence-based oncology screening guidelines (USPSTF, NCCN, ICMR).')}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AssessmentSidePanel;
