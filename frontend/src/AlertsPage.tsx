import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { HealthAwareness } from './components/HealthAwareness';
import {
  AlertsBellIcon,
  SecureShieldIcon,
  ClockIcon,
  MedicalShieldIcon,
  UserIcon,
} from './assets/MedicalIcons';
import {
  getApplicableScreeningAlerts,
  CLINICAL_DISCLAIMER,
} from './config/screeningGuidelines';
import './styles/AlertsPage.css';

interface AlertsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, pastAssessments } = useAssessment();
  const { basicInfo, lifestyle } = assessmentState;

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  // Determine if at least one completed assessment exists (same logic as DashboardPage)
  const latestAssessment = pastAssessments && pastAssessments.length > 0 ? pastAssessments[0] : null;
  const hasCompletedAssessment = Boolean(
    latestAssessment || (assessmentState.hasCompletedAssessment && assessmentState.backendResult)
  );

  // Authoritative risk level computation (100% synchronized with Dashboard)
  const getOverallRiskLevel = (): 'LOWER' | 'MODERATE' | 'HIGHER' | null => {
    if (!hasCompletedAssessment) return null;

    const result = latestAssessment?.backendResult || assessmentState.backendResult;
    if (!result) return null;

    const tiers: string[] = [];
    const keys = ['lung', 'breast', 'oral', 'cervical'];
    keys.forEach((k) => {
      const card = (result as any)[k];
      if (card && card.overall_tier && card.overall_tier !== 'not_applicable') {
        tiers.push(String(card.overall_tier).toLowerCase());
      }
    });

    if (tiers.some((tier) => tier.includes('high'))) return 'HIGHER';
    if (tiers.some((tier) => tier.includes('med') || tier.includes('mod'))) return 'MODERATE';
    if (tiers.length > 0) return 'LOWER';

    // Legacy fallback check
    const legacyTier = String(result.riskCategory || latestAssessment?.overallRiskTier || '').toLowerCase();
    if (legacyTier.includes('high')) return 'HIGHER';
    if (legacyTier.includes('med') || legacyTier.includes('mod')) return 'MODERATE';
    if (legacyTier.includes('low')) return 'LOWER';

    return 'LOWER';
  };

  const currentRiskLevel = getOverallRiskLevel();

  // Determine lifestyle flags
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

  // Calculate unread count (routine alerts + 1 if latest assessment is HIGHER risk)
  const unreadAlertsCount = activeAlerts.length + (currentRiskLevel === 'HIGHER' ? 1 : 0);
  const displayName = basicInfo.fullName?.trim() || 'User';
  const userInitial = basicInfo.fullName?.trim() ? basicInfo.fullName.trim().charAt(0).toUpperCase() : null;

  const getCancerBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breast':
        return 'badge-breast';
      case 'cervical':
        return 'badge-cervical';
      case 'lung':
        return 'badge-lung';
      case 'oral':
        return 'badge-oral';
      default:
        return 'badge-general';
    }
  };

  return (
    <div className="dashboard-layout-root">
      <Sidebar
        activeItem="alerts"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={unreadAlertsCount}
      />

      <main className="dashboard-main-area alerts-main-area">
        {/* Top Header Bar */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <div className="alerts-title-row">
              <h1 className="main-heading">{t('alerts.title', 'Clinical Screening Alerts')}</h1>
              {unreadAlertsCount > 0 ? (
                <span className="alerts-count-badge-active">
                  {unreadAlertsCount} {t('alerts.actionsRec', 'Actions Recommended')}
                </span>
              ) : (
                <span className="alerts-count-badge-clear">{t('alerts.allUpToDate', 'All Up to Date')}</span>
              )}
            </div>
            <p className="main-subtext">
              {t('alerts.subtitle', 'Personalized cancer screening reminders tailored to your age, biological sex, and lifestyle profile.')}
            </p>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className={`top-icon-btn ${unreadAlertsCount > 0 ? 'has-alerts-active' : ''}`}
              onClick={() => onNavigate('alerts')}
              aria-label="View Alerts"
              title="Active Alerts"
            >
              <AlertsBellIcon size={20} color={unreadAlertsCount > 0 ? '#DC2626' : '#475569'} />
              {unreadAlertsCount > 0 && (
                <span className="top-icon-badge-num">{unreadAlertsCount}</span>
              )}
            </button>

            <div
              className="patient-user-pill"
              onClick={() => onNavigate('profile')}
              role="button"
              tabIndex={0}
              title="View User Profile"
            >
              <div className="patient-avatar">
                {basicInfo.profilePicture ? (
                  <img
                    src={basicInfo.profilePicture}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : userInitial ? (
                  <span>{userInitial}</span>
                ) : (
                  <UserIcon size={14} color="#FFFFFF" />
                )}
              </div>
              <span className="patient-name">{displayName}</span>
              <span className="patient-chevron">⌄</span>
            </div>
          </div>
        </header>

        {/* Clinical Disclaimer Banner */}
        <div className="alerts-disclaimer-banner" role="note">
          <div className="disclaimer-icon-box">
            <SecureShieldIcon size={18} color="#0D9488" />
          </div>
          <p className="disclaimer-text">
            <strong>{t('dashboard.clinicalDisclaimerTitle', 'Clinical Disclaimer')}:</strong> {t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}
          </p>
        </div>

        {/* Alerts Content Feed */}
        <div className="alerts-feed-container">
          {/* 1. LATEST COMPLETED ASSESSMENT RISK ALERT (If exists) */}
          {hasCompletedAssessment && currentRiskLevel === 'HIGHER' && (
            <article className="screening-alert-card risk-alert-card risk-alert-higher" role="alert">
              <div className="alert-card-header">
                <div className="alert-card-left">
                  <div className="alert-bell-indicator risk-indicator-higher">
                    <AlertsBellIcon size={22} color="#DC2626" />
                  </div>
                  <div>
                    <div className="alert-badge-group">
                      <span className="risk-assessment-badge risk-assessment-badge-higher">
                        {t('alerts.riskAssessmentAlert', 'Risk Assessment Alert')}
                      </span>
                      <span className="risk-tier-badge-pill risk-tier-higher">
                        {t('common.riskHigher', 'HIGHER')}
                      </span>
                    </div>
                    <h2 className="alert-card-title">{t('alerts.higherRiskTitle', 'Risk Assessment Alert')}</h2>
                  </div>
                </div>
              </div>

              <div className="alert-card-body">
                <p className="alert-recommendation-text risk-recommendation-higher">
                  {t(
                    'alerts.higherRiskMsg',
                    'Your latest assessment indicates a HIGHER risk category. Please review your personalized screening guidance and consider discussing the result with a qualified healthcare professional.'
                  )}
                </p>
              </div>

              <div className="alert-card-footer">
                <div className="alert-evidence-note">
                  <ClockIcon size={14} color="#DC2626" />
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                    {t('alerts.routineCareNote', 'Recommended as part of routine evidence-based preventive care.')}
                  </span>
                </div>

                <div className="alert-btn-row">
                  <button
                    type="button"
                    className="btn-view-guideline"
                    onClick={() => onNavigate('reports')}
                  >
                    {t('alerts.viewAssessmentResults', 'View Detailed Results')}
                  </button>
                  <button
                    type="button"
                    className="btn-schedule-action"
                    onClick={() => onNavigate('health-profile')}
                  >
                    {t('detailedReport.updateProfile', 'Update Assessment')}
                  </button>
                </div>
              </div>
            </article>
          )}

          {hasCompletedAssessment && currentRiskLevel === 'MODERATE' && (
            <article className="screening-alert-card risk-alert-card risk-alert-moderate">
              <div className="alert-card-header">
                <div className="alert-card-left">
                  <div className="alert-bell-indicator risk-indicator-moderate">
                    <AlertsBellIcon size={22} color="#D97706" />
                  </div>
                  <div>
                    <div className="alert-badge-group">
                      <span className="risk-assessment-badge risk-assessment-badge-moderate">
                        {t('alerts.riskAssessmentNotice', 'Risk Assessment Notice')}
                      </span>
                      <span className="risk-tier-badge-pill risk-tier-moderate">
                        {t('common.riskModerate', 'MODERATE')}
                      </span>
                    </div>
                    <h2 className="alert-card-title">{t('alerts.moderateRiskTitle', 'Risk Assessment Notice')}</h2>
                  </div>
                </div>
              </div>

              <div className="alert-card-body">
                <p className="alert-recommendation-text risk-recommendation-moderate">
                  {t(
                    'alerts.moderateRiskMsg',
                    'Your latest assessment indicates a MODERATE risk category. Continue preventive habits and review recommended screening timelines.'
                  )}
                </p>
              </div>

              <div className="alert-card-footer">
                <div className="alert-evidence-note">
                  <ClockIcon size={14} color="#64748B" />
                  <span>{t('alerts.routineCareNote', 'Recommended as part of routine evidence-based preventive care.')}</span>
                </div>

                <div className="alert-btn-row">
                  <button
                    type="button"
                    className="btn-view-guideline"
                    onClick={() => onNavigate('reports')}
                  >
                    {t('alerts.viewAssessmentResults', 'View Detailed Results')}
                  </button>
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => onNavigate('health-profile')}
                  >
                    {t('detailedReport.updateProfile', 'Update Assessment')}
                  </button>
                </div>
              </div>
            </article>
          )}

          {hasCompletedAssessment && currentRiskLevel === 'LOWER' && (
            <article className="screening-alert-card risk-alert-card risk-alert-lower">
              <div className="alert-card-header">
                <div className="alert-card-left">
                  <div className="alert-bell-indicator risk-indicator-lower">
                    <MedicalShieldIcon size={22} color="#0D9488" />
                  </div>
                  <div>
                    <div className="alert-badge-group">
                      <span className="risk-assessment-badge risk-assessment-badge-lower">
                        {t('alerts.riskAssessmentStatus', 'Risk Assessment Status')}
                      </span>
                      <span className="risk-tier-badge-pill risk-tier-lower">
                        {t('common.riskLower', 'LOWER')}
                      </span>
                    </div>
                    <h2 className="alert-card-title">{t('alerts.lowerRiskTitle', 'Risk Assessment Status')}</h2>
                  </div>
                </div>
              </div>

              <div className="alert-card-body">
                <p className="alert-recommendation-text risk-recommendation-lower">
                  {t(
                    'alerts.lowerRiskMsg',
                    'Your latest assessment indicates a LOWER risk category. Continue maintaining healthy lifestyle habits and stay up to date with routine wellness checks.'
                  )}
                </p>
              </div>

              <div className="alert-card-footer">
                <div className="alert-evidence-note">
                  <ClockIcon size={14} color="#64748B" />
                  <span>{t('alerts.routineCareNote', 'Recommended as part of routine evidence-based preventive care.')}</span>
                </div>

                <div className="alert-btn-row">
                  <button
                    type="button"
                    className="btn-view-guideline"
                    onClick={() => onNavigate('reports')}
                  >
                    {t('alerts.viewAssessmentResults', 'View Detailed Results')}
                  </button>
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => onNavigate('health-profile')}
                  >
                    {t('detailedReport.updateProfile', 'Update Assessment')}
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* 2. NO ASSESSMENT & NO ACTIVE ROUTINE ALERTS EMPTY STATE */}
          {!hasCompletedAssessment && activeAlerts.length === 0 && (
            <div className="alerts-empty-state-card">
              <div className="empty-icon-circle">
                <MedicalShieldIcon size={38} color="#10B981" />
              </div>
              <h2 className="empty-state-title">{t('alerts.emptyTitle', 'No Pending Screening Alerts')}</h2>
              <p className="empty-state-text">
                {t('alerts.emptyText', 'Based on your current age, biological sex, and logged habits, there are no immediate routine cancer screening protocols flagged as overdue.')}
              </p>
              <div className="empty-state-actions">
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => onNavigate('assessment-symptoms')}
                >
                  {t('dashboard.startAssessment', 'Start a New Assessment')}
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => onNavigate('health-profile')}
                >
                  {t('alerts.reviewHealthProfile', 'Review Assessment')}
                </button>
              </div>
            </div>
          )}

          {/* 3. ACTIVE ROUTINE SCREENING ALERTS (if any) */}
          {activeAlerts.length > 0 && (
            <div className="alerts-cards-list" style={{ marginTop: hasCompletedAssessment ? 20 : 0 }}>
              {activeAlerts.map((alert) => {
                const cancerKey = alert.cancerType.toLowerCase() as 'breast' | 'cervical' | 'lung' | 'oral';
                const cancerDisplayName = t(alert.cancerTypeKey || `screening.${cancerKey}.displayName`, `${alert.cancerType} Cancer`);
                const guidelineSource = t(alert.guidelineSourceKey || `screening.${cancerKey}.guidelineSource`, alert.guidelineSource);
                const alertTitle = t(alert.titleKey || `screening.${cancerKey}.alertTitle`, alert.title);
                const recommendation = t(alert.recommendationKey || `screening.${cancerKey}.baselineRecommendation`, alert.recommendation);

                return (
                  <article key={alert.id} className="screening-alert-card">
                    <div className="alert-card-header">
                      <div className="alert-card-left">
                        <div className="alert-bell-indicator">
                          <AlertsBellIcon size={20} color="#DC2626" />
                        </div>
                        <div>
                          <div className="alert-badge-group">
                            <span className={`cancer-type-badge ${getCancerBadgeClass(alert.cancerType)}`}>
                              {cancerDisplayName}
                            </span>
                            <span className="guideline-source-badge">
                              {guidelineSource}
                            </span>
                          </div>
                          <h2 className="alert-card-title">{alertTitle}</h2>
                        </div>
                      </div>
                    </div>

                    <div className="alert-card-body">
                      <p className="alert-recommendation-text">{recommendation}</p>
                    </div>

                    <div className="alert-card-footer">
                      <div className="alert-evidence-note">
                        <ClockIcon size={14} color="#64748B" />
                        <span>{t('alerts.routineCareNote', 'Recommended as part of routine evidence-based preventive care.')}</span>
                      </div>

                      <div className="alert-btn-row">
                        <button
                          type="button"
                          className="btn-view-guideline"
                          onClick={() => onNavigate('health-awareness')}
                        >
                          {t('alerts.readFullGuidelines', 'Read Full Guidelines')}
                        </button>
                        <button
                          type="button"
                          className="btn-schedule-action"
                          onClick={() => onNavigate('health-profile')}
                        >
                          {t('detailedReport.updateProfile', 'Update Assessment')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. AWARENESS & PREVENTION CONTENT SECTION */}
        <section className="alerts-awareness-section" aria-label="Cancer Awareness Guidance">
          <HealthAwareness hideHeader={true} onNavigateToDashboard={() => onNavigate('dashboard')} />
        </section>

        {/* 5. GLOBAL EVIDENCE REFERENCE FOOTER */}
        <footer className="alerts-evidence-footer">
          <div className="evidence-footer-box">
            <h3 className="evidence-footer-title">{t('alerts.authoritiesTitle', 'Screening Authority References')}</h3>
            <p className="evidence-footer-text">
              {t('alerts.authoritiesText', 'Screening protocols are aligned with guidelines from the World Health Organization (WHO), the Indian Council of Medical Research (ICMR-NICPR), the National Cancer Grid (NCG India), and the U.S. Preventive Services Task Force (USPSTF).')}
            </p>
          </div>
        </footer>
      </main>

      <MobileBottomNav
        activeItem="alerts"
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default AlertsPage;
