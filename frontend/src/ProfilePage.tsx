import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { useAuth } from './context/AuthContext';
import { ScreeningAlertBanner } from './components/ScreeningAlertBanner';
import {
  UserIcon,
  AssessmentIcon,
  SecureShieldIcon,
  ClockIcon,
  ShieldCrossIcon,
} from './assets/MedicalIcons';
import { getApplicableScreeningAlerts } from './config/screeningGuidelines';
import './styles/ProfilePage.css';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onLogout }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { state: assessmentState, pastAssessments, isHydrated } = useAssessment();
  const { basicInfo, lifestyle } = assessmentState;

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

  const getTierClass = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes('low')) return 'tier-low';
    if (t.includes('mod')) return 'tier-moderate';
    if (t.includes('high')) return 'tier-high';
    return 'tier-na';
  };

  const formatTierLabel = (tier: string) => {
    if (tier === 'not_applicable') return 'N/A';
    return tier;
  };

  const isSmoker = Boolean(
    lifestyle.isCurrentSmoker === true ||
    (typeof lifestyle.tobaccoUse === 'string' && lifestyle.tobaccoUse.includes('Smoke'))
  );
  const usesTobacco = Boolean(
    lifestyle.usesSmokelessTobacco === true ||
    (typeof lifestyle.tobaccoUse === 'string' && lifestyle.tobaccoUse && lifestyle.tobaccoUse !== 'Never' && lifestyle.tobaccoUse !== 'never')
  );
  const drinksAlcohol = Boolean(
    lifestyle.isAlcoholConsuming === true ||
    (typeof lifestyle.alcoholConsumption === 'string' &&
      (lifestyle.alcoholConsumption.includes('Regularly') || lifestyle.alcoholConsumption.includes('Occasionally') || lifestyle.alcoholConsumption.includes('Daily')))
  );

  const activeAlerts = getApplicableScreeningAlerts({
    age: basicInfo.age,
    gender: basicInfo.biologicalSex || basicInfo.biological_sex,
    isSmoker,
    usesTobacco,
    drinksAlcohol,
  });
  const unreadAlertsCount = activeAlerts.length;

  if (!isHydrated) {
    return (
      <div className="profile-layout-root">
        <Sidebar
          activeItem="profile"
          onNavigate={handleSidebarNavigate}
          onLogout={onLogout}
          unreadAlertsCount={0}
        />
        <main className="profile-main-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{t('common.loading', 'Loading user profile...')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Main Content Canvas */}
      <main className="profile-main-area">
        {/* Top Bar Header */}
        <header className="profile-top-bar">
          <div className="profile-title-group">
            <h1>{t('profile.title', 'User Profile')}</h1>
            <p>{t('profile.subtitle', 'View your clinical demographic baseline and past assessment records.')}</p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('dashboard')}
          >
            {t('nav.backToDashboard', '← Back to Dashboard')}
          </button>
        </header>

        {/* ── Profile Hero Card ── */}
        <section className="profile-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB 0%, #0F766E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 16px rgba(37,99,235,0.25)'
            }}>
              {basicInfo.profilePicture ? (
                <img src={basicInfo.profilePicture} alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : basicInfo.fullName ? (
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                  {basicInfo.fullName.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon size={36} color="#FFFFFF" />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#172033' }}>
                {basicInfo.fullName || currentUser?.displayName || 'Your Name'}
              </h2>
              <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#64748B' }}>
                {basicInfo.email || currentUser?.email || 'No email on file'}
              </p>
              {basicInfo.age && (
                <span style={{
                  display: 'inline-block', background: '#EFF6FF', color: '#2563EB',
                  borderRadius: '999px', padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700,
                  border: '1px solid #BFDBFE', marginRight: '8px'
                }}>
                  {t('basicInfo.age', 'Age')} {basicInfo.age}
                </span>
              )}
              {basicInfo.biologicalSex && (
                <span style={{
                  display: 'inline-block', background: '#F0FDF4', color: '#0F766E',
                  borderRadius: '999px', padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700,
                  border: '1px solid #A7F3D0'
                }}>
                  {basicInfo.biologicalSex.toLowerCase() === 'female' ? t('common.female', 'Female') : basicInfo.biologicalSex.toLowerCase() === 'male' ? t('common.male', 'Male') : basicInfo.biologicalSex}
                </span>
              )}
            </div>

            {/* Edit button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              onClick={() => onNavigate('settings')}
            >
              {t('profile.editProfile', 'Edit Profile')}
            </button>
          </div>
        </section>

        {/* Permanent Clinical Disclaimer Banner */}
        <div className="profile-permanent-disclaimer-banner" role="note" aria-label="Clinical Disclaimer">
          <div className="permanent-banner-icon-box" aria-hidden="true">
            <SecureShieldIcon size={18} />
          </div>
          <p className="permanent-banner-text">
            {t('profile.disclaimerNotice', 'Risk estimate, not a diagnosis — always confirm with a healthcare professional.')}
          </p>
        </div>

        {/* Screening Alerts Banner */}
        <ScreeningAlertBanner />

        {/* Demographic Details Card */}
        <section className="profile-card" aria-label="Demographic Information">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <div className="profile-card-icon-box" aria-hidden="true">
                <UserIcon size={20} />
              </div>
              <h2 className="profile-card-title">{t('profile.personalDemographics', 'Personal Demographics')}</h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem', padding: '6px 14px' }}
              onClick={() => onNavigate('assessment-step1')}
            >
              {t('profile.editDemographics', 'Edit Demographics')}
            </button>
          </div>

          <div className="profile-demographics-grid">
            <div className="profile-field-item">
              <span className="profile-field-label">{t('basicInfo.fullName', 'Full Name')}</span>
              <span className="profile-field-value">
                {basicInfo.fullName || <span className="profile-field-empty">{t('common.notProvidedYet', 'Not provided yet')}</span>}
              </span>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-label">{t('settings.email', 'Email')}</span>
              <span className="profile-field-value">
                {basicInfo.email || currentUser?.email || <span className="profile-field-empty">{t('common.notProvided', 'Not provided')}</span>}
              </span>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-label">{t('profile.phoneNumber', 'Phone Number')}</span>
              <span className="profile-field-value">
                {basicInfo.phoneNumber || <span className="profile-field-empty">{t('common.notProvided', 'Not provided')}</span>}
              </span>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-label">{t('basicInfo.age', 'Age')}</span>
              <span className="profile-field-value">
                {basicInfo.age ? `${basicInfo.age} ${t('common.years', 'years')}` : <span className="profile-field-empty">{t('common.notProvided', 'Not provided')}</span>}
              </span>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-label">{t('basicInfo.biologicalSex', 'Biological Sex')}</span>
              <span className="profile-field-value">
                {basicInfo.biologicalSex ? (
                  basicInfo.biologicalSex.toLowerCase() === 'female' ? t('common.female', 'Female') : basicInfo.biologicalSex.toLowerCase() === 'male' ? t('common.male', 'Male') : basicInfo.biologicalSex
                ) : (
                  <span className="profile-field-empty">{t('common.notSelected', 'Not selected')}</span>
                )}
              </span>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-label">{t('profile.locationField', 'Location (City / State)')}</span>
              <span className="profile-field-value">
                {basicInfo.city || basicInfo.state ? (
                  `${basicInfo.city ? `${basicInfo.city}, ` : ''}${basicInfo.state || ''}`
                ) : (
                  <span className="profile-field-empty">{t('common.notSpecified', 'Not specified')}</span>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Past Assessments History Card */}
        <section className="profile-card" aria-label="Assessment History">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <div className="profile-card-icon-box" aria-hidden="true" style={{ backgroundColor: '#F0FDF4', color: '#0F766E' }}>
                <AssessmentIcon size={20} />
              </div>
              <div>
                <h2 className="profile-card-title">{t('profile.pastAssessments', 'Past Risk Assessments')}</h2>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {t('profile.pastAssessmentsSub', 'Complete records of prior risk evaluations.')}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.84rem', padding: '8px 18px' }}
              onClick={handleStartNewAssessment}
            >
              {t('profile.takeAssessment', 'Take Assessment')}
            </button>
          </div>

          {pastAssessments.length === 0 ? (
            <div className="profile-empty-history" role="status">
              <div className="empty-history-icon-box" aria-hidden="true">
                <ShieldCrossIcon size={28} />
              </div>
              <h3 className="empty-history-title">{t('profile.noAssessmentsYet', 'No assessments yet')}</h3>
              <p className="empty-history-subtext">
                {t('profile.noAssessmentsSub', "You haven't completed any cancer risk assessments yet. Start your first assessment to evaluate your lifestyle, hereditary, and screening factors.")}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartNewAssessment}
              >
                <AssessmentIcon size={16} />
                <span>{t('profile.startRiskAssessment', 'Start Risk Assessment')}</span>
              </button>
            </div>
          ) : (
            <div className="assessments-table-wrapper">
              <table className="assessments-history-table">
                <thead>
                  <tr>
                    <th>{t('profile.thDate', 'Date')}</th>
                    <th>{t('profile.thReportId', 'Report ID')}</th>
                    <th>{t('profile.thCancerTiers', 'Cancer Type & Risk Tiers')}</th>
                    <th>{t('profile.thOverallTier', 'Overall Risk Tier')}</th>
                    <th style={{ textAlign: 'right' }}>{t('profile.thActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAssessments.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ClockIcon size={14} color="#64748B" />
                          <strong>{record.date}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#2563EB', fontWeight: 700 }}>
                          {record.id}
                        </span>
                      </td>
                      <td>
                        <div className="history-cancer-badges-row">
                          {record.cancerAssessments.map((ca) => (
                            <span key={ca.cancerType} className={`cancer-tier-chip ${getTierClass(ca.riskTier)}`}>
                              <span>{ca.displayName}:</span>
                              <strong>{formatTierLabel(ca.riskTier)}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`cancer-tier-chip ${getTierClass(record.overallRiskTier)}`} style={{ fontWeight: 800 }}>
                          {record.overallRiskTier}
                          {typeof record.overallScore === 'number' ? ` (${record.overallScore}%)` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          onClick={() => onNavigate('assessment-results')}
                        >
                          {t('profile.viewResultBtn', 'View Result')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="profile" onNavigate={onNavigate} />
    </div>
  );
};

export default ProfilePage;
