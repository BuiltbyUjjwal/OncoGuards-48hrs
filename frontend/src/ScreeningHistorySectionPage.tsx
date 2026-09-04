import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { AssessmentSidePanel } from './components/AssessmentSidePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { AlertCircleIcon, CheckIcon } from './assets/MedicalIcons';
import './styles/MedicalHistorySectionPage.css';

interface ScreeningHistorySectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface ScreeningTestOption {
  key: string;
  label: string;
  subtext: string;
  femaleOnly?: boolean;
  maleOnly?: boolean;
}

export const ScreeningHistorySectionPage: React.FC<ScreeningHistorySectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const {
    state: assessmentState,
    updateScreeningHistory,
    isFemale,
    markProfileCompleted,
  } = useAssessment();

  const ALL_SCREENING_TESTS: ScreeningTestOption[] = [
    // Female-specific tests
    {
      key: 'mammogram',
      label: t('screening.mammogramLabel', 'Screening Mammogram'),
      subtext: t('screening.mammogramSub', 'Standard low-dose X-ray of breast tissue'),
      femaleOnly: true,
    },
    {
      key: 'breast_ultrasound',
      label: t('screening.ultrasoundLabel', 'Breast Ultrasound / MRI'),
      subtext: t('screening.ultrasoundSub', 'Diagnostic or supplemental breast tissue imaging'),
      femaleOnly: true,
    },
    {
      key: 'pap_smear',
      label: t('screening.papSmearLabel', 'Pap Smear / Cytology'),
      subtext: t('screening.papSmearSub', 'Cervical smear cell examination'),
      femaleOnly: true,
    },
    {
      key: 'hpv_dna',
      label: t('screening.hpvDnaLabel', 'HPV DNA Test'),
      subtext: t('screening.hpvDnaSub', 'High-risk molecular HPV cervical screening'),
      femaleOnly: true,
    },

    // General & Male tests
    {
      key: 'ldct_lung',
      label: t('screening.ldctLabel', 'Low-Dose Chest CT (LDCT)'),
      subtext: t('screening.ldctSub', 'Preventive helical chest tomography for lung health'),
    },
    {
      key: 'oral_exam',
      label: t('screening.oralExamLabel', 'Oral Visual & Mucosal Exam'),
      subtext: t('screening.oralExamSub', 'Clinical mouth, tongue, and throat inspection by doctor/dentist'),
    },
    {
      key: 'colonoscopy',
      label: t('screening.colonoscopyLabel', 'Colonoscopy / Stool FIT Test'),
      subtext: t('screening.colonoscopySub', 'Colorectal polyps and occult blood screening'),
    },
    {
      key: 'psa_test',
      label: t('screening.psaLabel', 'PSA Blood Test'),
      subtext: t('screening.psaSub', 'Prostate-specific antigen screening'),
      maleOnly: true,
    },
    {
      key: 'other',
      label: t('screening.otherLabel', 'Other Screening Test'),
      subtext: t('screening.otherSub', 'Other formal preventive cancer investigation'),
    },
  ];

  const LAST_SCREENING_TIMEFRAMES = [
    { value: 'Within the last year', label: t('screening.timeLastYear', 'Within the last year'), subtext: t('screening.timeLastYearSub', 'Up-to-date with routine screening') },
    { value: '1 to 3 years ago', label: t('screening.time1to3', '1 to 3 years ago'), subtext: t('screening.time1to3Sub', 'Prior routine check-up') },
    { value: 'More than 3 years ago', label: t('screening.time3plus', 'More than 3 years ago'), subtext: t('screening.time3plusSub', 'Overdue for regular guidelines') },
    { value: 'Not sure', label: t('screening.timeNotSure', 'Not sure'), subtext: t('screening.timeNotSureSub', 'Uncertain of exact timing') },
  ];

  const [hasPreviousScreening, setHasPreviousScreening] = useState<string>(
    assessmentState.screeningHistory.hasPreviousScreening || ''
  );
  const [screeningsDone, setScreeningsDone] = useState<string[]>(
    assessmentState.screeningHistory.screeningsDone || []
  );
  const [lastCancerScreening, setLastCancerScreening] = useState<string>(
    assessmentState.screeningHistory.lastCancerScreening || ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  // Filter test options by biological sex: Never show breast/cervical to males
  const availableTestOptions = ALL_SCREENING_TESTS.filter((test) => {
    if (test.femaleOnly && !isFemale) return false;
    if (test.maleOnly && isFemale) return false;
    return true;
  });

  const handleToggleTest = (key: string) => {
    setScreeningsDone((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });

    if (errors.screeningsDone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.screeningsDone;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!hasPreviousScreening) {
      errs.hasPreviousScreening = 'Please indicate if you have had cancer screening tests.';
    } else if (hasPreviousScreening === 'Yes') {
      if (screeningsDone.length === 0) {
        errs.screeningsDone = 'Please select at least one screening test you have had.';
      }
      if (!lastCancerScreening) {
        errs.lastCancerScreening = 'Please select the timeframe of your most recent screening.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    updateScreeningHistory({
      hasPreviousScreening,
      screeningsDone: hasPreviousScreening === 'Yes' ? screeningsDone : [],
      lastCancerScreening: hasPreviousScreening === 'Yes' ? lastCancerScreening : 'Never',
    });

    markProfileCompleted(true);

    // Navigate to Health Profile Review Page
    onNavigate('assessment-review');
  };

  const currentStep = isFemale ? 5 : 4;
  const totalSteps = isFemale ? 5 : 4;

  return (
    <div className="medical-layout-root">
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      <main className="medical-main-area">
        <header className="medical-top-header">
          <div className="breadcrumb-nav">
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('health-profile')}>
              {t('nav.healthProfile', 'Health Profile')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('screening.stepTitle', 'Screening History')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate(isFemale ? 'assessment-step4' : 'assessment-step3')}
          >
            {isFemale ? t('screening.backToWomensHealth', "← Back to Women's Health") : t('screening.backToMedical', '← Back to Medical & Family History')}
          </button>
        </header>

        <div className="assessment-page-layout-grid">
          <div className="medical-container">
            <div className="medical-form-card">
              {/* Step Progress Banner */}
              <div className="step-progress-banner" aria-label={t('common.assessmentProgress', 'Assessment Progress')}>
                <div className="step-progress-top">
                  <div className="step-progress-label">
                    <span className="step-indicator-pill">
                      {t('screening.stepIndicator', `Step ${currentStep} of ${totalSteps}`)}
                    </span>
                    <span className="step-page-title">{t('screening.stepTitle', 'Screening History')}</span>
                  </div>
                  <span className="step-pct-text">100% {t('common.complete', 'Complete')}</span>
                </div>
                <div className="step-progress-bar-track">
                  <div className="step-progress-bar-fill" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="form-header-group">
                <h1 className="form-section-heading">{t('screening.heading', 'Previous Cancer Screenings')}</h1>
                <p className="form-section-subtext">
                  {t('screening.subheading', 'Documenting your historical tests helps compare against evidence-based early detection intervals.')}
                </p>
              </div>

              <form onSubmit={handleNext} className="questionnaire-form" noValidate>
                {/* Question 1: Previous Screening */}
                <div className={`medical-question-card ${errors.hasPreviousScreening ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('screening.priorScreeningBadge', 'Prior Screening')}</span>
                    <h2 className="question-prompt">
                      {t('screening.question', 'Have you ever had a previous cancer screening test or preventive check-up?')}
                    </h2>
                    <span className="question-sub-prompt">
                      {isFemale ? t('screening.subPromptFemale', 'E.g. mammogram, Pap smear, HPV test, oral mucosa exam, low-dose chest CT, or colonoscopy.') : t('screening.subPromptMale', 'E.g. oral mucosa exam, low-dose chest CT, colonoscopy, or PSA test.')}
                    </span>
                  </div>

                  <div className="options-grid-3col" role="radiogroup">
                    {[
                      { key: 'No', label: t('screening.optNever', 'No, Never') },
                      { key: 'Yes', label: t('screening.optYes', 'Yes, Have screened') },
                      { key: 'Not sure', label: t('screening.optNotSure', 'Not Sure') },
                    ].map((opt) => {
                      const isSelected = hasPreviousScreening === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setHasPreviousScreening(opt.key);
                            if (opt.key !== 'Yes') {
                              setScreeningsDone([]);
                              setLastCancerScreening('');
                            }
                            if (errors.hasPreviousScreening) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.hasPreviousScreening;
                                return next;
                              });
                            }
                          }}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className="option-radio-circle">
                              {isSelected && <span className="radio-check-dot" />}
                            </div>
                            <span className="option-title-text">{opt.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {errors.hasPreviousScreening && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.hasPreviousScreening}</span>
                    </div>
                  )}
                </div>

                {/* Conditional Questions if Yes */}
                {hasPreviousScreening === 'Yes' && (
                  <>
                    {/* Which screenings were done? */}
                    <div className={`medical-question-card ${errors.screeningsDone ? 'has-error' : ''}`}>
                      <div className="question-card-header">
                        <span className="question-number-badge">{t('screening.testsBadge', 'Tests Attended')}</span>
                        <h2 className="question-prompt">{t('screening.whichTestsQuestion', 'Which cancer screening tests have you completed?')}</h2>
                        <span className="question-sub-prompt">{t('screening.whichTestsSub', 'Select all that apply in your clinical history.')}</span>
                      </div>

                      <div className="options-grid-2col">
                        {availableTestOptions.map((test) => {
                          const isSelected = screeningsDone.includes(test.key);
                          return (
                            <button
                              key={test.key}
                              type="button"
                              className={`selectable-checkbox-card ${isSelected ? 'is-checked' : ''}`}
                              onClick={() => handleToggleTest(test.key)}
                              role="checkbox"
                              aria-checked={isSelected}
                            >
                              <div className="checkbox-left-content">
                                <div className={`custom-checkbox-box ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <CheckIcon size={13} />}
                                </div>
                                <div className="option-text-block">
                                  <span className="option-title-text">{test.label}</span>
                                  <span className="option-sub-text">{test.subtext}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {errors.screeningsDone && (
                        <div className="question-error-banner" role="alert" style={{ marginTop: '12px' }}>
                          <AlertCircleIcon size={15} className="question-error-icon" />
                          <span>{errors.screeningsDone}</span>
                        </div>
                      )}
                    </div>

                    {/* Timeframe of most recent screening */}
                    <div className={`medical-question-card ${errors.lastCancerScreening ? 'has-error' : ''}`}>
                      <div className="question-card-header">
                        <span className="question-number-badge">{t('screening.timingBadge', 'Most Recent Timing')}</span>
                        <h2 className="question-prompt">{t('screening.whenQuestion', 'When did your most recent cancer screening take place?')}</h2>
                      </div>

                      <div className="option-cards-stack" role="radiogroup">
                        {LAST_SCREENING_TIMEFRAMES.map((tf) => {
                          const isSelected = lastCancerScreening === tf.value;
                          return (
                            <button
                              key={tf.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setLastCancerScreening(tf.value);
                                if (errors.lastCancerScreening) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.lastCancerScreening;
                                    return next;
                                  });
                                }
                              }}
                              role="radio"
                              aria-checked={isSelected}
                            >
                              <div className="option-left-content">
                                <div className="option-radio-circle">
                                  {isSelected && <span className="radio-check-dot" />}
                                </div>
                                <div className="option-text-block">
                                  <span className="option-title-text">{tf.label}</span>
                                  <span className="option-sub-text">{tf.subtext}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="option-check-indicator" aria-hidden="true">
                                  <CheckIcon size={14} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {errors.lastCancerScreening && (
                        <div className="question-error-banner" role="alert">
                          <AlertCircleIcon size={15} className="question-error-icon" />
                          <span>{errors.lastCancerScreening}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="form-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav-back"
                    onClick={() => onNavigate(isFemale ? 'assessment-step4' : 'assessment-step3')}
                  >
                    {t('common.back', '← Back')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                  >
                    <span>{t('screening.reviewHealthProfile', 'Review Health Profile →')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <AssessmentSidePanel
            currentStep={currentStep}
            totalSteps={totalSteps}
            isFemale={isFemale}
          />
        </div>
      </main>

      <MobileBottomNav activeItem="health-profile" onNavigate={onNavigate} />
    </div>
  );
};

export default ScreeningHistorySectionPage;
