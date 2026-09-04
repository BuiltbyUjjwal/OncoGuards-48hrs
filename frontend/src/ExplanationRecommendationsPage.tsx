import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { useAssessment } from './context/AssessmentContext';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import {
  ShieldCrossIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  ReportsFileIcon,
  AssistantBotIcon,
  AssessmentIcon,
} from './assets/MedicalIcons';
import './styles/ExplanationRecommendationsPage.css';

interface ExplanationRecommendationsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

type TabType = 'explanation' | 'recommendations' | 'next-steps';

interface FactorItem {
  category: string;
  title: string;
  impactType: 'increased' | 'protective' | 'neutral';
  impactLabel: string;
  description: string;
}

export const ExplanationRecommendationsPage: React.FC<ExplanationRecommendationsPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, isFemale } = useAssessment();
  const { basicInfo, lifestyle, medicalHistory, symptoms, screeningHistory } = assessmentState;

  const [activeTab, setActiveTab] = useState<TabType>('explanation');

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const hasSavedProfile = Boolean(
    assessmentState.hasCompletedProfile ||
    (basicInfo.fullName?.trim() && basicInfo.age && (basicInfo.biologicalSex || basicInfo.biological_sex))
  );

  const handleStartNewAssessment = () => {
    if (hasSavedProfile) {
      onNavigate('assessment-symptoms');
    } else {
      onNavigate('health-profile');
    }
  };

  // Build dynamic factor items based on entered assessment inputs
  const dynamicFactors: FactorItem[] = [
    // 1. Lifestyle Factor (Tobacco)
    {
      category: 'Lifestyle Factor',
      title: 'Tobacco & Smoking History',
      impactType:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'Never' && lifestyle.tobaccoUse !== 'never'
          ? 'increased'
          : 'protective',
      impactLabel:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'Never' && lifestyle.tobaccoUse !== 'never'
          ? 'Increased Factor'
          : 'Protective / Neutral Factor',
      description:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'Never' && lifestyle.tobaccoUse !== 'never'
          ? `Reported status: ${lifestyle.tobaccoUse} (${
              lifestyle.tobaccoDuration || 'Duration noted'
            }). Known clinical contributor for respiratory, oral, and systemic oncologic profiles.`
          : 'Non-tobacco status significantly reduces baseline respiratory and aerodigestive oncologic risk.',
    },

    // 2. Lifestyle Factor (Physical Activity & Diet)
    {
      category: 'Lifestyle Factor',
      title: 'Physical Activity & Metabolic Baseline',
      impactType:
        lifestyle.physicalActivityLevel?.includes('Active') ||
        lifestyle.physicalActivityLevel?.includes('Moderate')
          ? 'protective'
          : 'neutral',
      impactLabel:
        lifestyle.physicalActivityLevel?.includes('Active') ||
        lifestyle.physicalActivityLevel?.includes('Moderate')
          ? 'Protective Factor'
          : 'Neutral / Baseline',
      description: `Reported physical activity: ${
        lifestyle.physicalActivityLevel || 'Recorded'
      }. Regular aerobic exercise promotes anti-inflammatory and metabolic oncologic resilience.`,
    },

    // 3. Family History
    {
      category: 'Family History',
      title: 'Immediate Family Cancer History',
      impactType:
        medicalHistory.hasFamilyCancerHistory === 'Yes' ? 'increased' : 'neutral',
      impactLabel:
        medicalHistory.hasFamilyCancerHistory === 'Yes'
          ? 'Increased Factor'
          : 'Baseline Impact',
      description:
        medicalHistory.hasFamilyCancerHistory === 'Yes'
          ? `First-degree family diagnoses noted (${
              medicalHistory.familyCancerTypes?.join(', ') || 'Recorded'
            }). Indicates potential hereditary or shared environmental predispositions.`
          : 'No immediate first-degree relative cancer history reported.',
    },

    // 4. Medical History
    {
      category: 'Medical History',
      title: 'Personal Medical Conditions',
      impactType:
        medicalHistory.medicalConditions?.some(
          (c) => c !== 'None of the above' && c !== 'Not sure'
        )
          ? 'increased'
          : 'neutral',
      impactLabel:
        medicalHistory.medicalConditions?.some(
          (c) => c !== 'None of the above' && c !== 'Not sure'
        )
          ? 'Increased Factor'
          : 'Baseline Impact',
      description:
        medicalHistory.medicalConditions?.length > 0 &&
        !medicalHistory.medicalConditions.includes('None of the above')
          ? `Recorded conditions: ${medicalHistory.medicalConditions.join(
              ', '
            )}. Certain viral or metabolic markers modulate baseline surveillance intervals.`
          : 'No high-risk viral or metabolic chronic conditions reported.',
    },

    // 5. Symptoms
    {
      category: 'Reported Symptoms',
      title: 'Current Physical Warning Signs',
      impactType:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? 'increased'
          : 'neutral',
      impactLabel:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? 'Requires Clinical Discussion'
          : 'Baseline Impact',
      description:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? `${symptoms.selectedSymptoms.length} symptom(s) identified for diagnostic clarification with your healthcare provider.`
          : 'No persistent unexplained physical warning signs reported.',
    },

    // 6. Screening History
    {
      category: 'Screening History',
      title: 'Preventive Screening Adherence',
      impactType:
        screeningHistory?.hasPreviousScreening === 'Yes'
          ? 'protective'
          : 'neutral',
      impactLabel:
        screeningHistory?.hasPreviousScreening === 'Yes'
          ? 'Protective Factor'
          : 'Screening Due / Baseline',
      description: `Last recorded screening: ${
        screeningHistory?.lastCancerScreening || 'Never / Not specified'
      }. Regular screenings enable early-stage lesion detection prior to symptom onset.`,
    },
  ];

  return (
    <div className="exp-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="reports"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Content Area */}
      <main className="exp-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="exp-top-header">
          <div className="breadcrumb-nav">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('assessment-results')}
            >
              {t('results.title', 'Results')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('explanation.title', 'Explanation & Recommendations')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('assessment-results')}
          >
            {t('explanation.backToResult', '← Back to Result')}
          </button>
        </header>

        <div className="exp-container">
          {/* Top Hero Banner */}
          <div className="exp-hero-card">
            <div className="intro-badge" style={{ alignSelf: 'flex-start' }}>
              <ShieldCrossIcon size={16} />
              <span>{t('explanation.guidanceBadge', 'Evidence-Based Clinical Guidance')}</span>
            </div>

            <div className="result-header-group">
              <h1 className="exp-hero-heading">{t('explanation.title', 'Explanation & Recommendations')}</h1>
              <p className="exp-hero-subtext">
                Personalized synthesis for{' '}
                <strong>{basicInfo.fullName?.trim() || 'Registered User'}</strong> based on current oncology
                screening frameworks (USPSTF, ACS, NCCN).
              </p>
            </div>

            {/* Tabs Navigation */}
            <div className="exp-tabs-nav" role="tablist" aria-label="Explanation Views">
              <button
                type="button"
                className={`exp-tab-btn ${activeTab === 'explanation' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('explanation')}
                role="tab"
                aria-selected={activeTab === 'explanation'}
              >
                <ReportsFileIcon size={16} />
                <span>{t('explanation.tabExplanation', 'Explanation')}</span>
              </button>

              <button
                type="button"
                className={`exp-tab-btn ${activeTab === 'recommendations' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
                role="tab"
                aria-selected={activeTab === 'recommendations'}
              >
                <CheckCircleIcon size={16} />
                <span>{t('explanation.tabRecommendations', 'Recommendations')}</span>
              </button>

              <button
                type="button"
                className={`exp-tab-btn ${activeTab === 'next-steps' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('next-steps')}
                role="tab"
                aria-selected={activeTab === 'next-steps'}
              >
                <ClockIcon size={16} />
                <span>{t('explanation.tabNextSteps', 'Next Steps')}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXPLANATION */}
          {activeTab === 'explanation' && (
            <div className="tab-content-card" role="tabpanel" aria-label="Explanation Panel">
              <div className="tab-header-block">
                <h2 className="tab-title-heading">{t('explanation.factorsTitle', 'Factors Influencing Your Assessment')}</h2>
                <p className="tab-subtitle-text">
                  {t('explanation.factorsSubtitle', 'Assessment factor impact breakdown based on your reported clinical variables.')}
                </p>
              </div>

              <div className="factors-stack-list">
                {dynamicFactors.map((factor, idx) => (
                  <div key={idx} className="factor-impact-row">
                    <div className="factor-left-details">
                      <span className="factor-category-tag">{factor.category}</span>
                      <h3 className="factor-title-strong">{factor.title}</h3>
                      <p className="factor-desc-detail">{factor.description}</p>
                    </div>

                    <div className={`impact-badge-pill ${factor.impactType}`}>
                      {factor.impactType === 'increased' && <AlertCircleIcon size={14} />}
                      {factor.impactType === 'protective' && <CheckCircleIcon size={14} />}
                      <span>{factor.impactLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="tab-content-card" role="tabpanel" aria-label="Recommendations Panel">
              <div className="tab-header-block">
                <h2 className="tab-title-heading">{t('explanation.recTitle', 'Personalized Recommendations')}</h2>
                <p className="tab-subtitle-text">
                  {t('explanation.recSubtitle', 'Evidence-based preventive interventions approved by standard oncology frameworks.')}
                </p>
              </div>

              <div className="recommendations-grid">
                {/* 1. Healthy Lifestyle */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <CheckCircleIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recNutritionTitle', 'Healthy Lifestyle & Nutrition')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {t('explanation.recNutritionBody', 'Prioritize a Mediterranean-style dietary pattern rich in cruciferous vegetables, whole grains, fiber, and antioxidant-rich legumes. Minimize ultra-processed and charbroiled red meats.')}
                  </p>
                </div>

                {/* 2. Physical Activity */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <CheckCircleIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recActivityTitle', 'Routine Physical Activity')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {t('explanation.recActivityBody', 'Aim for 150 to 300 minutes of moderate-intensity aerobic exercise or 75 minutes of vigorous exercise weekly, paired with resistance training twice a week.')}
                  </p>
                </div>

                {/* 3. Tobacco Avoidance */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <ShieldCrossIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recTobaccoTitle', 'Tobacco Avoidance & Cessation')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {t('explanation.recTobaccoBody', 'Avoid all forms of combustible and smokeless tobacco products. If applicable, seek clinician-guided cessation counseling and nicotine replacement therapies.')}
                  </p>
                </div>

                {/* 4. Alcohol Reduction */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <ShieldCrossIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recAlcoholTitle', 'Alcohol Reduction')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {t('explanation.recAlcoholBody', 'Limit alcohol consumption. Emerging oncology guidelines note that minimizing alcohol intake significantly reduces mucosal and metabolic cellular stress.')}
                  </p>
                </div>

                {/* 5. Regular Health Check-ups */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <ReportsFileIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recCheckupsTitle', 'Regular Health Check-ups')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {t('explanation.recCheckupsBody', 'Maintain annual comprehensive primary care check-ups, including baseline blood panels, oral mucosal exams, and full-body dermatologic evaluations.')}
                  </p>
                </div>

                {/* 6. Screening Discussion */}
                <div className="recom-card-item">
                  <div className="recom-card-header">
                    <div className="recom-icon-circle">
                      <AssessmentIcon size={18} />
                    </div>
                    <h3 className="recom-title-text">{t('explanation.recScreeningTitle', 'Screening Discussion with Clinician')}</h3>
                  </div>
                  <p className="recom-body-text">
                    {isFemale
                      ? t('explanation.recScreeningFemale', 'Discuss age-appropriate screenings (e.g. mammography, Pap cytology, colonoscopy, or skin inspection) tailored to your personal and family medical history.')
                      : t('explanation.recScreeningMale', 'Discuss age-appropriate screenings (e.g. colonoscopy, low-dose CT lung screen, or oral mucosal check) tailored to your personal and family medical history.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NEXT STEPS */}
          {activeTab === 'next-steps' && (
            <div className="tab-content-card" role="tabpanel" aria-label="Next Steps Panel">
              <div className="tab-header-block">
                <h2 className="tab-title-heading">{t('explanation.nextStepsTitle', 'Recommended Next Steps')}</h2>
                <p className="tab-subtitle-text">
                  {t('explanation.nextStepsSubtitle', 'Actionable steps to take with your healthcare provider following this assessment.')}
                </p>
              </div>

              <div className="next-steps-stack">
                <div className="next-step-card">
                  <div className="next-step-num">1</div>
                  <div className="next-step-content">
                    <h3 className="next-step-title">{t('explanation.step1Title', 'Schedule Primary Care Wellness Consultation')}</h3>
                    <p className="next-step-desc">
                      {t('explanation.step1Desc', 'Book an appointment with your primary care doctor to review baseline vital markers, routine lab work, and screening timeline adherence.')}
                    </p>
                  </div>
                </div>

                <div className="next-step-card">
                  <div className="next-step-num">2</div>
                  <div className="next-step-content">
                    <h3 className="next-step-title">{t('explanation.step2Title', 'Bring This Assessment Summary')}</h3>
                    <p className="next-step-desc">
                      {t('explanation.step2Desc', 'Export or review your recorded family history and symptom log with your physician to inform their clinical diagnostic decisions.')}
                    </p>
                  </div>
                </div>

                <div className="next-step-card">
                  <div className="next-step-num">3</div>
                  <div className="next-step-content">
                    <h3 className="next-step-title">{t('explanation.step3Title', 'Evaluate Symptom Changes & Duration')}</h3>
                    <p className="next-step-desc">
                      {t('explanation.step3Desc', 'If you have reported any persistent symptoms, ensure they are actively evaluated to rule out non-malignant or early-stage conditions.')}
                    </p>
                  </div>
                </div>

                <div className="next-step-card">
                  <div className="next-step-num">4</div>
                  <div className="next-step-content">
                    <h3 className="next-step-title">{t('explanation.step4Title', 'Set Annual Risk Re-Assessment Reminder')}</h3>
                    <p className="next-step-desc">
                      {t('explanation.step4Desc', 'Update your OncoGuards assessment annually or whenever significant changes in your health, lifestyle, or family history occur.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEDICAL DISCLAIMER */}
          <div className="exp-disclaimer-box" role="note" aria-label="Medical Disclaimer">
            <AlertCircleIcon size={22} className="disclaimer-icon" style={{ color: '#1D837F', flexShrink: 0 }} />
            <p className="exp-disclaimer-text">
              {t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="exp-actions-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('assessment-results')}
            >
              {t('explanation.backToResult', '← Back to Result')}
            </button>

            <div className="exp-actions-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNavigate('dashboard')}
              >
                {t('explanation.returnDashboard', 'Return to Dashboard')}
              </button>

              <button
                type="button"
                className="btn-new-assessment"
                onClick={handleStartNewAssessment}
              >
                <AssessmentIcon size={16} />
                <span>{t('detailedReport.updateProfile', 'Update Assessment')}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => onNavigate('ai-assistant')}
              >
                <AssistantBotIcon size={16} />
                <span>{t('explanation.chatAi', 'Chat with AI Assistant →')}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplanationRecommendationsPage;

