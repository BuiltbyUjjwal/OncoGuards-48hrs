import React, { useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
import { TrustPoints } from './components/TrustPoints';
import { LoginForm } from './components/LoginForm';
import { HealthcareIllustration } from './assets/HealthcareIllustration';
import { ShieldCrossIcon, SecureShieldIcon } from './assets/MedicalIcons';
import './styles/LoginPage.css';

interface LoginPageProps {
  onNavigateToDashboard?: (email?: string) => void;
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToDashboard,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
}) => {
  const [modalType, setModalType] = useState<'create-account' | 'forgot-password' | null>(null);
  const [modalEmail, setModalEmail] = useState('');
  const [modalSubmitted, setModalSubmitted] = useState(false);

  const handleOpenForgotPassword = () => {
    if (onNavigateToForgotPassword) {
      onNavigateToForgotPassword();
    } else {
      setModalType('forgot-password');
      setModalSubmitted(false);
      setModalEmail('');
    }
  };

  const handleOpenCreateAccount = () => {
    if (onNavigateToSignUp) {
      onNavigateToSignUp();
    } else {
      setModalType('create-account');
      setModalSubmitted(false);
      setModalEmail('');
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setModalSubmitted(false);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalEmail.trim()) {
      setModalSubmitted(true);
    }
  };

  return (
    <main className="login-page-root">
      {/* LEFT SECTION (50% on Desktop) */}
      <section className="login-left-section" aria-label="Brand Overview and Awareness">
        <div className="left-inner-wrapper">
          {/* Logo Header */}
          <header className="left-header">
            <BrandLogo size="large" showTagline={false} />
            <p className="login-logo-disclaimer">
              OncoGuards gives you a risk estimate, not a diagnosis.
            </p>
          </header>

          {/* Core Brand Message */}
          <div className="left-hero-content">
            <div className="hero-pill-tag">
              <span className="hero-pill-dot" />
              <span>Clinical AI Prevention Platform</span>
            </div>

            <h1 className="hero-main-heading">
              Early awareness saves lives.
            </h1>

            <p className="hero-description">
              OncoGuard is a calm, explainable lung cancer risk check — built for people who don't have easy access to a specialist. It's not a diagnosis. It's a reason to act early.
            </p>
          </div>

          {/* Trust Points */}
          <div className="left-trust-wrapper">
            <TrustPoints />
          </div>

          {/* Healthcare Illustration */}
          <div className="left-illustration-wrapper">
            <HealthcareIllustration className="hero-illustration-svg" />
          </div>

          {/* Compliance Footer Note */}
          <footer className="left-footer">
            <div className="footer-security-tag">
              <SecureShieldIcon size={14} className="footer-security-icon" />
              <span>HIPAA Compliant Protocol • Clinical AI Safeguards • ISO 27001 Certified</span>
            </div>
          </footer>
        </div>
      </section>

      {/* RIGHT SECTION (50% on Desktop, Centered Card) */}
      <section className="login-right-section" aria-label="Sign In Authentication Portal">
        {/* Mobile Header (Shown on small screens where left hero is collapsed/hidden) */}
        <div className="mobile-brand-bar">
          <BrandLogo size="normal" />
          <p className="login-logo-disclaimer mobile-disclaimer">
            OncoGuards gives you a risk estimate, not a diagnosis.
          </p>
        </div>

        {/* Center Container for Login Card */}
        <div className="right-card-container">
          <LoginForm
            onForgotPassword={handleOpenForgotPassword}
            onNavigateToSignUp={handleOpenCreateAccount}
            onSuccess={(email) => {
              if (onNavigateToDashboard) {
                onNavigateToDashboard(email);
              }
            }}
          />
        </div>

        {/* Bottom Legal / Help Links */}
        <footer className="right-footer-links">
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('OncoGuards AI adheres to strict HIPAA and GDPR data privacy standards.'); }}>
            Privacy Policy
          </a>
          <span className="footer-dot-sep">•</span>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: For screening guidance only, not a substitute for formal diagnosis.'); }}>
            Terms of Service
          </a>
          <span className="footer-dot-sep">•</span>
          <a href="#help" onClick={(e) => { e.preventDefault(); alert('Support Desk: support@oncoguards.ai'); }}>
            Clinical Support
          </a>
        </footer>
      </section>

      {/* Interactive Modal for Forgot Password / Create Account preview */}
      {modalType && (
        <div className="modal-backdrop" onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge">
                <ShieldCrossIcon size={24} />
              </div>
              <h2 className="modal-title">
                {modalType === 'forgot-password' ? 'Reset Your Password' : 'Create OncoGuards Account'}
              </h2>
              <p className="modal-subtitle">
                {modalType === 'forgot-password'
                  ? 'Enter your registered healthcare email to receive secure recovery instructions.'
                  : 'Join the OncoGuards AI platform for personalized cancer risk awareness.'}
              </p>
            </div>

            {modalSubmitted ? (
              <div className="modal-success-state">
                <div className="modal-success-icon">
                  <SecureShieldIcon size={32} />
                </div>
                <h3>{modalType === 'forgot-password' ? 'Recovery Link Sent' : 'Registration Request Received'}</h3>
                <p>
                  We have sent instructions to <strong>{modalEmail}</strong>. Please check your inbox to complete the process.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleCloseModal}>
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="modal-email-input" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="modal-email-input"
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="modal-input"
                    autoFocus
                  />
                </div>

                <div className="modal-btn-row">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === 'forgot-password' ? 'Send Reset Link' : 'Get Started'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default LoginPage;
