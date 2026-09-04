import React, { useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
import { SignUpForm } from './components/SignUpForm';
import { SecureShieldIcon, ShieldCrossIcon } from './assets/MedicalIcons';
import { useTranslation } from 'react-i18next';
import './styles/SignUpPage.css';

interface SignUpPageProps {
  onNavigateToSignIn?: () => void;
  onNavigateToDashboard?: (email?: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToSignIn, onNavigateToDashboard }) => {
  const { t } = useTranslation();
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const handleCloseLegalModal = () => {
    setActiveLegalModal(null);
  };

  return (
    <main className="signup-page-root">
      <div className="signup-page-container">
        {/* OncoGuards AI Logo Above Card */}
        <header className="signup-logo-header">
          <BrandLogo size="large" showTagline={true} />
        </header>

        {/* Centered White Signup Card */}
        <div className="signup-card-wrapper">
          <SignUpForm
            onNavigateToSignIn={onNavigateToSignIn}
            onViewTerms={() => setActiveLegalModal('terms')}
            onViewPrivacy={() => setActiveLegalModal('privacy')}
            onSuccess={(email) => {
              if (onNavigateToDashboard) {
                onNavigateToDashboard(email);
              }
            }}
          />
        </div>

        {/* Footer Security Highlights */}
        <footer className="signup-page-footer">
          <div className="footer-security-badge">
            <SecureShieldIcon size={15} className="security-icon" />
            <span>{t('auth.securityBadgeSignup', 'HIPAA-Ready Architecture • End-to-End Encrypted • Oncology Risk Guidance')}</span>
          </div>

          <div className="footer-links-row">
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setActiveLegalModal('privacy')}
            >
              {t('auth.privacy', 'Privacy Policy')}
            </button>
            <span className="footer-dot-sep">•</span>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setActiveLegalModal('terms')}
            >
              {t('auth.terms', 'Terms of Service')}
            </button>
            <span className="footer-dot-sep">•</span>
            <a
              href="mailto:support@oncoguards.ai"
              className="footer-link-btn"
              onClick={(e) => {
                e.preventDefault();
                alert('OncoGuards AI Support: support@oncoguards.ai');
              }}
            >
              {t('auth.clinicalSupport', 'Clinical Support')}
            </a>
          </div>
        </footer>
      </div>

      {/* Terms & Privacy Policy Modal */}
      {activeLegalModal && (
        <div className="modal-backdrop" onClick={handleCloseLegalModal} role="dialog" aria-modal="true">
          <div className="modal-card modal-card-legal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge">
                <ShieldCrossIcon size={24} />
              </div>
              <h2 className="modal-title">
                {activeLegalModal === 'terms' ? 'Terms of Service' : 'Privacy & HIPAA Policy'}
              </h2>
              <p className="modal-subtitle">
                OncoGuards AI Clinical Platform Governance & Data Standards
              </p>
            </div>

            <div className="modal-legal-content">
              {activeLegalModal === 'terms' ? (
                <>
                  <h4>1. Clinical Guidance Notice</h4>
                  <p>
                    OncoGuards AI provides screening risk assessments and educational awareness based on user-provided clinical metrics. This is not a direct substitute for diagnostic biopsies or formal physician consultations.
                  </p>
                  <h4>2. User Responsibilities</h4>
                  <p>
                    Users must provide truthful medical history and promptly consult licensed oncologists for personalized treatment plans.
                  </p>
                  <h4>3. Account Security</h4>
                  <p>
                    You are responsible for maintaining the confidentiality of your credentials.
                  </p>
                </>
              ) : (
                <>
                  <h4>1. HIPAA and Data Encryption</h4>
                  <p>
                    All health records and genomic biomarker queries are encrypted both in transit (TLS 1.3) and at rest (AES-256).
                  </p>
                  <h4>2. Medical Data Privacy</h4>
                  <p>
                    Your health information is never sold to third-party advertisers. Data is used strictly for generating your personalized risk profile.
                  </p>
                  <h4>3. Data Retention and Control</h4>
                  <p>
                    You may export or permanently delete your clinical profile and risk history at any time from your account settings.
                  </p>
                </>
              )}
            </div>

            <button type="button" className="btn btn-primary" onClick={handleCloseLegalModal}>
              Understood & Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default SignUpPage;
