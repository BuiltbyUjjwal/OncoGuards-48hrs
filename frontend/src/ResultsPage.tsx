import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { RiskGaugeSemiCircle } from './components/RiskGaugeSemiCircle';
import { ScreeningAlertBanner } from './components/ScreeningAlertBanner';
import { CancerResultItem } from './types/assessment';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import {
  ShieldCrossIcon,
  ClockIcon,
  AlertCircleIcon,
  ReportsFileIcon,
  CheckCircleIcon,
} from './assets/MedicalIcons';
import './styles/ResultsPage.css';

interface ResultsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, completeAssessment, isFemale } = useAssessment();
  const { basicInfo, lifestyle, medicalHistory, symptoms, backendResult } = assessmentState;

  // Ensure assessment completion is marked in state
  useEffect(() => {
    if (!backendResult) {
      completeAssessment();
    }
  }, [backendResult, completeAssessment]);

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const displayDate = backendResult?.assessmentDate || currentDateFormatted;
  const userName = basicInfo.fullName ? basicInfo.fullName.split(' ')[0] : 'Patient';
  const pageTitle = basicInfo.fullName ? `${userName}'s Assessment Result` : t('results.title', 'Your Risk Assessment Result');

  // Fallback per-cancer results if directly accessed
  const defaultCancerResults: CancerResultItem[] = [
    {
      cancerType: 'lung',
      displayName: 'Lung Cancer',
      riskTier: 'Low Risk',
      score: 22,
      modelType: 'ml_model',
      keyFactors: ['No active combustible tobacco use', 'No family history of lung carcinoma'],
      guidelineRecommendation: 'Maintain clean air practices and routine health maintenance.',
      isApplicable: true,
    },
    {
      cancerType: 'oral',
      displayName: 'Oral Cancer',
      riskTier: 'Low Risk',
      score: 16,
      modelType: 'prototype_model',
      keyFactors: ['No mucosal ulcerations or smokeless tobacco habit'],
      guidelineRecommendation: 'Maintain routine dental checkups every 6 to 12 months.',
      isApplicable: true,
    },
  ];

  if (isFemale) {
    defaultCancerResults.push(
      {
        cancerType: 'breast',
        displayName: 'Breast Cancer',
        riskTier: 'Low Risk',
        score: 20,
        modelType: 'prototype_model',
        keyFactors: ['No discrete breast lumps or first-degree history reported'],
        guidelineRecommendation: 'Practice monthly breast self-awareness and report changes promptly.',
        isApplicable: true,
      },
      {
        cancerType: 'cervical',
        displayName: 'Cervical Cancer',
        riskTier: 'Low Risk',
        score: 18,
        modelType: 'prototype_model',
        keyFactors: ['No abnormal gynecologic bleeding or persistent HPV reported'],
        guidelineRecommendation: 'Routine cervical screening (Pap smear every 3 yrs / HPV test every 5 yrs).',
        isApplicable: true,
      }
    );
  }

  // Filter out non-applicable items (e.g. breast/cervical for males)
  const allCards = backendResult?.cancerResults || defaultCancerResults;
  const cancerCards = allCards.filter((c) => {
    if (!isFemale && (c.cancerType === 'breast' || c.cancerType === 'cervical')) return false;
    return c.isApplicable !== false;
  });

  const getTierClass = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes('low')) return 'tier-low';
    if (t.includes('mod')) return 'tier-mod';
    if (t.includes('high')) return 'tier-high';
    return 'tier-na';
  };

  const formatTierText = (tier: string) => {
    if (tier === 'not_applicable') return 'Not Applicable';
    return tier;
  };

  // Dynamic Key Factors with Influence Tags
  const dynamicKeyFactors = [
    {
      name: t('results.factorTobacco', 'Tobacco & Smoking Exposure'),
      influence:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'never' && lifestyle.tobaccoUse !== 'Never'
          ? t('results.influenceHigh', 'Higher influence')
          : t('results.influenceLow', 'Lower influence'),
      influenceClass:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'never' && lifestyle.tobaccoUse !== 'Never' ? 'high' : 'low',
      barPercent: lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'never' && lifestyle.tobaccoUse !== 'Never' ? 75 : 15,
      detail:
        lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'never' && lifestyle.tobaccoUse !== 'Never'
          ? `Reported: ${lifestyle.tobaccoUse} (${lifestyle.tobaccoDuration || 'Duration noted'}).`
          : t('results.noTobaccoExp', 'No active combustible or smokeless tobacco exposure.'),
    },
    {
      name: t('results.factorHereditary', 'Hereditary Family Cancer History'),
      influence:
        medicalHistory.hasFamilyCancerHistory === 'Yes'
          ? t('results.influenceHigh', 'Higher influence')
          : t('results.influenceLow', 'Lower influence'),
      influenceClass:
        medicalHistory.hasFamilyCancerHistory === 'Yes' ? 'high' : 'low',
      barPercent: medicalHistory.hasFamilyCancerHistory === 'Yes' ? 80 : 20,
      detail:
        medicalHistory.hasFamilyCancerHistory === 'Yes'
          ? `Reported immediate family diagnoses (${
              medicalHistory.familyCancerTypes?.join(', ') || 'Recorded'
            }).`
          : t('results.noFamilyHistory', 'No immediate first-degree relative cancer history reported.'),
    },
    {
      name: t('results.factorPhysical', 'Physical Activity & Metabolic Profile'),
      influence:
        lifestyle.physicalActivityLevel?.includes('Active') ||
        lifestyle.physicalActivityLevel?.includes('Moderate')
          ? t('results.influenceLow', 'Lower influence')
          : t('results.influenceMod', 'Moderate influence'),
      influenceClass:
        lifestyle.physicalActivityLevel?.includes('Active') ||
        lifestyle.physicalActivityLevel?.includes('Moderate')
          ? 'low'
          : 'mod',
      barPercent:
        lifestyle.physicalActivityLevel?.includes('Active') ||
        lifestyle.physicalActivityLevel?.includes('Moderate')
          ? 25
          : 50,
      detail: `Activity level: ${
        lifestyle.physicalActivityLevel || 'Moderate'
      }. Regular physical exercise promotes cellular health.`,
    },
    {
      name: t('results.factorSymptoms', 'Reported Warning Symptoms'),
      influence:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? t('results.influenceMod', 'Moderate influence')
          : t('results.influenceLow', 'Lower influence'),
      influenceClass:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? 'mod'
          : 'low',
      barPercent:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? 60
          : 10,
      detail:
        symptoms.selectedSymptoms?.length > 0 &&
        !symptoms.selectedSymptoms.includes('None of the above')
          ? `${symptoms.selectedSymptoms.length} symptom(s) marked for clinician review.`
          : t('results.noSymptomsExp', 'No acute unexplained cancer warning signs reported.'),
    },
  ];

  return (
    <div className="results-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="reports"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Content Area */}
      <main className="results-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="results-top-header">
          <div className="breadcrumb-nav">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('results.title', 'Assessment Result')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('dashboard')}
          >
            {t('nav.backToDashboard', '← Back to Dashboard')}
          </button>
        </header>

        <div className="results-container">
          {/* Screening Guidelines Alert Banner */}
          <ScreeningAlertBanner />

          {/* ========================================================================= */}
          {/* TOP RESULT CARD WITH SEMI-CIRCULAR GAUGE */}
          {/* ========================================================================= */}
          <div className="main-result-card">
            <div className="result-card-top-row">
              <div className="intro-badge">
                <ShieldCrossIcon size={16} />
                <span>{t('results.protocolBadge', 'OncoGuards Clinical Risk Protocol')}</span>
              </div>
              <div className="assessment-date-pill">
                <ClockIcon size={14} />
                <span>{t('results.assessmentDate', 'Assessment Date')}: {displayDate}</span>
              </div>
            </div>

            <div className="result-header-group">
              <h1 className="results-main-heading">{pageTitle}</h1>
              <p className="results-subtext">
                Assessment data for{' '}
                <strong>{basicInfo.fullName || 'Registered Patient'}</strong> • Age:{' '}
                <strong>{basicInfo.age ? `${basicInfo.age} yrs` : 'Recorded'}</strong> • Biological
                Sex: <strong>{basicInfo.biological_sex || basicInfo.biologicalSex || 'Recorded'}</strong> • Location:{' '}
                <strong>
                  {basicInfo.city && basicInfo.state
                    ? `${basicInfo.city}, ${basicInfo.state}`
                    : 'Recorded'}
                </strong>
              </p>
            </div>

            {/* SEMI-CIRCULAR RISK GAUGE */}
            <div className="gauge-outer-card">
              <RiskGaugeSemiCircle
                score={typeof backendResult?.riskScore === 'number' ? backendResult.riskScore : undefined}
                category={backendResult?.riskCategory || 'Risk Assessment Evaluated'}
                isBackendReady={Boolean(backendResult?.riskCategory)}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INDIVIDUAL CANCER EVALUATION CARDS */}
          {/* ========================================================================= */}
          <section className="cancer-eval-section" aria-label="Individual Cancer Evaluations">
            <div className="cancer-eval-section-header">
              <h2 className="cancer-eval-section-title">{t('results.individualEvals', 'Individual Cancer Evaluations')}</h2>
              <span className="section-box-badge">{t('results.multiStrat', 'Multi-Cancer Stratification')}</span>
            </div>

            <div className="cancer-eval-grid">
              {cancerCards.map((cancer) => {
                return (
                  <article
                    key={cancer.cancerType}
                    className="cancer-eval-card"
                    aria-label={`${cancer.displayName} Evaluation Card`}
                  >
                    <div className="cancer-eval-top">
                      <div className="cancer-name-group">
                        <h3 className="cancer-card-title">{cancer.displayName}</h3>
                        {cancer.modelType === 'ml_model' ? (
                          <span className="model-badge ml-model">
                            <CheckCircleIcon size={12} color="#1D4ED8" />
                            {t('results.mlModelBadge', 'ML XGBoost Model')}
                          </span>
                        ) : (
                          <span className="model-badge prototype-model">
                            {t('results.protoBadge', 'Prototype Model (Heuristic v1)')}
                          </span>
                        )}
                      </div>

                      <span className={`risk-tier-badge ${getTierClass(cancer.riskTier)}`}>
                        {formatTierText(cancer.riskTier)}
                      </span>
                    </div>

                    <div className="cancer-factors-block">
                      <h4 className="cancer-factors-heading">{t('results.keyFactorsHeading', 'Key Contributing Factors')}</h4>
                      <ul className="cancer-factors-list">
                        {cancer.keyFactors.map((factor: any, fIdx: number) => (
                          <li key={fIdx}>{factor}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="cancer-guideline-box">
                      <strong>{t('results.guidelineRec', 'Guideline Recommendation')}: </strong>
                      {cancer.guidelineRecommendation}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* OVERALL ASSESSMENT SUMMARY */}
          {/* ========================================================================= */}
          <div className="result-section-box">
            <div className="section-box-header">
              <h2 className="section-box-title">{t('results.overallSummaryTitle', 'Overall Clinical Summary')}</h2>
              <span className="section-box-badge">{t('results.dynamicSynthesis', 'Dynamic Synthesis')}</span>
            </div>

            {backendResult?.overallAssessment || backendResult?.explanation ? (
              <p style={{ fontSize: '0.96rem', color: '#172033', lineHeight: 1.6, margin: 0 }}>
                {backendResult.overallAssessment || backendResult.explanation}
              </p>
            ) : (
              <div className="dynamic-placeholder-state">
                <ReportsFileIcon size={24} className="placeholder-icon-box" />
                <div className="placeholder-text-content">
                  <h3 className="placeholder-heading">{t('results.placeholderHeading', 'Backend Assessment Summary Feed')}</h3>
                  <p className="placeholder-body">
                    {t('results.placeholderBody', 'Assessment results and personalized clinical risk stratification will appear here after analysis.')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RELATIVE FACTOR INFLUENCE */}
          {/* ========================================================================= */}
          <div className="result-section-box">
            <div className="section-box-header">
              <h2 className="section-box-title">{t('results.factorInfluenceTitle', 'Relative Factor Influence')}</h2>
              <span className="section-box-badge">{t('results.determinantBreakdown', 'Determinant Breakdown')}</span>
            </div>

            <div className="factors-horizontal-bars-list">
              {dynamicKeyFactors.map((factor: any, fIdx: number) => (
                <div key={fIdx} className="factor-bar-row">
                  <div className="factor-bar-info">
                    <div className="factor-bar-labels">
                      <span className="factor-bar-title">{factor.name}</span>
                      <span className={`factor-influence-pill ${factor.influenceClass}`}>
                        {factor.influence}
                      </span>
                    </div>
                    <div className="factor-bar-track">
                      <div
                        className={`factor-bar-fill ${factor.influenceClass}`}
                        style={{ width: `${factor.barPercent}%` }}
                      />
                    </div>
                    <p className="factor-bar-desc">{factor.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* IMPORTANT MEDICAL DISCLAIMER */}
          {/* ========================================================================= */}
          <div className="medical-disclaimer-card" role="note" aria-label="Important Medical Disclaimer">
            <AlertCircleIcon size={24} className="disclaimer-icon" />
            <div className="disclaimer-text-content">
              <h4 className="disclaimer-title">{t('dashboard.clinicalDisclaimerTitle', 'Clinical Disclaimer')}</h4>
              <p className="disclaimer-body">
                {t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ACTION BUTTONS */}
          {/* ========================================================================= */}
          <div className="results-actions-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.backToDashboard', '← Back to Dashboard')}
            </button>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                onClick={() => onNavigate('assessment-report')}
              >
                <ReportsFileIcon size={16} />
                <span>{t('results.viewFullReport', 'View Full Clinical Report')}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-view-explanation"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 800 }}
                onClick={() => onNavigate('assessment-report')}
              >
                <span>{t('results.downloadPdf', 'Download Assessment PDF 📥')}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="reports" onNavigate={onNavigate} />
    </div>
  );
};

export default ResultsPage;

