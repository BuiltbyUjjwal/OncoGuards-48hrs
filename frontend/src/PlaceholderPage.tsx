import React from 'react';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import {
  SymptomsIcon,
  AssistantBotIcon,
  ReportsFileIcon,
  AlertsBellIcon,
  UserIcon,
  SettingsGearIcon,
  ShieldCrossIcon,
  SecureShieldIcon,
  ClockIcon,
} from './assets/MedicalIcons';
import './styles/DashboardPage.css';

interface PlaceholderPageProps {
  pageKey: SidebarItemKey;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

const pageConfigs: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    actionLabel?: string;
  }
> = {
  symptoms: {
    title: 'Symptoms Tracker',
    subtitle: 'Clinical Symptom Diary & Early Warning Indicator Log',
    description:
      'Record, monitor, and correlate changes in physical symptoms (e.g. persistent fatigue, skin changes, unexplained pain, or digestive changes) over time. Share structured symptom summaries directly with your oncologist.',
    icon: <SymptomsIcon size={32} />,
    actionLabel: 'Log New Symptom Entry',
  },
  'ai-assistant': {
    title: 'OncoGuards AI Assistant',
    subtitle: 'Evidence-Based Oncology Information & Screening Guidance',
    description:
      'Ask health questions, clarify clinical terminology, and explore preventive lifestyle recommendations grounded in NCCN, ASCO, and USPSTF medical literature.',
    icon: <AssistantBotIcon size={32} />,
    actionLabel: 'Start New Conversation',
  },
  reports: {
    title: 'Assessment Reports',
    subtitle: 'Completed Clinical Risk Summaries & Screening Guidance',
    description:
      'View your personalized risk assessments, guideline summaries, and downloadable PDF reports for your primary care physician or oncologist.',
    icon: <ReportsFileIcon size={32} />,
    actionLabel: 'Take New Assessment',
  },
  alerts: {
    title: 'Health Alerts & Reminders',
    subtitle: 'Clinical Screening Notifications & Protocol Updates',
    description:
      'Stay notified about upcoming recommended screening windows, new evidence-based guidelines relevant to your age group, and account security updates.',
    icon: <AlertsBellIcon size={32} />,
    actionLabel: 'Manage Alert Preferences',
  },
  profile: {
    title: 'User Profile',
    subtitle: 'Personal Health Information & Demographics',
    description:
      'Manage your verified contact information, emergency contacts, primary care provider details, and privacy consent preferences.',
    icon: <UserIcon size={32} />,
    actionLabel: 'Edit Profile Information',
  },
  settings: {
    title: 'Account Settings',
    subtitle: 'Security, HIPAA Data Controls & Preferences',
    description:
      'Manage authentication methods, linked Google accounts, notification channels, data export, and account privacy controls.',
    icon: <SettingsGearIcon size={32} />,
    actionLabel: 'Review Security Settings',
  },
};

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  pageKey,
  onNavigate,
  onLogout,
}) => {
  const config = pageConfigs[pageKey] || {
    title: 'Health Dashboard Feature',
    subtitle: 'OncoGuards AI Clinical Platform',
    description: 'This healthcare module is configured and connected to your user portal.',
    icon: <ShieldCrossIcon size={32} />,
  };

  return (
    <div className="dashboard-layout-root">
      {/* Sidebar Navigation */}
      <Sidebar
        activeItem={pageKey}
        onNavigate={(item) => onNavigate(item)}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area">
        {/* Top Header */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="main-heading">{config.title}</h1>
            <p className="main-subtext">{config.subtitle}</p>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        {/* Feature Overview Card */}
        <div className="main-assessment-card" style={{ maxWidth: '880px' }}>
          <div className="main-card-inner">
            <div className="main-card-content">
              <div className="main-card-badge">
                <ShieldCrossIcon size={16} />
                <span>Feature Connected & Ready</span>
              </div>

              <h2 className="main-card-title">{config.title}</h2>
              <p className="main-card-text">{config.description}</p>

              <div className="assessment-points-list">
                <div className="assessment-point-item">
                  <span className="point-icon-box">
                    <SecureShieldIcon size={14} />
                  </span>
                  <span>End-to-End Encrypted</span>
                </div>
                <div className="assessment-point-item">
                  <span className="point-icon-box">
                    <ClockIcon size={14} />
                  </span>
                  <span>Real-time Clinical Insights</span>
                </div>
              </div>

              <div className="main-card-actions" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {config.actionLabel && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (pageKey === 'reports') {
                        onNavigate('risk-assessment');
                      } else {
                        alert(`${config.title} feature action initialized.`);
                      }
                    }}
                  >
                    {config.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('dashboard')}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

            <div className="main-card-visual" aria-hidden="true">
              <div className="visual-icon-ring" style={{ color: 'var(--color-main-blue)' }}>
                {config.icon}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <footer className="dashboard-content-footer">
          <div className="footer-notice-box">
            <SecureShieldIcon size={16} className="notice-icon" />
            <span>
              OncoGuards AI Clinical Platform • HIPAA Protected Data Environment • 256-Bit SSL Encryption
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default PlaceholderPage;
