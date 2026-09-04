import React, { useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
import { MailIcon, SpinnerIcon, CheckCircleIcon, AlertCircleIcon } from './assets/MedicalIcons';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import './styles/ForgotPasswordPage.css';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const { t } = useTranslation();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered healthcare email.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await sendPasswordReset(email.trim());
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Unable to send reset email. Please try again later.');
      }
    } catch {
      setError('Unable to send reset email. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="forgot-page-root">
      <div className="forgot-page-container">
        {/* OncoGuards Brand Logo Above */}
        <header className="forgot-logo-header">
          <BrandLogo size="large" showTagline={true} />
        </header>

        {/* White Centered Recovery Card */}
        <div className="forgot-card">
          <div className="forgot-card-header">
            <h1 className="forgot-heading">{t('auth.resetPasswordTitle', 'Reset Password')}</h1>
            <p className="forgot-subtext">
              {t('auth.resetPasswordSub', "Enter your registered email address and we'll send you secure verification instructions to reset your access.")}
            </p>
          </div>

          {error && (
            <div className="login-alert login-alert-error" role="alert">
              <AlertCircleIcon size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="forgot-success-box">
              <div className="success-icon-badge">
                <CheckCircleIcon size={32} />
              </div>
              <h2 className="success-heading">{t('auth.resetLinkSent', 'Password Reset Link Sent')}</h2>
              <p className="success-desc">
                {t('auth.resetLinkSentDesc', 'If an account exists for this email, a secure reset link has been dispatched.')}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onNavigateToLogin}
              >
                {t('auth.returnToLogin', 'Return to Login')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-form" noValidate>
              <div className="form-group">
                <label htmlFor="recovery-email" className="form-label">
                  {t('auth.emailLabel', 'Email Address')}
                </label>
                <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''}`}>
                  <span className="input-icon" aria-hidden="true">
                    <MailIcon size={18} />
                  </span>
                  <input
                    id="recovery-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                    autoComplete="email"
                    required
                    className="form-input"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading-content">
                    <SpinnerIcon size={18} />
                    <span>{t('auth.sendingResetLink', 'Sending Reset Link...')}</span>
                  </span>
                ) : (
                  <span>{t('auth.sendResetLink', 'Send Reset Link')}</span>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-back-login"
                onClick={onNavigateToLogin}
              >
                {t('auth.backToSignIn', 'Back to Sign In')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
