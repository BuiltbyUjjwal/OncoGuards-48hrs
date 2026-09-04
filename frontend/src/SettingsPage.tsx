import React, { useState, useRef, useEffect } from 'react';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { updateProfile } from 'firebase/auth';
import { auth } from './config/firebase';
import {
  UserIcon,
  SecureShieldIcon,
  AlertsBellIcon,
  AssessmentIcon,
} from './assets/MedicalIcons';
import { getApplicableScreeningAlerts } from './config/screeningGuidelines';
import './styles/SettingsPage.css';

interface SettingsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  onLogout,
  userEmail,
}) => {
  const { state, updateBasicInfo } = useAssessment();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { basicInfo, lifestyle } = state;

  // Form local state
  const [fullName, setFullName] = useState(basicInfo.fullName || '');
  const [email, setEmail] = useState(basicInfo.email || userEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(basicInfo.phoneNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(basicInfo.dateOfBirth || '');
  const [profilePicture, setProfilePicture] = useState<string | undefined>(basicInfo.profilePicture);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile updated successfully');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with context if basicInfo updates
  useEffect(() => {
    if (basicInfo.fullName && !fullName) setFullName(basicInfo.fullName);
    if (basicInfo.email && !email) setEmail(basicInfo.email);
    if (basicInfo.phoneNumber && !phoneNumber) setPhoneNumber(basicInfo.phoneNumber);
    if (basicInfo.dateOfBirth && !dateOfBirth) setDateOfBirth(basicInfo.dateOfBirth);
    if (basicInfo.profilePicture && !profilePicture) setProfilePicture(basicInfo.profilePicture);
  }, [basicInfo]);

  // Screening alerts calculation for red alert badge
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

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  // Profile Picture Upload Handler (Base64 data URL)
  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture must be under 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProfilePicture(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfilePicture(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.trim() && phoneDigits.length < 8) {
      newErrors.phoneNumber = 'Please enter a valid phone number with at least 8 digits.';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Calculate age from DOB if available
    let calculatedAge = basicInfo.age;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let ageNum = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageNum--;
      }
      if (ageNum > 0 && ageNum < 120) {
        calculatedAge = String(ageNum);
      }
    }

    // Persist to Context & LocalStorage
    updateBasicInfo({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      dateOfBirth,
      age: calculatedAge,
      profilePicture,
    });

    // Also update Firebase displayName
    try {
      const user = auth.currentUser;
      if (user && fullName.trim() && user.displayName !== fullName.trim()) {
        await updateProfile(user, { displayName: fullName.trim() });
      }
    } catch (_) {
      // Non-critical — ignore
    }

    setIsSaving(false);
    setToastMessage('Profile updated successfully!');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const { currentUser } = useAuth();

  // Real Google Auth Status from Firebase
  const isGoogleConnected = Boolean(
    currentUser?.providerData?.some((p) => p.providerId === 'google.com') ||
    basicInfo.googleConnected
  );
  const googleConnectedEmail =
    (currentUser?.providerData?.find((p) => p.providerId === 'google.com')?.email) ||
    currentUser?.email ||
    basicInfo.googleEmail ||
    email ||
    'Connected with Google SSO';

  const displayName = fullName.trim() || basicInfo.fullName?.trim() || 'User';
  const userInitial = displayName !== 'User' ? displayName.charAt(0).toUpperCase() : null;

  return (
    <div className="dashboard-layout-root">
      <Sidebar
        activeItem="settings"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={unreadAlertsCount}
      />

      <main className="dashboard-main-area settings-main-canvas">
        {/* Top Header Bar */}
        <header className="dashboard-top-bar">
          <div className="top-bar-left">
            <h1 className="main-heading">{t('settings.heading', 'Settings & Preferences')}</h1>
            <p className="main-subtext">{t('settings.subheading', 'Manage your profile details, security credentials, and application controls.')}</p>
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
                {profilePicture ? (
                  <img
                    src={profilePicture}
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

        {/* Toast Notification */}
        {showToast && (
          <div className="settings-toast-notification" role="status" aria-live="polite">
            <div className="toast-icon-check">✓</div>
            <span>{t('settings.profileUpdatedToast', toastMessage)}</span>
          </div>
        )}

        <div className="settings-content-grid">
          {/* Main Account & Profile Card */}
          <section className="settings-card profile-settings-section">
            <div className="settings-card-header">
              <div className="settings-header-icon-box box-blue">
                <UserIcon size={22} color="#2563EB" />
              </div>
              <div>
                <h2 className="settings-card-title">{t('settings.accountSection', 'Account & Profile')}</h2>
                <p className="settings-card-subtitle">
                  {t('settings.accountSubtitle', 'Update your personal details, contact coordinates, and demographic records.')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveChanges} className="settings-form" noValidate>
              {/* Profile Picture Box */}
              <div className="profile-pic-upload-container">
                <div className="profile-pic-preview">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="preview-img" />
                  ) : (
                    <div className="preview-placeholder">
                      <span>{userInitial}</span>
                    </div>
                  )}
                </div>

                <div className="profile-pic-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePictureUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div className="pic-btn-group">
                    <button
                      type="button"
                      className="btn-upload-pic"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('settings.uploadPhoto', 'Upload New Photo')}
                    </button>
                    {profilePicture && (
                      <button
                        type="button"
                        className="btn-remove-pic"
                        onClick={handleRemovePicture}
                      >
                        {t('common.remove', 'Remove')}
                      </button>
                    )}
                  </div>
                  <span className="pic-hint-text">{t('settings.photoHint', 'JPG, PNG, or WEBP under 2MB.')}</span>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="settings-inputs-grid">
                {/* Full Name */}
                <div className="settings-form-group">
                  <label htmlFor="settings-fullname" className="settings-label">
                    {t('settings.fullName', 'Full Name')} <span className="req-star">*</span>
                  </label>
                  <input
                    id="settings-fullname"
                    type="text"
                    className={`settings-input ${errors.fullName ? 'has-error' : ''}`}
                    placeholder={t('settings.fullNamePlaceholder', 'Enter your full name')}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                  />
                  {errors.fullName && <span className="settings-error-text">{errors.fullName}</span>}
                </div>

                {/* Email Address */}
                <div className="settings-form-group">
                  <label htmlFor="settings-email" className="settings-label">
                    {t('settings.email', 'Email Address')} <span className="req-star">*</span>
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    className={`settings-input ${errors.email ? 'has-error' : ''}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                  />
                  {errors.email && <span className="settings-error-text">{errors.email}</span>}
                </div>

                {/* Phone Number */}
                <div className="settings-form-group">
                  <label htmlFor="settings-phone" className="settings-label">
                    {t('settings.phone', 'Phone Number')} <span className="req-star">*</span>
                  </label>
                  <input
                    id="settings-phone"
                    type="tel"
                    className={`settings-input ${errors.phoneNumber ? 'has-error' : ''}`}
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                    }}
                  />
                  {errors.phoneNumber && <span className="settings-error-text">{errors.phoneNumber}</span>}
                </div>

                {/* Date of Birth */}
                <div className="settings-form-group">
                  <label htmlFor="settings-dob" className="settings-label">
                    {t('settings.dob', 'Date of Birth')} <span className="req-star">*</span>
                  </label>
                  <input
                    id="settings-dob"
                    type="date"
                    className={`settings-input ${errors.dateOfBirth ? 'has-error' : ''}`}
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
                    }}
                  />
                  {errors.dateOfBirth && <span className="settings-error-text">{errors.dateOfBirth}</span>}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="settings-actions-bar">
                <div className="settings-linked-actions">
                  <button
                    type="button"
                    className="btn-secondary-link"
                    onClick={() => onNavigate('health-profile')}
                  >
                    <AssessmentIcon size={16} color="#2563EB" />
                    <span>{t('settings.editHealthProfile', 'Edit Assessment')}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-save-settings"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="btn-spinner" />
                      <span>{t('settings.savingChanges', 'Saving Changes...')}</span>
                    </>
                  ) : (
                    <span>{t('settings.saveChanges', 'Save Changes')}</span>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Connected Accounts & Security Side Card */}
          <section className="settings-card security-overview-section">
            <div className="settings-card-header">
              <div className="settings-header-icon-box box-teal">
                <SecureShieldIcon size={22} color="#0D9488" />
              </div>
              <div>
                <h2 className="settings-card-title">{t('settings.securitySection', 'Security & Connections')}</h2>
                <p className="settings-card-subtitle">{t('settings.securitySubtitle', 'Third-party authentications and data safety')}</p>
              </div>
            </div>

            {/* Google Account Status Box (Real Status) */}
            <div className="google-auth-status-box">
              <div className="google-status-top">
                <div className="google-brand-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div className="google-status-details">
                  <div className="google-title-row">
                    <span className="google-title">{t('settings.googleAccount', 'Google Account')}</span>
                    {isGoogleConnected ? (
                      <span className="status-badge badge-connected">{t('settings.connected', 'Connected')}</span>
                    ) : (
                      <span className="status-badge badge-disconnected">{t('settings.notConnected', 'Not Connected')}</span>
                    )}
                  </div>
                  <span className="google-account-email">
                    {isGoogleConnected ? googleConnectedEmail : t('settings.noGoogleLinked', 'No Google SSO account linked')}
                  </span>
                </div>
              </div>
              <p className="google-status-note">
                {isGoogleConnected
                  ? t('settings.googleAuthNote', 'Your account can authenticate seamlessly via Google Single Sign-On.')
                  : t('settings.emailAuthNote', 'You are signed in via Email & Password.')}
              </p>
            </div>
          </section>

          {/* App Preferences */}
          <section className="settings-card security-overview-section" style={{ marginTop: '24px' }}>
            <div className="settings-card-header">
              <div className="settings-header-icon-box box-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              </div>
              <div>
                <h2 className="settings-card-title">{t('settings.appPreferences', 'App Preferences')}</h2>
                <p className="settings-card-subtitle">{t('settings.appPreferencesSubtitle', 'Customize your OncoGuards experience')}</p>
              </div>
            </div>

            {/* Dark Mode */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--color-primary-text)', marginBottom: '4px' }}>{t('settings.darkMode', 'Dark Mode')}</h4>
                <p style={{ color: 'var(--color-muted-text)', fontSize: '0.9rem' }}>{t('settings.darkModeSubtitle', 'Toggle between dark and light themes.')}</p>
              </div>
              <button 
                type="button" 
                onClick={toggleTheme}
                style={{
                  width: '48px',
                  height: '24px',
                  backgroundColor: theme === 'dark' ? '#2563EB' : '#CBD5E1',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: theme === 'dark' ? '26px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </section>
        </div>
      </main>

      <MobileBottomNav
        activeItem="settings"
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default SettingsPage;
