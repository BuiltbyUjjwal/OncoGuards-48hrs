import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { useAssessment } from './context/AssessmentContext';
import {
  AssessmentIcon,
  SecureShieldIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UserIcon,
} from './assets/MedicalIcons';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import './styles/RiskAssessmentIntroPage.css';

interface RiskAssessmentIntroPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface ChecklistSection {
  number: number;
  title: string;
  subtitle: string;
  badge?: string;
  isConditional?: boolean;
}

export const RiskAssessmentIntroPage: React.FC<RiskAssessmentIntroPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState } = useAssessment();
  const { basicInfo, lifestyle, medicalHistory, hasCompletedProfile } = assessmentState;

  const isProfileAlreadySaved = Boolean(
    hasCompletedProfile || (basicInfo.fullName && basicInfo.age)
  );

  const assessmentSections: ChecklistSection[] = [
    {
      number: 1,
      title: t('basicInfo.title', 'Basic Information'),
      subtitle: t('dashboard.module1Desc', 'Full name, age, biological sex (male/female), city, and state.'),
    },
    {
      number: 2,
      title: t('lifestyle.title', 'Lifestyle'),
      subtitle: t('dashboard.module2Desc', 'Tobacco use, alcohol use, physical activity, diet, and weight awareness.'),
    },
    {
      number: 3,
      title: t('medicalHistory.title', 'Medical & Family History'),
      subtitle: t('dashboard.module3Desc', 'Family cancer history (+ type), medical conditions, and prior cancer diagnosis.'),
    },
    {
      number: 4,
      title: t('womensHealth.title', "Women's Health"),
      subtitle: t('dashboard.module4Desc', 'Age periods began, menopause status (+ age), pregnancy history, oral contraceptives, HRT, and HPV vaccination.'),
      badge: t('dashboard.module4Condition', 'Shown only for female users'),
      isConditional: true,
    },
    {
      number: 5,
      title: t('screening.title', 'Screening History'),
      subtitle: t('dashboard.module5Desc', 'Previous cancer screenings and tests attended (customized based on biological sex).'),
    },
  ];

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  return (
    <div className="intro-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Content Canvas */}
      <main className="intro-main-area">
        {/* Top Header Bar with Breadcrumb Navigation */}
        <header className="intro-top-header">
          <div className="breadcrumb-nav">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Assessment</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('dashboard')}
          >
            {t('nav.backToDashboard', '← Back to Dashboard')}
          </button>
        </header>

        <div className="intro-container">
          {/* If the user already saved their health profile, show Saved Health Profile summary */}
          {isProfileAlreadySaved ? (
            <div className="intro-hero-card">
              <div className="intro-progress-header">
                <div className="intro-step-pill" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}>
                  <CheckCircleIcon size={16} color="#059669" />
                  <span className="step-pill-text" style={{ color: '#065F46', fontWeight: 700 }}>
                    Saved Health Profile Active
                  </span>
                </div>
                <div className="intro-meta-tags">
                  <span className="intro-meta-item">
                    <SecureShieldIcon size={14} />
                    <span>Profile Verified</span>
                  </span>
                </div>
              </div>

              <div className="intro-heading-group" style={{ marginBottom: '24px' }}>
                <h1 className="intro-main-title">Ready for Current Symptoms</h1>
                <p className="intro-description-text">
                  Your base health profile is already saved. Proceed directly to log or update any physical symptoms
                  you are experiencing today for a multi-cancer risk assessment.
                </p>
              </div>

              {/* Saved Profile Summary Card */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {basicInfo.fullName || 'Registered Patient'}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                        Age: {basicInfo.age || '—'} • Sex: {basicInfo.biologicalSex || basicInfo.biological_sex || '—'} {basicInfo.city ? `• ${basicInfo.city}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#2563EB',
                      cursor: 'pointer',
                    }}
                    onClick={() => onNavigate('profile')}
                  >
                    Edit in Profile
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>TOBACCO USE</span>
                    <strong style={{ color: '#1E293B' }}>{lifestyle.tobaccoUse || 'Never'}</strong>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>ALCOHOL INTAKE</span>
                    <strong style={{ color: '#1E293B' }}>{lifestyle.alcoholConsumption || 'Never'}</strong>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>FAMILY HISTORY</span>
                    <strong style={{ color: '#1E293B' }}>{medicalHistory.hasFamilyCancerHistory || 'No'}</strong>
                  </div>
                </div>
              </div>

              {/* Medical Notice */}
              <div className="medical-disclaimer-card" role="note" style={{ marginBottom: '24px' }}>
                <div className="disclaimer-icon-wrapper">
                  <AlertCircleIcon size={20} className="disclaimer-icon" />
                </div>
                <div className="disclaimer-text-content">
                  <p className="disclaimer-body">
                    {t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="intro-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('dashboard')}
                >
                  {t('nav.backToDashboard', 'Back to Dashboard')}
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onClick={() => onNavigate('assessment-symptoms')}
                >
                  <span>Continue to Current Symptoms →</span>
                </button>
              </div>
            </div>
          ) : (
            /* First Time User Flow: 5 Steps Setup */
            <div className="intro-hero-card">
              {/* Progress State Badge: Step 0 of 5 */}
              <div className="intro-progress-header">
                <div className="intro-step-pill">
                  <span className="step-pill-dot" />
                  <span className="step-pill-text">{t('dashboard.healthProfileSetup', 'Health Profile Setup • Overview')}</span>
                </div>
                <div className="intro-meta-tags">
                  <span className="intro-meta-item">
                    <ClockIcon size={14} />
                    <span>3–5 Minutes</span>
                  </span>
                  <span className="intro-meta-item">
                    <SecureShieldIcon size={14} />
                    <span>100% Confidential</span>
                  </span>
                </div>
              </div>

              {/* Main Heading & Description */}
              <div className="intro-heading-group">
                <h1 className="intro-main-title">{t('dashboard.startAssessmentTitle', 'Complete Your Health Profile')}</h1>
                <p className="intro-description-text">
                  Complete your personal, lifestyle, medical, family, and screening information once to establish your base profile. You can then log current symptoms anytime.
                </p>
              </div>

              {/* Checklist of 5 Health Profile Sections */}
              <div className="sections-checklist-wrapper" role="region" aria-label="Health Profile Sections Checklist">
                <div className="checklist-header-row">
                  <h2 className="checklist-title">{t('dashboard.healthProfileSections', 'Health Profile Sections')}</h2>
                  <span className="checklist-subtitle">5 Guided Sections</span>
                </div>

                <div className="checklist-items-list">
                  {assessmentSections.map((sec) => (
                    <div
                      key={sec.number}
                      className={`checklist-item-card ${sec.isConditional ? 'conditional-card' : ''}`}
                    >
                      <div className="checklist-item-left">
                        <div className="checklist-num-circle" aria-hidden="true">
                          {sec.number}
                        </div>
                        <div className="checklist-item-content">
                          <div className="checklist-name-row">
                            <h3 className="checklist-section-name">{sec.title}</h3>
                            {sec.badge && (
                              <span className="checklist-badge-pill">{sec.badge}</span>
                            )}
                          </div>
                          <p className="checklist-section-desc">{sec.subtitle}</p>
                        </div>
                      </div>

                      <div className="checklist-item-status">
                        <span className="status-queue-pill">{t('common.ready', 'Ready')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professional Medical Disclaimer */}
              <div className="medical-disclaimer-card" role="note" aria-label="Medical Disclaimer">
                <div className="disclaimer-icon-wrapper" aria-hidden="true">
                  <AlertCircleIcon size={20} className="disclaimer-icon" />
                </div>
                <div className="disclaimer-text-content">
                  <h4 className="disclaimer-title">{t('dashboard.clinicalDisclaimerTitle', 'Clinical Information Notice')}</h4>
                  <p className="disclaimer-body">
                    {t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="intro-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary btn-action-back"
                  onClick={() => onNavigate('dashboard')}
                >
                  {t('nav.backToDashboard', 'Back to Dashboard')}
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-action-start"
                  onClick={() => onNavigate('assessment-step1')}
                >
                  <AssessmentIcon size={18} />
                  <span>Start Health Profile (Step 1) →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RiskAssessmentIntroPage;
