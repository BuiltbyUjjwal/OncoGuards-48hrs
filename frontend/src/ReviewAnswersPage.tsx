import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import {
  AssessmentIcon,
  CheckCircleIcon,
  ShieldCrossIcon,
  UserIcon,
  AlertCircleIcon,
} from './assets/MedicalIcons';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import './styles/MedicalHistorySectionPage.css';

interface ReviewAnswersPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ReviewAnswersPage: React.FC<ReviewAnswersPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, isFemale, markProfileCompleted } = useAssessment();
  const { basicInfo, lifestyle, medicalHistory, womenOnly, screeningHistory } = assessmentState;

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const [isSaved, setIsSaved] = React.useState(false);

  const handleEditStep = (stepRoute: string) => {
    onNavigate(stepRoute);
  };

  const handleSaveAndReturn = () => {
    markProfileCompleted(true);
    setIsSaved(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1200);
  };

  const handleGoToSymptoms = () => {
    markProfileCompleted(true);
    onNavigate('assessment-symptoms');
  };

  return (
    <div className="section-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      {/* Main Content Area */}
      <main className="section-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="section-top-header">
          <div className="breadcrumb-nav">
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('health-profile')}>
              {t('nav.healthProfile', 'Assessment')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('review.reviewBadge', 'Review')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('assessment-step-screening')}
          >
            {t('review.backToScreening', '← Back to Screening History')}
          </button>
        </header>

        <div className="section-container" style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div className="section-form-card">
            {/* Completion Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #A7F3D0',
                borderRadius: '12px',
                padding: '14px 20px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleIcon size={22} color="#0F766E" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F766E' }}>
                    {t('review.profileCompletedTitle', 'Assessment Completed')}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                    {t('review.profileCompletedSub', 'All profile sections are complete. Review your information below.')}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0F766E',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #A7F3D0',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                {t('review.infoCompletedBadge', 'Information Completed')}
              </span>
            </div>

            {/* Header */}
            <div className="form-header-group">
              <h1 className="form-section-heading">{t('review.heading', 'Review Your Assessment')}</h1>
              <p className="form-section-subtext">
                {t('review.subheading', 'Your personal, lifestyle, medical, family, and screening records are summarized here. Click Edit on any section to update details.')}
              </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* SECTION 1: Basic Information */}
              <div
                style={{
                  border: '1.5px solid #CFE8F7',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserIcon size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172033' }}>
                      {t('review.secPersonal', '1. Personal Demographics')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                    onClick={() => handleEditStep('assessment-step1')}
                  >
                    {t('review.editBtn', 'Edit')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('basicInfo.fullName', 'Full Name')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{basicInfo.fullName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('basicInfo.age', 'Age')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{basicInfo.age ? `${basicInfo.age} yrs` : '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('basicInfo.biologicalSex', 'Biological Sex')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033', textTransform: 'capitalize' }}>
                      {basicInfo.biological_sex || basicInfo.biologicalSex || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('review.location', 'Location')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {basicInfo.city ? `${basicInfo.city}, ${basicInfo.state}` : basicInfo.state || '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Lifestyle */}
              <div
                style={{
                  border: '1.5px solid #CFE8F7',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCrossIcon size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172033' }}>
                      {t('review.secLifestyle', '2. Lifestyle & Exposures')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                    onClick={() => handleEditStep('assessment-step2')}
                  >
                    {t('review.editBtn', 'Edit')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('lifestyle.tobaccoUse', 'Tobacco Use')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033', textTransform: 'capitalize' }}>
                      {lifestyle.tobaccoUse || '—'}
                      {lifestyle.tobaccoDuration ? ` (${lifestyle.tobaccoDuration})` : ''}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('lifestyle.alcoholConsumption', 'Alcohol Consumption')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{lifestyle.alcoholConsumption || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('lifestyle.physicalActivity', 'Physical Activity')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{lifestyle.physicalActivityLevel || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('lifestyle.dietPattern', 'Diet Pattern')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{lifestyle.dietDescription || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('lifestyle.weightStatus', 'Weight Status')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>{lifestyle.overweightStatus || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Medical & Family History */}
              <div
                style={{
                  border: '1.5px solid #CFE8F7',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AssessmentIcon size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172033' }}>
                      {t('review.secMedical', '3. Medical & Family History')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                    onClick={() => handleEditStep('assessment-step3')}
                  >
                    {t('review.editBtn', 'Edit')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('medicalHistory.familyCancerHistory', 'Family Cancer History')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {medicalHistory.hasFamilyCancerHistory === 'Yes'
                        ? `Yes (${
                            medicalHistory.familyCancerTypes
                              ?.map((tItem) =>
                                tItem === 'Other' && medicalHistory.familyCancerOtherText
                                  ? `Other: ${medicalHistory.familyCancerOtherText}`
                                  : tItem
                              )
                              .join(', ') || 'Diagnoses recorded'
                          })`
                        : medicalHistory.hasFamilyCancerHistory || 'No family history reported'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('medicalHistory.medicalConditions', 'Medical Conditions')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {medicalHistory.medicalConditions?.length
                        ? medicalHistory.medicalConditions.join(', ')
                        : 'None reported'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('medicalHistory.priorCancer', 'Prior Cancer Diagnosis')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {medicalHistory.hasPreviousCancerDiagnosis || 'No'}
                      {medicalHistory.previousCancerType ? ` (${medicalHistory.previousCancerType})` : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Women's Health (if female) */}
              {isFemale && (
                <div
                  style={{
                    border: '1.5px solid #BAE6FD',
                    borderRadius: '12px',
                    backgroundColor: '#F8FCFD',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172033' }}>
                      {t('review.secWomens', "4. Women's Health")}
                    </h3>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                      onClick={() => handleEditStep('assessment-step4')}
                    >
                      {t('review.editBtn', 'Edit')}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.menarcheBadge', 'Periods Began')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.agePeriodsBegan || womenOnly.firstPeriodAge || '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.menopauseBadge', 'Menopause Status')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.menopauseStatus || '—'}
                        {womenOnly.menopauseAge ? ` (Age: ${womenOnly.menopauseAge})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.pregnancyBadge', 'Pregnancy History')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.pregnancyHistory || womenOnly.hadChildren || '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.bcBadge', 'Oral Contraceptives')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.oralContraceptiveUse || '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.hrtBadge', 'HRT Use')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.hormoneReplacementTherapy || womenOnly.usedHormoneTherapy || '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('womensHealth.hpvBadge', 'HPV Vaccination')}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                        {womenOnly.hpvVaccinationStatus || '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: Screening History */}
              <div
                style={{
                  border: '1.5px solid #CFE8F7',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCrossIcon size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172033' }}>
                      {isFemale ? t('review.secScreeningFemale', '5. Screening History') : t('review.secScreeningMale', '4. Screening History')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                    onClick={() => handleEditStep('assessment-step-screening')}
                  >
                    {t('review.editBtn', 'Edit')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('screening.priorScreeningBadge', 'Prior Screenings')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {screeningHistory.hasPreviousScreening || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('screening.testsBadge', 'Tests Attended')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {screeningHistory.screeningsDone?.length
                        ? screeningHistory.screeningsDone.join(', ')
                        : 'None'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block' }}>{t('screening.timingBadge', 'Most Recent Timing')}</span>
                    <strong style={{ fontSize: '0.92rem', color: '#172033' }}>
                      {screeningHistory.lastCancerScreening || '—'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Clinical Disclaimer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#FEFCE8',
                border: '1px solid #FEF08A',
                borderRadius: '10px',
                padding: '14px 18px',
                fontSize: '0.83rem',
                color: '#854D0E',
                lineHeight: 1.5,
              }}
              role="note"
            >
              <AlertCircleIcon size={20} color="#854D0E" />
              <span>{t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}</span>
            </div>

            {/* Save Confirmation Toast / Banner */}
            {isSaved && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  color: '#0F766E',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                }}
                role="status"
              >
                <CheckCircleIcon size={20} color="#0F766E" />
                <span>{t('review.savedMessage', 'Information saved. Returning to Dashboard...')}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="form-actions-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-nav-back"
                onClick={() => onNavigate('assessment-step-screening')}
              >
                {t('review.backToScreening', '← Back to Screening')}
              </button>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', fontWeight: 600 }}
                  onClick={handleSaveAndReturn}
                  disabled={isSaved}
                >
                  <span>{isSaved ? t('review.savedCheck', 'Saved ✓') : t('review.saveAndExit', 'Save & Exit')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-nav-next"
                  style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 800 }}
                  onClick={handleGoToSymptoms}
                >
                  <span>Continue to Current Symptoms →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="health-profile" onNavigate={onNavigate} />
    </div>
  );
};

export default ReviewAnswersPage;

