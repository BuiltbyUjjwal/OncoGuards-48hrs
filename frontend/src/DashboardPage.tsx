import React from 'react';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { useTranslation } from 'react-i18next';
import {
  ClockIcon,
  SparkleStarIcon,
  MedicalShieldIcon,
  UserIcon,
  CheckCircleIcon,
  HealthPulseIcon,
} from './assets/MedicalIcons';
import './styles/DashboardPage.css';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, pastAssessments } = useAssessment();
  const { basicInfo } = assessmentState;

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const displayName = basicInfo.fullName?.trim() || 'Patient';
  const userInitial = basicInfo.fullName?.trim() ? basicInfo.fullName.trim().charAt(0).toUpperCase() : null;

  // Determine if at least one completed assessment exists
  const latestAssessment = pastAssessments && pastAssessments.length > 0 ? pastAssessments[0] : null;
  const hasCompletedAssessment = Boolean(
    latestAssessment || (assessmentState.hasCompletedAssessment && assessmentState.backendResult)
  );

  // 1. CARD 1: Current Risk Level (LOWER / MODERATE / HIGHER only, no fake scores or percentages)
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

  // 2. CARD 2: Last Assessment ("Day 1" + actual completion date if first, or latest date)
  const getLastAssessmentDetails = () => {
    if (!hasCompletedAssessment) return null;

    // The total count of completed assessments
    const totalCount = Math.max(pastAssessments?.length || 0, 1);
    const isFirstAssessment = totalCount === 1;

    const dateDisplay =
      latestAssessment?.date ||
      latestAssessment?.fullDate ||
      (assessmentState.backendResult?.assessmentDate
        ? new Date(assessmentState.backendResult.assessmentDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }));

    return {
      dayLabel: isFirstAssessment ? 'Day 1' : `Day ${totalCount}`,
      dateDisplay,
      isFirst: isFirstAssessment,
    };
  };

  const lastAssessmentInfo = getLastAssessmentDetails();

  // 3. CARD 3: Next Recommendation (Extracted authentically from latest assessment result)
  const getNextRecommendation = (): string => {
    if (!hasCompletedAssessment) {
      return 'Complete your first assessment to receive personalized recommendations.';
    }

    const result = latestAssessment?.backendResult || assessmentState.backendResult;
    if (!result) {
      return 'Maintain routine preventive screening & healthy lifestyle habits.';
    }

    // Pick recommendation from the most severe cancer finding
    const cancerOrder = ['lung', 'breast', 'oral', 'cervical'];
    let topRecommendation = '';
    let topTierRank = -1;

    cancerOrder.forEach((k) => {
      const card = (result as any)[k];
      if (card && card.overall_tier && card.overall_tier !== 'not_applicable') {
        const tier = String(card.overall_tier).toLowerCase();
        const rank = tier.includes('high') ? 3 : tier.includes('med') || tier.includes('mod') ? 2 : 1;

        if (rank > topTierRank) {
          if (card.layer3?.recommended_actions && card.layer3.recommended_actions.length > 0) {
            topRecommendation = card.layer3.recommended_actions[0];
            topTierRank = rank;
          } else if (card.layer3?.guidance_text) {
            const firstSentence = card.layer3.guidance_text.split('.')[0];
            if (firstSentence && firstSentence.trim()) {
              topRecommendation = firstSentence.trim() + '.';
              topTierRank = rank;
            }
          }
        }
      }
    });

    if (topRecommendation) return topRecommendation;

    // Fallback to cancer assessments list
    if (latestAssessment?.cancerAssessments && latestAssessment.cancerAssessments.length > 0) {
      const firstCancer = latestAssessment.cancerAssessments[0] as any;
      const fallbackRec =
        firstCancer.recommendations?.[0] ||
        firstCancer.guidelineRecommendation;
      if (fallbackRec) return fallbackRec;
    }

    return 'Maintain routine preventive screening & regular physician consultations.';
  };

  const nextRecommendation = getNextRecommendation();

  // 4. AI HEALTH INSIGHT
  const getAiHealthInsight = (): string => {
    if (!hasCompletedAssessment) {
      return 'Complete your first assessment to receive personalized health insights.';
    }

    const result = latestAssessment?.backendResult || assessmentState.backendResult;
    if (result) {
      // Find highest risk cancer guidance
      for (const k of ['lung', 'breast', 'oral', 'cervical']) {
        const card = (result as any)[k];
        if (card && card.overall_tier !== 'not_applicable' && card.layer3?.guidance_text) {
          return card.layer3.guidance_text;
        }
      }
      if (result.explanation) return result.explanation;
    }

    return 'Your latest clinical analysis indicates adherence to preventive screening guidelines.';
  };

  const aiInsightText = getAiHealthInsight();

  // 5. HEALTH TIMELINE LIST (Chronological order from oldest to newest)
  const timelineRecords = React.useMemo(() => {
    if (!pastAssessments || pastAssessments.length === 0) {
      if (hasCompletedAssessment && assessmentState.backendResult) {
        return [
          {
            dayNumber: 1,
            label: 'Day 1',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tier: currentRiskLevel || 'LOWER',
            cancers: ['Lung', 'Breast', 'Oral', 'Cervical'],
            id: 'assessment-day-1',
          },
        ];
      }
      return [];
    }

    // Sort pastAssessments chronologically (oldest first to assign Day 1, Day 2, etc.)
    const reversed = [...pastAssessments].reverse();
    return reversed.map((record, index) => {
      const dayNumber = index + 1;
      let tier: 'LOWER' | 'MODERATE' | 'HIGHER' = 'LOWER';
      const rawTier = String(record.overallRiskTier || '').toLowerCase();
      if (rawTier.includes('high')) tier = 'HIGHER';
      else if (rawTier.includes('med') || rawTier.includes('mod')) tier = 'MODERATE';

      const cancers = record.cancerAssessments?.map((c) => c.displayName.replace(' Cancer', '')) || [
        'Lung',
        'Breast',
        'Oral',
        'Cervical',
      ];

      return {
        dayNumber,
        label: `Day ${dayNumber}`,
        date: record.date || record.fullDate || `Assessment ${dayNumber}`,
        tier,
        cancers,
        id: record.id,
      };
    });
  }, [pastAssessments, hasCompletedAssessment, assessmentState.backendResult, currentRiskLevel]);

  return (
    <div className="dashboard-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="dashboard"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Dashboard Area */}
      <main className="dashboard-main-area">
        {/* Top Header Bar: Clean header with user profile pill only (No globe or bell icons) */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="main-heading">
              {t('dashboard.welcomeBack', 'Welcome back')}, {displayName}!
            </h1>
            <p className="main-subtext">
              {t('dashboard.overviewSubtext', 'Overview of your health profile. Stay informed. Stay ahead.')}
            </p>
          </div>

          <div className="top-bar-right">
            <div
              className="patient-user-pill"
              onClick={() => onNavigate('profile')}
              role="button"
              tabIndex={0}
              title={t('dashboard.viewPatientProfile', 'View Patient Profile')}
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

        <div className="dashboard-content-flow">
          {/* SECTION 1: TOP 3 SUMMARY CARDS */}
          <section className="summary-cards-grid" aria-label="Key Health Indicators">
            {/* CARD 1: Current Risk Level */}
            <div className="summary-metric-card card-risk-level">
              <div className="summary-card-header">
                <span className="summary-card-label">Current Risk Level</span>
                <div className={`metric-icon-badge ${currentRiskLevel ? `badge-${currentRiskLevel.toLowerCase()}` : 'badge-neutral'}`}>
                  <MedicalShieldIcon size={18} />
                </div>
              </div>
              <div className="summary-card-body">
                {currentRiskLevel ? (
                  <div className="risk-level-display">
                    <span className={`risk-tier-pill tier-${currentRiskLevel.toLowerCase()}`}>
                      {currentRiskLevel}
                    </span>
                    <p className="summary-metric-subtext">Multi-cancer evaluation tier</p>
                  </div>
                ) : (
                  <div className="risk-level-empty">
                    <span className="risk-tier-pill tier-pending">Pending Assessment</span>
                    <p className="summary-metric-subtext">No assessment completed yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: Last Assessment */}
            <div className="summary-metric-card card-last-assessment">
              <div className="summary-card-header">
                <span className="summary-card-label">Last Assessment</span>
                <div className="metric-icon-badge badge-blue">
                  <ClockIcon size={18} />
                </div>
              </div>
              <div className="summary-card-body">
                {lastAssessmentInfo ? (
                  <div className="last-assessment-display">
                    <span className="assessment-day-title">{lastAssessmentInfo.dayLabel}</span>
                    <p className="summary-metric-subtext">{lastAssessmentInfo.dateDisplay}</p>
                  </div>
                ) : (
                  <div className="last-assessment-empty">
                    <span className="assessment-day-title title-muted">—</span>
                    <p className="summary-metric-subtext">No assessments yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: Next Recommendation */}
            <div className="summary-metric-card card-recommendation">
              <div className="summary-card-header">
                <span className="summary-card-label">Next Recommendation</span>
                <div className="metric-icon-badge badge-teal">
                  <CheckCircleIcon size={18} />
                </div>
              </div>
              <div className="summary-card-body">
                <p className="recommendation-text">{nextRecommendation}</p>
                {hasCompletedAssessment && (
                  <span className="recommendation-source-badge">ICMR Evidence Protocol</span>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: PROMINENT START A NEW ASSESSMENT CTA */}
          <section className="dashboard-cta-hero" aria-label="Start Clinical Assessment">
            <div className="cta-hero-left">
              <div className="cta-badge">
                <HealthPulseIcon size={14} />
                <span>CLINICAL SCREENING & ESCALATION</span>
              </div>
              <h2 className="cta-title">Start a New Assessment</h2>
              <p className="cta-description">
                Evaluate multi-factor symptom patterns, duration weighting, and personalized lifestyle indicators across
                Lung, Breast, Oral, and Cervical cancer guidelines.
              </p>
            </div>
            <div className="cta-hero-right">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => onNavigate('health-profile')}
              >
                {hasCompletedAssessment ? 'Start New Assessment' : 'Start Day 1 Assessment'}
                <span className="btn-arrow">→</span>
              </button>
              {hasCompletedAssessment && (
                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={() => onNavigate('assessment-results')}
                >
                  View Latest Results
                </button>
              )}
            </div>
          </section>

          {/* SECTION 3: TWO-COLUMN HEALTH TIMELINE & RISK TREND */}
          <div className="dashboard-two-col-grid">
            {/* COLUMN LEFT: HEALTH TIMELINE */}
            <section className="dashboard-panel health-timeline-panel" aria-label="Health Timeline">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Health Timeline</h3>
                  <p className="panel-subtitle">Longitudinal record of completed screening assessments</p>
                </div>
                {timelineRecords.length > 0 && (
                  <span className="timeline-count-badge">{timelineRecords.length} Recorded</span>
                )}
              </div>

              <div className="timeline-content-area">
                {timelineRecords.length === 0 ? (
                  <div className="timeline-empty-state">
                    <div className="empty-icon-box">
                      <ClockIcon size={28} />
                    </div>
                    <h4 className="empty-state-title">No assessment completed yet</h4>
                    <p className="empty-state-desc">
                      Your longitudinal health timeline will record each completed assessment here starting from Day 1.
                    </p>
                    <button
                      type="button"
                      className="btn-timeline-start"
                      onClick={() => onNavigate('health-profile')}
                    >
                      Start Assessment
                    </button>
                  </div>
                ) : (
                  <div className="timeline-items-list">
                    {timelineRecords.map((item, index) => (
                      <div key={item.id || index} className="timeline-record-item">
                        <div className="timeline-marker-col">
                          <div className={`timeline-dot dot-${item.tier.toLowerCase()}`} />
                          {index < timelineRecords.length - 1 && <div className="timeline-line" />}
                        </div>
                        <div className="timeline-record-card">
                          <div className="timeline-record-header">
                            <div className="timeline-day-tag-group">
                              <span className="timeline-day-badge">{item.label}</span>
                              <span className="timeline-date-text">{item.date}</span>
                            </div>
                            <span className={`risk-tier-pill pill-sm tier-${item.tier.toLowerCase()}`}>
                              {item.tier}
                            </span>
                          </div>
                          <p className="timeline-screened-text">
                            Screened: {item.cancers.join(', ')}
                          </p>
                          <div className="timeline-card-actions">
                            <button
                              type="button"
                              className="btn-timeline-action"
                              onClick={() => onNavigate('symptoms')}
                            >
                              View Symptoms →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* COLUMN RIGHT: RISK TREND & AI HEALTH INSIGHT */}
            <div className="dashboard-right-col-stack">
              {/* PANEL: RISK ASSESSMENT TREND */}
              <section className="dashboard-panel risk-trend-panel" aria-label="Risk Assessment Trend">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Risk Assessment Trend</h3>
                    <p className="panel-subtitle">Categorical risk progression across assessments</p>
                  </div>
                </div>

                <div className="trend-content-area">
                  {!hasCompletedAssessment ? (
                    <div className="trend-empty-state">
                      <p className="trend-empty-text">
                        No assessment data available. Complete your first assessment to establish your risk progression.
                      </p>
                    </div>
                  ) : timelineRecords.length === 1 ? (
                    <div className="trend-single-state">
                      <div className="trend-step-item active-step">
                        <div className="step-badge">Day 1</div>
                        <div className={`step-tier-indicator tier-${timelineRecords[0].tier.toLowerCase()}`}>
                          {timelineRecords[0].tier}
                        </div>
                        <span className="step-date">{timelineRecords[0].date}</span>
                      </div>
                      <div className="trend-summary-box">
                        <p className="trend-summary-text">
                          <strong>Baseline Established:</strong> Your initial risk evaluation is recorded as{' '}
                          <span className={`text-tier-${timelineRecords[0].tier.toLowerCase()}`}>
                            {timelineRecords[0].tier}
                          </span>
                          . Future assessments will plot longitudinal risk trajectory here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="trend-multi-state">
                      <div className="trend-steps-track">
                        {timelineRecords.map((rec) => (
                          <div key={rec.id} className="trend-step-node">
                            <span className="step-day-label">{rec.label}</span>
                            <div className={`step-node-bubble bubble-${rec.tier.toLowerCase()}`}>
                              {rec.tier.charAt(0)}
                            </div>
                            <span className={`step-tier-caption tier-${rec.tier.toLowerCase()}`}>
                              {rec.tier}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="trend-footer-note">
                        Categorical trajectory: {timelineRecords[0].tier} →{' '}
                        {timelineRecords[timelineRecords.length - 1].tier}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* PANEL: AI HEALTH INSIGHT */}
              <section className="dashboard-panel ai-insight-panel" aria-label="AI Health Insight">
                <div className="panel-header">
                  <div className="header-with-icon">
                    <div className="insight-sparkle-box">
                      <SparkleStarIcon size={18} />
                    </div>
                    <div>
                      <h3 className="panel-title">AI Health Insight</h3>
                      <p className="panel-subtitle">Grounded clinical guidance</p>
                    </div>
                  </div>
                </div>

                <div className="insight-body">
                  <p className="insight-quote-text">“{aiInsightText}”</p>
                  <div className="insight-footer">
                    <button
                      type="button"
                      className="btn-chat-ai"
                      onClick={() => onNavigate('ai-assistant')}
                    >
                      Ask AI Assistant Questions →
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* SECTION 5: CLINICAL DISCLAIMER BANNER */}
          <footer className="dashboard-content-footer">
            <div className="bottom-clinical-disclaimer-card">
              <div className="bottom-disclaimer-left">
                <div className="bottom-disclaimer-icon-badge">
                  <MedicalShieldIcon size={20} />
                </div>
                <div className="bottom-disclaimer-text-group">
                  <p className="bottom-disclaimer-primary">
                    <strong>OncoGuards</strong> is an AI-assisted early cancer risk escalation and screening
                    recommendation platform.
                  </p>
                  <p className="bottom-disclaimer-secondary">
                    It does not provide a medical diagnosis. All assessments are strictly advisory and must be evaluated
                    by a qualified healthcare professional.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeItem="dashboard" onNavigate={onNavigate} />
    </div>
  );
};

export default DashboardPage;
