import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { BrandLogo } from './components/BrandLogo';
import {
  ShieldCrossIcon,
  AlertCircleIcon,
  PrintIcon,
  AssessmentIcon,
} from './assets/MedicalIcons';
import './styles/DetailedReportPage.css';
import { CancerTypeKey, initialAssessmentState } from './types/assessment';

interface DetailedReportPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

const FEATURE_NAME_MAP: Record<string, string> = {
  AGE: 'Age',
  GENDER: 'Biological Sex',
  SMOKING: 'Combustible Tobacco Smoking',
  PASSIVE_SMOKER: 'Passive Tobacco Exposure',
  AIR_POLLUTION: 'Environmental Air Pollution Exposure',
  OCCUPATIONAL_HAZARDS: 'Occupational Dust & Chemical Hazards',
  GENETIC_RISK: 'Family / Hereditary Genetic Risk',
  CHRONIC_LUNG_DISEASE: 'Chronic Respiratory Disease',
  BALANCED_DIET: 'Dietary Balance',
  OBESITY: 'BMI / Obesity Level',
  CHEST_PAIN: 'Chest Pain Severity',
  COUGHING_OF_BLOOD: 'Coughing of Blood (Hemoptysis)',
  DRY_COUGH: 'Persistent Cough Severity',
  SHORTNESS_OF_BREATH: 'Shortness of Breath (Dyspnea)',
  WEIGHT_LOSS: 'Unexplained Weight Loss',
  WHEEZING: 'Respiratory Wheezing',
  SWALLOWING_DIFFICULTY: 'Difficulty Swallowing (Dysphagia)',
  CLUBBING_OF_FINGER_NAILS: 'Finger Nail Clubbing',
  FREQUENT_COLD: 'Frequent Respiratory Colds',
  FATIGUE: 'Chronic Fatigue Severity',
  SNORING: 'Snoring / Sleep Apnea Pattern',
  MENOPAUS: 'Menopausal Status',
  AGEGRP: 'Age Cohort Group',
  DENSITY: 'Breast Tissue Density (BI-RADS)',
  RACE: 'Racial / Ethnic Demographic',
  HISPANIC: 'Hispanic Ethnicity',
  BMI: 'Body Mass Index Category',
  AGEFIRST: 'Age at First Live Birth',
  NRELBC: 'First-Degree Relatives with Breast Cancer',
  BRSTPROC: 'Prior Breast Biopsy / Diagnostic Procedure',
  LASTMAMM: 'Previous Screening Mammogram Result',
  SURGMENO: 'Surgical vs. Natural Menopause',
  HRT: 'Hormone Replacement Therapy Use',
  NUM_SEXUAL_PARTNERS: 'Number of Sexual Partners',
  FIRST_SEXUAL_INTERCOURSE_AGE: 'Age at First Intercourse',
  NUM_PREGNANCIES: 'Number of Pregnancies',
  SMOKES: 'Current Smoking Status',
  SMOKES_YEARS: 'Duration of Smoking (Years)',
  HORMONAL_CONTRACEPTIVES: 'Hormonal Contraceptive Use',
  HORMONAL_CONTRACEPTIVES_YEARS: 'Duration of Oral Contraceptives (Years)',
  IUD: 'Intrauterine Device (IUD) Use',
  IUD_YEARS: 'Duration of IUD Use (Years)',
  STDS: 'History of Sexually Transmitted Infections',
  STDS_NUMBER: 'Number of Documented STIs',
};

const formatLabel = (str: string) => {
  if (!str) return '';
  const trimmed = str.trim();
  const upper = trimmed.toUpperCase();
  if (FEATURE_NAME_MAP[upper]) {
    return FEATURE_NAME_MAP[upper];
  }
  return trimmed
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'low': return '#10b981'; // Green
    case 'medium': return '#f59e0b'; // Amber
    case 'high': return '#ef4444'; // Red
    default: return '#6b7280'; // Gray
  }
};

export const DetailedReportPage: React.FC<DetailedReportPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const reportRef = useRef<HTMLDivElement>(null);
  const { state: assessmentState, pastAssessments } = useAssessment();
  const [reportIdOverride, setReportIdOverride] = React.useState<string | null>(null);

  const CANCER_DISPLAY_NAMES: Record<string, string> = {
    lung: t('results.lungCancer', 'Lung Cancer'),
    breast: t('results.breastCancer', 'Breast Cancer'),
    oral: t('results.oralCancer', 'Oral Cancer'),
    cervical: t('results.cervicalCancer', 'Cervical Cancer'),
  };

  React.useEffect(() => {
    // Check if the hash contains an ?id= parameter
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      const params = new URLSearchParams(hashParts[1]);
      setReportIdOverride(params.get('id'));
    }
  }, []);

  let backendResult = assessmentState.backendResult;
  let basicInfo = assessmentState.basicInfo;
  let customDate: string | undefined;

  if (reportIdOverride) {
    const pastRecord = pastAssessments.find(a => a.id === reportIdOverride);
    if (pastRecord && pastRecord.backendResult) {
      backendResult = pastRecord.backendResult;
      basicInfo = {
        ...initialAssessmentState.basicInfo,
        fullName: pastRecord.userDemographics.name,
        age: pastRecord.userDemographics.age,
        biologicalSex: pastRecord.userDemographics.sex as any,
        biological_sex: pastRecord.userDemographics.sex as any,
        state: pastRecord.userDemographics.location,
      };
      customDate = pastRecord.fullDate;
    }
  }

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const hasSavedProfile = Boolean(
    assessmentState.hasCompletedProfile ||
    (assessmentState.basicInfo.fullName?.trim() && assessmentState.basicInfo.age && (assessmentState.basicInfo.biologicalSex || assessmentState.basicInfo.biological_sex))
  );

  const handleStartNewAssessment = () => {
    if (hasSavedProfile) {
      onNavigate('assessment-symptoms');
    } else {
      onNavigate('health-profile');
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    
    // Configure html2pdf options for a clean multi-page document
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4] as [number, number, number, number],
      filename: `OncoGuards_Clinical_Report_${reportId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        windowWidth: 880,
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation error, falling back to browser print:', err);
      window.print();
    }
  };

  // Determine if assessment is completed based on presence of cancer types in result
  const hasAssessmentData = backendResult && (
    backendResult.lung || 
    backendResult.breast || 
    backendResult.oral || 
    backendResult.cervical
  );

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const displayDate = customDate || backendResult?.assessmentDate || currentDateFormatted;
  const reportId = reportIdOverride || ('OG-2026-' + (basicInfo.age ? `${basicInfo.age}72` : '8942'));

  const cancerTypes: CancerTypeKey[] = ['lung', 'breast', 'oral', 'cervical'];

  return (
    <div className="report-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="reports"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Report Area */}
      <main className="report-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="report-top-header no-print">
          <div className="breadcrumb-nav">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('detailedReport.title', 'Assessment Report')}</span>
          </div>

          {hasAssessmentData && (
            <div className="report-top-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={handleDownloadPDF}
              >
                <PrintIcon size={16} />
                <span>{t('detailedReport.downloadPdf', 'Download Report (PDF)')}</span>
              </button>
            </div>
          )}
        </header>

        {/* Printable Report Document Sheet */}
        <div className="report-document-sheet" ref={reportRef}>
          {/* Document Header & Branding */}
          <div className="doc-header-block">
            <div className="doc-brand-row">
              <BrandLogo size="normal" showTagline={true} />
              <div className="doc-badge-pill">
                <ShieldCrossIcon size={16} />
                <span>{t('detailedReport.docBadge', 'Clinical Risk Awareness Report')}</span>
              </div>
            </div>

            <h1 className="doc-report-title">{t('detailedReport.heading', 'Personalized Health Risk Assessment Report')}</h1>

            {hasAssessmentData && (
              <div className="doc-patient-meta-grid">
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('detailedReport.userName', 'User Name')}:</span>
                  <span className="doc-meta-value">{basicInfo.fullName?.trim() || 'Registered User'}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('basicInfo.age', 'Age')}:</span>
                  <span className="doc-meta-value">{basicInfo.age ? `${basicInfo.age} years` : 'Recorded'}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('basicInfo.biologicalSex', 'Biological Sex')}:</span>
                  <span className="doc-meta-value" style={{ textTransform: 'capitalize' }}>
                    {basicInfo.biological_sex || basicInfo.biologicalSex || 'Recorded'}
                  </span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('review.location', 'Location')}:</span>
                  <span className="doc-meta-value">
                    {basicInfo.city && basicInfo.state
                      ? `${basicInfo.city}, ${basicInfo.state}`
                      : 'Recorded'}
                  </span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('results.assessmentDate', 'Assessment Date')}:</span>
                  <span className="doc-meta-value">{displayDate}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="doc-meta-label">{t('detailedReport.reportId', 'Report ID')}:</span>
                  <span className="doc-meta-value doc-report-id">{reportId}</span>
                </div>
              </div>
            )}
          </div>

          {!hasAssessmentData ? (
            <section className="doc-section-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <AssessmentIcon size={48} color="#9ca3af" />
              <h2 className="doc-section-heading" style={{ marginTop: '16px', borderBottom: 'none' }}>
                {t('detailedReport.completePrompt', 'Complete your assessment to generate a report.')}
              </h2>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '24px' }}
                onClick={() => onNavigate('assessment-step-symptoms')}
              >
                {t('detailedReport.startAssessment', 'Start Assessment')}
              </button>
            </section>
          ) : (
            <>
              {cancerTypes.map((cancerKey) => {
                const result = backendResult?.[cancerKey];
                if (!result || result.overall_tier === 'not_applicable') return null;

                const displayName = CANCER_DISPLAY_NAMES[cancerKey] || cancerKey;
                const badgeColor = getTierColor(result.overall_tier);

                return (
                  <section key={cancerKey} className="doc-section-card" style={{ marginBottom: '24px' }}>
                    <div className="doc-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="doc-section-heading" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>{displayName}</h2>
                      <span
                        className="doc-section-tag"
                        style={{
                          backgroundColor: `${badgeColor}15`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}40`,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {result.overall_tier} Risk
                      </span>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      {/* Layer 1: Triggered Factors (Rule Engine) */}
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          {t('detailedReport.identifiedFactors', 'Identified Risk Factors')} (Layer 1 Clinical Rules)
                        </h3>
                        {result.layer1?.triggered_factors && result.layer1.triggered_factors.length > 0 ? (
                          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#4b5563', margin: 0 }}>
                            {result.layer1.triggered_factors.map((factor, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{formatLabel(factor)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ color: '#6b7280', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>
                            No acute high-risk symptoms or rule-based triggers identified.
                          </p>
                        )}
                      </div>

                      {/* Layer 2: Key Factors Influencing This Result (ML Model & SHAP) */}
                      {result.layer2 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            {t('detailedReport.keyInfluencing', 'Key factors influencing this result')} (Layer 2 ML Model)
                          </h3>
                          {Array.isArray(result.layer2.top_factors) && result.layer2.top_factors.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#4b5563', margin: 0 }}>
                                {result.layer2.top_factors.map((factor: string, idx: number) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    <strong>{formatLabel(factor)}</strong>
                                  </li>
                                ))}
                              </ul>
                              {Array.isArray(result.layer2.protective_factors) && result.layer2.protective_factors.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F766E' }}>
                                    Protective Factors:
                                  </span>
                                  <ul style={{ listStyleType: 'circle', paddingLeft: '20px', color: '#0F766E', margin: '2px 0 0 0' }}>
                                    {result.layer2.protective_factors.map((factor: string, idx: number) => (
                                      <li key={idx} style={{ marginBottom: '2px', fontSize: '0.84rem' }}>
                                        {formatLabel(factor)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : result.layer2.model_available === false ? (
                            <p style={{ color: '#6b7280', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>
                              Heuristic Clinical Evaluation (Layer 1 Rule-Based Protocol).
                            </p>
                          ) : (
                            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#4b5563', margin: 0 }}>
                              {Object.entries(result.layer2)
                                .filter(([key]) => !['model_score', 'model_available', 'probability', 'tier', 'top_factors', 'protective_factors'].includes(key))
                                .map(([key], idx) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    {formatLabel(key)}
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Layer 3: Recommendation */}
                      {result.layer3 && (
                        <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>
                            {t('results.guidelineRec', 'Recommendation')}
                          </h3>
                          <p style={{ color: '#1e3a8a', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                            {result.layer3?.guidance_text || (typeof result.layer3 === 'string' ? result.layer3 : JSON.stringify(result.layer3))}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </>
          )}

          {/* SECTION 7 — CLINICAL DISCLAIMER */}
          <section className="doc-disclaimer-box" style={{ marginTop: '40px' }}>
            <AlertCircleIcon size={24} style={{ color: '#6b7280', marginBottom: '12px' }} />
            <h3 className="disclaimer-heading">{t('dashboard.clinicalDisclaimerTitle', 'Clinical Disclaimer')}</h3>
            <p className="disclaimer-body-text">
              {t('detailedReport.disclaimerBody', 'This report reflects a risk-awareness estimate generated by an AI model, not a medical diagnosis. Please consult a qualified healthcare professional to discuss these results.')}
            </p>
          </section>

          {/* REPORT ACTIONS FOOTER */}
          <div className="doc-actions-footer no-print">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.backToDashboard', '← Back to Dashboard')}
            </button>

            {hasAssessmentData && (
              <div className="doc-actions-group">
                <button
                  type="button"
                  className="btn-report-new"
                  onClick={handleStartNewAssessment}
                >
                  <AssessmentIcon size={16} />
                  <span>{t('detailedReport.updateProfile', 'Update Assessment')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleDownloadPDF}
                >
                  <PrintIcon size={16} />
                  <span>{t('detailedReport.downloadPdf', 'Download Report (PDF)')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="reports" onNavigate={onNavigate} />
    </div>
  );
};

export default DetailedReportPage;

