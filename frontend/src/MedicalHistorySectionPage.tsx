import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { AssessmentSidePanel } from './components/AssessmentSidePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import {
  AlertCircleIcon,
  CheckIcon,
} from './assets/MedicalIcons';
import './styles/MedicalHistorySectionPage.css';

interface MedicalHistorySectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const MedicalHistorySectionPage: React.FC<MedicalHistorySectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const {
    state: assessmentState,
    updateMedicalHistory,
    isFemale,
    isHydrated,
  } = useAssessment();

  const FAMILY_CANCER_OPTIONS = [
    { value: 'Breast Cancer', label: t('medicalHistory.breastCancer', 'Breast Cancer') },
    { value: 'Lung Cancer', label: t('medicalHistory.lungCancer', 'Lung Cancer') },
    { value: 'Oral Cancer', label: t('medicalHistory.oralCancer', 'Oral Cancer') },
    { value: 'Cervical Cancer', label: t('medicalHistory.cervicalCancer', 'Cervical Cancer') },
    { value: 'Not Sure', label: t('medicalHistory.notSure', 'Not Sure') },
  ];

  const MEDICAL_CONDITIONS = [
    { value: 'HPV (Human Papillomavirus) infection', label: t('medicalHistory.condHPV', 'HPV (Human Papillomavirus) infection') },
    { value: 'Hepatitis B infection', label: t('medicalHistory.condHepB', 'Hepatitis B infection') },
    { value: 'Hepatitis C infection', label: t('medicalHistory.condHepC', 'Hepatitis C infection') },
    { value: 'Type 2 Diabetes', label: t('medicalHistory.condDiabetes', 'Type 2 Diabetes') },
    { value: 'Chronic lung disease (COPD, chronic bronchitis, asthma)', label: t('medicalHistory.condLung', 'Chronic lung disease (COPD, chronic bronchitis, asthma)') },
    { value: 'Chronic acid reflux / GERD', label: t('medicalHistory.condGerd', 'Chronic acid reflux / GERD') },
    { value: 'None of the above', label: t('medicalHistory.condNone', 'None of the above') },
    { value: 'Not sure', label: t('medicalHistory.condNotSure', 'Not sure') },
  ];

  const PREVIOUS_CANCER_TYPES = [
    { value: 'Breast cancer', label: t('medicalHistory.prevBreast', 'Breast cancer') },
    { value: 'Oral cancer', label: t('medicalHistory.prevOral', 'Oral cancer') },
    { value: 'Cervical cancer', label: t('medicalHistory.prevCervical', 'Cervical cancer') },
    { value: 'Lung cancer', label: t('medicalHistory.prevLung', 'Lung cancer') },
  ];

  const DIAGNOSIS_TIME_OPTIONS = [
    { value: 'Currently undergoing treatment', label: t('medicalHistory.diagCurrent', 'Currently undergoing treatment') },
    { value: 'Within the last 5 years', label: t('medicalHistory.diagLast5', 'Within the last 5 years') },
    { value: 'More than 5 years ago (in remission)', label: t('medicalHistory.diagMore5', 'More than 5 years ago (in remission)') },
  ];

  const [hasFamilyCancerHistory, setHasFamilyCancerHistory] = useState(
    assessmentState.medicalHistory.hasFamilyCancerHistory || ''
  );
  const [familyCancerTypes, setFamilyCancerTypes] = useState<string[]>(
    assessmentState.medicalHistory.familyCancerTypes || []
  );
  const [familyCancerOtherText, setFamilyCancerOtherText] = useState(
    assessmentState.medicalHistory.familyCancerOtherText || ''
  );
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    assessmentState.medicalHistory.medicalConditions || []
  );
  const [hasPreviousCancerDiagnosis, setHasPreviousCancerDiagnosis] = useState(
    assessmentState.medicalHistory.hasPreviousCancerDiagnosis || ''
  );
  const [previousCancerType, setPreviousCancerType] = useState(
    assessmentState.medicalHistory.previousCancerType || ''
  );
  const [previousCancerOtherText, setPreviousCancerOtherText] = useState(
    assessmentState.medicalHistory.previousCancerOtherText || ''
  );
  const [previousCancerDiagnosisTime, setPreviousCancerDiagnosisTime] = useState(
    assessmentState.medicalHistory.previousCancerDiagnosisTime || ''
  );

  // Synchronize local form state with AssessmentContext upon hydration
  useEffect(() => {
    if (isHydrated && assessmentState.medicalHistory) {
      setHasFamilyCancerHistory(assessmentState.medicalHistory.hasFamilyCancerHistory || '');
      setFamilyCancerTypes(assessmentState.medicalHistory.familyCancerTypes || []);
      setFamilyCancerOtherText(assessmentState.medicalHistory.familyCancerOtherText || '');
      setMedicalConditions(assessmentState.medicalHistory.medicalConditions || []);
      setHasPreviousCancerDiagnosis(assessmentState.medicalHistory.hasPreviousCancerDiagnosis || '');
      setPreviousCancerType(assessmentState.medicalHistory.previousCancerType || '');
      setPreviousCancerOtherText(assessmentState.medicalHistory.previousCancerOtherText || '');
      setPreviousCancerDiagnosisTime(assessmentState.medicalHistory.previousCancerDiagnosisTime || '');
    }
  }, [isHydrated, assessmentState.medicalHistory]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const handleToggleFamilyCancerType = (type: string) => {
    setFamilyCancerTypes((prev) => {
      if (type === 'Not Sure') {
        if (prev.includes('Not Sure')) {
          return [];
        }
        return ['Not Sure'];
      }

      const withoutNotSure = prev.filter((t) => t !== 'Not Sure');
      if (withoutNotSure.includes(type)) {
        const next = withoutNotSure.filter((t) => t !== type);
        if (type === 'Other') {
          setFamilyCancerOtherText('');
        }
        return next;
      }
      return [...withoutNotSure, type];
    });

    if (errors.familyCancerTypes) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.familyCancerTypes;
        return next;
      });
    }
  };

  const handleToggleCondition = (cond: string) => {
    setMedicalConditions((prev) => {
      if (cond === 'None of the above' || cond === 'Not sure') {
        return [cond];
      }
      const filtered = prev.filter((c) => c !== 'None of the above' && c !== 'Not sure');
      if (filtered.includes(cond)) {
        return filtered.filter((c) => c !== cond);
      }
      return [...filtered, cond];
    });

    if (errors.medicalConditions) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.medicalConditions;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!hasFamilyCancerHistory) {
      errs.hasFamilyCancerHistory = 'Please select Yes or No for family cancer history.';
    } else if (hasFamilyCancerHistory === 'Yes') {
      if (familyCancerTypes.length === 0) {
        errs.familyCancerTypes = 'Please select at least one cancer type diagnosed in your family.';
      } else if (familyCancerTypes.includes('Other') && !familyCancerOtherText.trim()) {
        errs.familyCancerTypes = 'Please specify the other cancer type in the text box.';
      }
    }

    if (medicalConditions.length === 0) {
      errs.medicalConditions = 'Please select your medical conditions or "None of the above".';
    }

    if (!hasPreviousCancerDiagnosis) {
      errs.hasPreviousCancerDiagnosis = 'Please indicate whether you have had a prior cancer diagnosis.';
    } else if (hasPreviousCancerDiagnosis === 'Yes') {
      if (!previousCancerType) {
        errs.previousCancerType = 'Please select the cancer type previously diagnosed.';
      }
      if (!previousCancerDiagnosisTime) {
        errs.previousCancerDiagnosisTime = 'Please select the timeframe of your prior diagnosis.';
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

    const hasLungFam = familyCancerTypes.includes('Lung Cancer');
    const hasBreastFam = familyCancerTypes.includes('Breast Cancer');
    const hasChronic = medicalConditions.some((c) => c.includes('Chronic lung disease'));

    updateMedicalHistory({
      hasFamilyCancerHistory,
      familyCancerTypes,
      familyCancerOtherText,
      hasFamilyHistoryLungCancer: hasLungFam,
      hasFamilyHistoryBreastCancer: hasBreastFam,
      hasChronicDisease: hasChronic,
      medicalConditions,
      hasPreviousCancerDiagnosis,
      previousCancerType,
      previousCancerOtherText,
      previousCancerDiagnosisTime,
    });

    // Branching: If female -> Step 4 Women's Health. If male -> Screening History
    if (isFemale) {
      onNavigate('assessment-step4');
    } else {
      onNavigate('assessment-step-screening');
    }
  };

  return (
    <div className="medical-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      {/* Main Content Area */}
      <main className="medical-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="medical-top-header">
          <div className="breadcrumb-nav">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('dashboard')}
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigate('health-profile')}
            >
              {t('nav.healthProfile', 'Assessment')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('medicalHistory.stepTitle', 'Medical History')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('assessment-step2')}
          >
            {t('medicalHistory.backToLifestyle', '← Back to Lifestyle')}
          </button>
        </header>

        {/* Assessment Grid Wrapper with Right Context Panel */}
        <div className="assessment-page-layout-grid">
          <div className="medical-container">
            <div className="medical-form-card">
              {/* Step Progress Banner */}
              <div className="step-progress-banner" aria-label={t('common.assessmentProgress', 'Assessment Progress')}>
                <div className="step-progress-top">
                  <div className="step-progress-label">
                    <span className="step-indicator-pill">{t('medicalHistory.stepIndicator', `Step 3 of ${isFemale ? 5 : 4}`)}</span>
                    <span className="step-page-title">{t('medicalHistory.stepTitle', 'Medical History')}</span>
                  </div>
                  <span className="step-pct-text">{isFemale ? '60%' : '75%'} {t('common.complete', 'Complete')}</span>
                </div>
                <div className="step-progress-bar-track">
                  <div
                    className="step-progress-bar-fill"
                    style={{ width: isFemale ? '60%' : '75%' }}
                  />
                </div>
              </div>

              {/* Header */}
              <div className="form-header-group">
                <h1 className="form-section-heading">{t('medicalHistory.heading', 'Medical Background & Family History')}</h1>
                <p className="form-section-subtext">
                  {t('medicalHistory.subheading', 'Hereditary cancer predispositions, chronic conditions, and personal clinical history.')}
                </p>
              </div>

              <form onSubmit={handleNext} className="questionnaire-form" noValidate>
                {/* QUESTION 1 — FAMILY HISTORY */}
                <div className={`medical-question-card ${errors.hasFamilyCancerHistory ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('medicalHistory.familyBadge', 'Family History')}</span>
                    <h2 className="question-prompt">
                      {t('medicalHistory.familyQuestion', 'Has anyone in your immediate family (parent, sibling, or child) ever been diagnosed with cancer?')}
                    </h2>
                    <span className="question-sub-prompt">
                      {t('medicalHistory.familySubPrompt', 'Includes biological mother, father, brothers, sisters, or children.')}
                    </span>
                  </div>

                  <div className="yes-no-binary-grid" role="radiogroup">
                    <button
                      type="button"
                      className={`yes-no-btn ${hasFamilyCancerHistory === 'No' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setHasFamilyCancerHistory('No');
                        setFamilyCancerTypes([]);
                        setFamilyCancerOtherText('');
                        if (errors.hasFamilyCancerHistory) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.hasFamilyCancerHistory;
                            delete next.familyCancerTypes;
                            return next;
                          });
                        }
                      }}
                      role="radio"
                      aria-checked={hasFamilyCancerHistory === 'No'}
                    >
                      <span>{t('common.no', 'No')}</span>
                    </button>

                    <button
                      type="button"
                      className={`yes-no-btn ${hasFamilyCancerHistory === 'Yes' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setHasFamilyCancerHistory('Yes');
                        if (errors.hasFamilyCancerHistory) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.hasFamilyCancerHistory;
                            return next;
                          });
                        }
                      }}
                      role="radio"
                      aria-checked={hasFamilyCancerHistory === 'Yes'}
                    >
                      <span>{t('common.yes', 'Yes')}</span>
                    </button>
                  </div>

                  {errors.hasFamilyCancerHistory && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.hasFamilyCancerHistory}</span>
                    </div>
                  )}

                  {/* Conditional: Which Type of Cancer Was Diagnosed? */}
                  {hasFamilyCancerHistory === 'Yes' && (
                    <div className="sub-question-section">
                      <h3 className="sub-section-title">{t('medicalHistory.familyTypeTitle', 'Which type of cancer was diagnosed?')}</h3>
                      <p className="question-sub-prompt" style={{ marginTop: '-6px' }}>
                        {t('medicalHistory.familyTypeSubPrompt', 'Select all that apply across first-degree relatives (e.g. Lung, Breast, Oral, Cervical).')}
                      </p>

                      <div className="options-grid-3col">
                        {FAMILY_CANCER_OPTIONS.map((item) => {
                          const isSelected = familyCancerTypes.includes(item.value);
                          return (
                            <button
                              key={item.value}
                              type="button"
                              className={`selectable-checkbox-card ${isSelected ? 'is-checked' : ''}`}
                              onClick={() => handleToggleFamilyCancerType(item.value)}
                              role="checkbox"
                              aria-checked={isSelected}
                            >
                              <div className="checkbox-left-content">
                                <div className={`custom-checkbox-box ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <CheckIcon size={13} />}
                                </div>
                                <span className="option-title-text" style={{ fontSize: '0.9rem' }}>
                                  {item.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {familyCancerTypes.includes('Other') && (
                        <div style={{ marginTop: '16px' }}>
                          <label className="field-label" style={{ fontSize: '0.86rem', marginBottom: '6px', display: 'block' }}>
                            {t('medicalHistory.specifyOther', 'Please specify other cancer type')}
                          </label>
                          <div className="input-field-wrapper">
                            <input
                              type="text"
                              value={familyCancerOtherText}
                              onChange={(e) => setFamilyCancerOtherText(e.target.value)}
                              placeholder={t('medicalHistory.specifyOtherPlaceholder', 'Please specify other cancer type')}
                              className="text-input-control"
                              autoFocus
                            />
                          </div>
                        </div>
                      )}

                      {errors.familyCancerTypes && (
                        <div className="question-error-banner" role="alert" style={{ marginTop: '10px' }}>
                          <AlertCircleIcon size={15} className="question-error-icon" />
                          <span>{errors.familyCancerTypes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* QUESTION 2: MEDICAL CONDITIONS */}
                <div className={`medical-question-card ${errors.medicalConditions ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('medicalHistory.conditionsBadge', 'Medical Conditions')}</span>
                    <h2 className="question-prompt">
                      {t('medicalHistory.conditionsQuestion', 'Have you been diagnosed with any of the following conditions?')}
                    </h2>
                    <span className="question-sub-prompt">
                      {t('medicalHistory.conditionsSubPrompt', 'HPV, Hepatitis B, Hepatitis C, Type 2 Diabetes, or chronic illnesses.')}
                    </span>
                  </div>

                  <div className="option-cards-stack" role="group">
                    {MEDICAL_CONDITIONS.map((cond) => {
                      const isSelected = medicalConditions.includes(cond.value);
                      return (
                        <button
                          key={cond.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleToggleCondition(cond.value)}
                          role="checkbox"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className={`custom-checkbox-box ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <CheckIcon size={13} />}
                            </div>
                            <span className="option-title-text">{cond.label}</span>
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

                  {errors.medicalConditions && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.medicalConditions}</span>
                    </div>
                  )}
                </div>

                {/* QUESTION 3: PREVIOUS CANCER DIAGNOSIS */}
                <div className={`medical-question-card ${errors.hasPreviousCancerDiagnosis ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('medicalHistory.personalBadge', 'Personal History')}</span>
                    <h2 className="question-prompt">
                      {t('medicalHistory.prevQuestion', 'Have you yourself ever been diagnosed with any type of cancer?')}
                    </h2>
                  </div>

                  <div className="yes-no-binary-grid" role="radiogroup">
                    <button
                      type="button"
                      className={`yes-no-btn ${hasPreviousCancerDiagnosis === 'No' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setHasPreviousCancerDiagnosis('No');
                        setPreviousCancerType('');
                        setPreviousCancerOtherText('');
                        setPreviousCancerDiagnosisTime('');
                        if (errors.hasPreviousCancerDiagnosis) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.hasPreviousCancerDiagnosis;
                            delete next.previousCancerType;
                            delete next.previousCancerDiagnosisTime;
                            return next;
                          });
                        }
                      }}
                      role="radio"
                      aria-checked={hasPreviousCancerDiagnosis === 'No'}
                    >
                      <span>{t('common.no', 'No')}</span>
                    </button>

                    <button
                      type="button"
                      className={`yes-no-btn ${hasPreviousCancerDiagnosis === 'Yes' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setHasPreviousCancerDiagnosis('Yes');
                        if (errors.hasPreviousCancerDiagnosis) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.hasPreviousCancerDiagnosis;
                            return next;
                          });
                        }
                      }}
                      role="radio"
                      aria-checked={hasPreviousCancerDiagnosis === 'Yes'}
                    >
                      <span>{t('common.yes', 'Yes')}</span>
                    </button>
                  </div>

                  {errors.hasPreviousCancerDiagnosis && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.hasPreviousCancerDiagnosis}</span>
                    </div>
                  )}

                  {/* Conditional: Previous Diagnosis Details */}
                  {hasPreviousCancerDiagnosis === 'Yes' && (
                    <div className="sub-question-section">
                      <h3 className="sub-section-title">{t('medicalHistory.prevTypeTitle', 'What type of cancer was diagnosed?')}</h3>
                      <div className="options-grid-2col" style={{ marginBottom: '16px' }}>
                        {PREVIOUS_CANCER_TYPES.map((type) => {
                          const isSelected = previousCancerType === type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              className={`selectable-checkbox-card ${isSelected ? 'is-checked' : ''}`}
                              onClick={() => {
                                setPreviousCancerType(type.value);
                                setPreviousCancerOtherText('');
                              }}
                            >
                              <div className="checkbox-left-content">
                                <div className={`custom-checkbox-box ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <CheckIcon size={13} />}
                                </div>
                                <span className="option-title-text" style={{ fontSize: '0.9rem' }}>
                                  {type.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <h3 className="sub-section-title">{t('medicalHistory.prevTimeTitle', 'When was your diagnosis?')}</h3>
                      <div className="option-cards-stack">
                        {DIAGNOSIS_TIME_OPTIONS.map((timeOpt) => {
                          const isSelected = previousCancerDiagnosisTime === timeOpt.value;
                          return (
                            <button
                              key={timeOpt.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setPreviousCancerDiagnosisTime(timeOpt.value)}
                            >
                              <div className="option-left-content">
                                <div className="option-radio-circle">
                                  {isSelected && <span className="radio-check-dot" />}
                                </div>
                                <span className="option-title-text">{timeOpt.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions Footer */}
                <div className="form-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav-back"
                    onClick={() => onNavigate('assessment-step2')}
                  >
                    {t('common.back', '← Back')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                  >
                    <span>
                      {isFemale ? t('medicalHistory.continueToWomens', "Continue to Women's Health →") : t('medicalHistory.continueToScreening', 'Continue to Screening History →')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Desktop Contextual Progress Sidebar */}
          <AssessmentSidePanel
            currentStep={3}
            totalSteps={isFemale ? 5 : 4}
            isFemale={isFemale}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="health-profile" onNavigate={onNavigate} />
    </div>
  );
};

export default MedicalHistorySectionPage;

