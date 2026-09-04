import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import {
  SymptomsIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from './assets/MedicalIcons';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import './styles/DashboardPage.css';

interface DailySymptomHistoryPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const DailySymptomHistoryPage: React.FC<DailySymptomHistoryPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { pastAssessments } = useAssessment();

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const hasHistory = pastAssessments && pastAssessments.length > 0;

  return (
    <div className="dashboard-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="symptoms"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <div className="breadcrumb-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.85rem', color: '#64748B' }}>
              <button
                type="button"
                className="breadcrumb-link"
                style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                onClick={() => onNavigate('dashboard')}
              >
                {t('nav.dashboard', 'Dashboard')}
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current" style={{ color: '#0F172A', fontWeight: 600 }}>Daily Symptom History</span>
            </div>
            <h1 className="main-heading">Daily Symptom History</h1>
            <p className="main-subtext">
              Review physical signs, symptoms, and durations recorded across your completed clinical assessments.
            </p>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className="btn btn-primary"
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={() => onNavigate('health-profile')}
            >
              <span>+ Log New Assessment</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content-flow" style={{ maxWidth: '960px' }}>
          {!hasHistory ? (
            <div
              className="dashboard-panel"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <SymptomsIcon size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                No symptoms recorded yet.
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', maxWidth: '420px', lineHeight: 1.5, marginBottom: '24px' }}>
                Your recorded symptoms will appear here over time as you complete periodic clinical assessments.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
                onClick={() => onNavigate('health-profile')}
              >
                Start Day 1 Assessment →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pastAssessments.map((record, index) => {
                const totalCount = pastAssessments.length;
                const dayNumber = totalCount - index; // Oldest is Day 1
                const dayLabel = dayNumber === 1 ? 'Day 1' : `Day ${dayNumber}`;
                const isToday = index === 0;
                const tier = (record.overallRiskTier || 'LOWER').toUpperCase();

                const tierClass =
                  tier.includes('HIGH')
                    ? 'tier-higher'
                    : tier.includes('MED') || tier.includes('MOD')
                    ? 'tier-moderate'
                    : 'tier-lower';

                const symptomsList = record.recordedSymptoms || [];

                return (
                  <div
                    key={record.id || index}
                    className="dashboard-panel"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #E2E8F0',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '14px',
                        borderBottom: '1px solid #F1F5F9',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#1E3A8A',
                            backgroundColor: '#DBEAFE',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {dayLabel}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                          {record.fullDate || record.date}
                        </span>
                        {isToday && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#ECFDF5',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #A7F3D0',
                            }}
                          >
                            Latest
                          </span>
                        )}
                      </div>

                      <span className={`risk-tier-pill pill-sm ${tierClass}`}>
                        {tier.includes('HIGH') ? 'HIGHER' : tier.includes('MED') || tier.includes('MOD') ? 'MODERATE' : 'LOWER'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Recorded Symptoms & Physical Signs:
                      </h4>

                      {symptomsList.length === 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#F8FAFC',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            color: '#64748B',
                          }}
                        >
                          <CheckCircleIcon size={16} color="#059669" />
                          <span>No acute cancer warning signs or symptoms reported during this assessment.</span>
                        </div>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {symptomsList.map((symptom, sIdx) => (
                            <li
                              key={symptom.id || sIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                                <span style={{ fontWeight: 600, color: '#1E293B' }}>{symptom.label}</span>
                                {symptom.category && (
                                  <span style={{ fontSize: '0.72rem', color: '#64748B', backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                                    {symptom.category}
                                  </span>
                                )}
                              </div>
                              {symptom.duration && (
                                <span style={{ fontSize: '0.8rem', color: '#0D9488', fontWeight: 600 }}>
                                  Duration: {symptom.duration}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={() => onNavigate('assessment-results')}
                      >
                        View Full Clinical Result →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clinical Disclaimer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#FEFCE8',
              border: '1px solid #FEF08A',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '0.82rem',
              color: '#854D0E',
              lineHeight: 1.5,
              marginTop: '12px',
            }}
            role="note"
          >
            <AlertCircleIcon size={20} color="#854D0E" />
            <span>{t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}</span>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeItem="symptoms" onNavigate={onNavigate} />
    </div>
  );
};

export default DailySymptomHistoryPage;
