import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircleIcon, ShieldCrossIcon } from '../assets/MedicalIcons';
import { CLINICAL_DISCLAIMER } from '../config/screeningGuidelines';
import './BreastSelfExamModal.css';

interface BreastSelfExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepData {
  number: number;
  title: string;
  imageSrc: string;
  imageAlt: string;
  instructions: string;
}

export const BreastSelfExamModal: React.FC<BreastSelfExamModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const BSE_STEPS: StepData[] = [
    {
      number: 1,
      title: t('bse.step1Title', 'In the shower'),
      imageSrc: '/assets/bse/shower.png',
      imageAlt: 'Breast self-exam in the shower',
      instructions: t('bse.step1Desc', 'With the pads/flats of your 3 middle fingers, check the entire breast and armpit area, pressing down with light, medium, and firm pressure. Check both breasts each month, feeling for any new lumps, thickenings, hardened knots, or any other breast changes.'),
    },
    {
      number: 2,
      title: t('bse.step2Title', 'In front of a mirror'),
      imageSrc: '/assets/bse/mirror.png',
      imageAlt: 'Breast self-exam in front of the mirror',
      instructions: t('bse.step2Desc', "With your arms at your sides, visually inspect your breasts, looking for any changes in the contour or shape of the breasts, any dimpling, swelling, or other skin irregularities on or around the breasts, or any changes in the nipples. Next, rest your palms on your hips and press firmly to flex your chest muscles. Look for any dimpling, puckering, or other changes, particularly on one side. Note that the left and right breasts will not exactly match–few women's breasts are perfectly symmetrical."),
    },
    {
      number: 3,
      title: t('bse.step3Title', 'Lying down'),
      imageSrc: '/assets/bse/lying.png',
      imageAlt: 'Breast self-exam lying down',
      instructions: t('bse.step3Desc', 'When lying down, the breast tissue spreads out evenly along the chest wall. Place a pillow under your right shoulder and put your right arm behind your head. Using your left hand, move the pads of your 3 middle fingers around your right breast, covering the entire breast area and armpit. Use light, medium, and firm pressure to feel for any new lumps, thickenings, hardened knots, or any other breast changes. Also squeeze the nipple to check for discharge. Repeat these steps for your left breast.'),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="bse-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bse-modal-title"
    >
      <div
        className="bse-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="bse-drawer-header">
          <div className="bse-header-title-group">
            <span className="bse-header-badge">
              <ShieldCrossIcon size={13} color="#0D9488" />
              <span>{t('bse.guideBadge', 'Breast Self-Awareness Guide')}</span>
            </span>
            <h2 id="bse-modal-title" className="bse-drawer-title">
              {t('bse.modalTitle', 'How should a breast self-exam be performed?')}
            </h2>
          </div>

          <button
            type="button"
            className="bse-close-btn"
            onClick={onClose}
            aria-label="Close self-exam guide"
          >
            ×
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="bse-drawer-scroll-body">
          <div className="bse-intro-banner">
            {t('bse.introBanner', 'There are three steps necessary to perform a thorough breast self-exam. Each of these steps should be completed each time you perform a breast self-exam.')}
          </div>

          <div className="bse-steps-container">
            {BSE_STEPS.map((step) => (
              <div key={step.number} className="bse-step-card">
                <div className="bse-step-image-wrap">
                  <img
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    className="bse-step-img"
                    loading="lazy"
                  />
                </div>
                <div className="bse-step-details">
                  <div className="bse-step-badge-row">
                    <span className="bse-step-num-pill">{t('common.stepIndicator', { current: step.number, total: 3, defaultValue: `Step ${step.number}` })}</span>
                    <h3 className="bse-step-heading">{step.title}</h3>
                  </div>
                  <p className="bse-step-instruction">{step.instructions}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Disclaimer Note */}
          <div className="bse-clinical-notice" role="note">
            <AlertCircleIcon size={18} color="#854d0e" />
            <span>{t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="bse-drawer-footer">
          <button
            type="button"
            className="bse-done-btn"
            onClick={onClose}
          >
            {t('bse.closeBtn', 'Got it, Close Guide')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BreastSelfExamModal;
