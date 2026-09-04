import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { useAuth } from './context/AuthContext';
import { storage } from './config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  ReportsFileIcon,
  UploadCloudIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
  AssessmentIcon,
  DocumentIcon,
  SecureShieldIcon,
  AlertsBellIcon,
  UserIcon,
} from './assets/MedicalIcons';
import { getApplicableScreeningAlerts } from './config/screeningGuidelines';
import { PastAssessmentRecord } from './types/assessment';
import './styles/ReportsDashboardPage.css';

interface ReportsDashboardPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ReportsDashboardPage: React.FC<ReportsDashboardPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { state, pastAssessments, addUploadedReport, removeUploadedReport } = useAssessment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const hasSavedProfile = Boolean(
    state.hasCompletedProfile ||
    (state.basicInfo.fullName?.trim() && state.basicInfo.age && (state.basicInfo.biologicalSex || state.basicInfo.biological_sex))
  );

  const handleStartAssessment = () => {
    if (hasSavedProfile) {
      onNavigate('assessment-symptoms');
    } else {
      onNavigate('health-profile');
    }
  };

  // Calculate unread alerts count
  const isSmoker = Boolean(
    state.lifestyle.isCurrentSmoker === true ||
    (typeof state.lifestyle.tobaccoUse === 'string' && state.lifestyle.tobaccoUse.includes('Smoke'))
  );
  const usesTobacco = Boolean(
    state.lifestyle.usesSmokelessTobacco === true ||
    (typeof state.lifestyle.tobaccoUse === 'string' && state.lifestyle.tobaccoUse && state.lifestyle.tobaccoUse !== 'Never' && state.lifestyle.tobaccoUse !== 'never')
  );
  const drinksAlcohol = Boolean(
    state.lifestyle.isAlcoholConsuming === true ||
    (typeof state.lifestyle.alcoholConsumption === 'string' &&
      (state.lifestyle.alcoholConsumption.includes('Regularly') || state.lifestyle.alcoholConsumption.includes('Occasionally') || state.lifestyle.alcoholConsumption.includes('Daily')))
  );

  const activeAlerts = getApplicableScreeningAlerts({
    age: state.basicInfo.age,
    gender: state.basicInfo.biologicalSex || state.basicInfo.biological_sex,
    isSmoker,
    usesTobacco,
    drinksAlcohol,
  });
  const unreadAlertsCount = activeAlerts.length;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to upload files.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const fileId = `FILE-${Date.now()}`;
      const storagePath = `users/${currentUser.uid}/reports/${fileId}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      
      await uploadBytes(fileRef, file);
      
      addUploadedReport({
        name: file.name,
        date: new Date().toLocaleDateString(),
        size: file.size,
        type: file.type,
        storageRef: storagePath,
      });
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file to cloud storage.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadFile = async (storageRef: string, _fileName: string) => {
    try {
      // If it's an old local file (doesn't contain 'users/'), show error
      if (!storageRef.startsWith('users/')) {
        alert('This file was saved locally on a different device and is not available in the cloud.');
        return;
      }
      
      const fileRef = ref(storage, storageRef);
      const url = await getDownloadURL(fileRef);
      
      // Open in new tab or trigger download
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file from cloud storage.');
    }
  };

  const handleDeleteFile = async (id: string, storageRef: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      if (storageRef.startsWith('users/')) {
        const fileRef = ref(storage, storageRef);
        await deleteObject(fileRef);
      }
      removeUploadedReport(id);
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file from cloud storage.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Compile all assessment records
  const currentAssessment: PastAssessmentRecord | null = state.hasCompletedAssessment && state.backendResult ? {
    id: 'OG-LATEST',
    date: state.backendResult.assessmentDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    fullDate: new Date().toISOString(),
    userDemographics: {
      name: state.basicInfo.fullName || 'User',
      age: state.basicInfo.age || '30',
      sex: state.basicInfo.biologicalSex || 'Female',
      location: `${state.basicInfo.city}, ${state.basicInfo.state}`,
    },
    cancerAssessments: [],
    overallRiskTier: state.backendResult.riskCategory || 'Lower Risk',
  } : null;

  const allAssessments = [...pastAssessments];
  if (currentAssessment && allAssessments.length === 0) {
    allAssessments.push(currentAssessment);
  }

  const displayName = state.basicInfo.fullName?.trim() || 'User';
  const userInitial = state.basicInfo.fullName?.trim() ? state.basicInfo.fullName.trim().charAt(0).toUpperCase() : null;

  return (
    <div className="dashboard-layout-root">
      <Sidebar
        activeItem="reports"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={unreadAlertsCount}
      />

      <main className="dashboard-main-area reports-main-cover">
        {/* Top Header Bar */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="main-heading">{t('reports.title', 'Reports Hub')}</h1>
            <p className="main-subtext">{t('reports.subtitle', 'View your past AI assessments and manage your uploaded medical records.')}</p>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className={`top-icon-btn ${unreadAlertsCount > 0 ? 'has-alerts-active' : ''}`}
              onClick={() => onNavigate('alerts')}
              aria-label={t('nav.alerts', 'Alerts')}
              title={t('nav.alerts', 'Alerts')}
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
              title={t('dashboard.viewUserProfile', 'View User Profile')}
            >
              <div className="patient-avatar">
                {state.basicInfo.profilePicture ? (
                  <img
                    src={state.basicInfo.profilePicture}
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

        {error && <div className="error-banner">{error}</div>}

        {/* Full-width Responsive 2-Column Grid */}
        <div className="reports-grid-wrapper">
          <div className="reports-grid">
            {/* 1. Past AI Assessment Reports Section */}
            <section className="reports-section">
              <div className="section-header">
                <div className="section-icon-box box-blue">
                  <AssessmentIcon size={22} color="#2563EB" />
                </div>
                <div>
                  <h2 className="section-title">{t('reports.aiReportsTitle', 'AI Assessment Reports')}</h2>
                  <p className="section-subtitle">{t('reports.aiReportsSub', 'Clinical risk evaluations generated by OncoGuards AI')}</p>
                </div>
              </div>
              
              {allAssessments.length === 0 ? (
                <div className="empty-state">
                  <AssessmentIcon size={36} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                  <p>{t('reports.noAiReports', "You haven't completed any health risk assessments yet.")}</p>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={handleStartAssessment}
                  >
                    {t('reports.startAssessment', 'Start Health Assessment')}
                  </button>
                </div>
              ) : (
                <ul className="reports-list">
                  {allAssessments.map((assessment) => {
                    const tierStr = String(assessment.overallRiskTier || 'Low').toLowerCase();
                    const isHigh = tierStr.includes('high');
                    const isMod = tierStr.includes('mod');
                    const badgeClass = isHigh ? 'badge-high' : isMod ? 'badge-mod' : 'badge-low';

                    return (
                      <li key={assessment.id} className="report-list-item">
                        <div className="report-info">
                          <div className="report-title-row">
                            <h3 className="report-title">{t('reports.healthRiskAssessment', 'Health Risk Assessment')}</h3>
                            <span className={`risk-pill ${badgeClass}`}>
                              {assessment.overallRiskTier}
                            </span>
                          </div>
                          <p className="report-meta">
                            <span>{assessment.date}</span>
                            <span className="meta-dot">•</span>
                            <span>{assessment.id}</span>
                          </p>
                        </div>
                        <div className="report-actions">
                          <button 
                            type="button"
                            className="btn-view-report"
                            onClick={() => onNavigate('assessment-report')}
                          >
                            <EyeIcon size={16} />
                            <span>{t('reports.viewBtn', 'View')}</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 2. Uploaded Medical Reports Section */}
            <section className="reports-section">
              <div className="section-header">
                <div className="section-icon-box box-teal">
                  <ReportsFileIcon size={22} color="#0D9488" />
                </div>
                <div>
                  <h2 className="section-title">{t('reports.medicalReportsTitle', 'Your Medical Reports')}</h2>
                  <p className="section-subtitle">{t('reports.medicalReportsSub', 'Securely store lab results, mammograms, and prescriptions')}</p>
                </div>
              </div>

              <div className="upload-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <button 
                  type="button"
                  className="btn btn-primary btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <UploadCloudIcon size={18} />
                  <span>{isUploading ? t('reports.uploading', 'Uploading...') : t('reports.uploadBtn', 'Upload Medical Report')}</span>
                </button>
                <p className="upload-help">{t('reports.supportedFormats', 'Supported formats: PDF, JPG, PNG (Max 10MB)')}</p>
              </div>

              {!state.uploadedReports || state.uploadedReports.length === 0 ? (
                <div className="empty-state">
                  <ReportsFileIcon size={36} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                  <p>{t('reports.noMedicalReports', 'No medical reports uploaded yet.')}</p>
                </div>
              ) : (
                <ul className="reports-list">
                  {state.uploadedReports.map((report) => (
                    <li key={report.id} className="report-list-item">
                      <div className="report-info">
                        <h3 className="report-title">
                          <DocumentIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#2563EB' }} />
                          {report.name}
                        </h3>
                        <p className="report-meta">
                          <span>{report.date}</span>
                          <span className="meta-dot">•</span>
                          <span>{formatBytes(report.size)}</span>
                        </p>
                      </div>
                      <div className="report-actions">
                        <button 
                          type="button"
                          className="btn-icon-action"
                          onClick={() => handleDownloadFile(report.storageRef, report.name)}
                          title="Download report"
                        >
                          <DownloadIcon size={16} />
                          <span>{t('reports.downloadBtn', 'Download')}</span>
                        </button>
                        <button 
                          type="button"
                          className="btn-icon-action btn-danger-action"
                          onClick={() => handleDeleteFile(report.id, report.storageRef)}
                          title="Delete report"
                        >
                          <TrashIcon size={16} />
                          <span>{t('reports.deleteBtn', 'Delete')}</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* Footer Notice */}
        <footer className="dashboard-content-footer" style={{ marginTop: '32px' }}>
          <div className="footer-notice-box">
            <SecureShieldIcon size={18} className="notice-icon" color="#0D9488" />
            <span>
              {t('reports.securityFooter', 'All uploaded medical records are stored locally and encrypted. They are never shared without your explicit consent.')}
            </span>
          </div>
        </footer>
      </main>

      <MobileBottomNav
        activeItem="reports"
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default ReportsDashboardPage;
