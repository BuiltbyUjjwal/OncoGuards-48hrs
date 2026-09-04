import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { AssessmentSidePanel } from './components/AssessmentSidePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { AlertCircleIcon, CheckIcon } from './assets/MedicalIcons';
import './styles/MedicalHistorySectionPage.css';

interface WomenOnlySectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const WomenOnlySectionPage: React.FC<WomenOnlySectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, updateWomenOnly, isFemale, isHydrated } = useAssessment();

  const AGE_PERIODS_OPTIONS = [
    { value: 'Before age 12', label: t('womensHealth.periodBefore12', 'Before age 12') },
    { value: 'Age 12–14', label: t('womensHealth.period12to14', 'Age 12–14') },
    { value: 'Age 15 or older', label: t('womensHealth.period15plus', 'Age 15 or older') },
  ];

  const MENOPAUSE_STATUS_OPTIONS = [
    { value: 'Pre-menopausal (regular periods)', label: t('womensHealth.preMenopausal', 'Pre-menopausal (regular periods)') },
    { value: 'Peri-menopausal (irregular periods transitioning)', label: t('womensHealth.periMenopausal', 'Peri-menopausal (irregular periods transitioning)') },
    { value: 'Post-menopausal (periods stopped 12+ months)', label: t('womensHealth.postMenopausal', 'Post-menopausal (periods stopped 12+ months)') },
  ];

  const MENOPAUSE_AGE_OPTIONS = [
    { value: 'Under 45 years', label: t('womensHealth.menoUnder45', 'Under 45 years') },
    { value: 'Age 45–50', label: t('womensHealth.meno45to50', 'Age 45–50') },
    { value: 'Age 51–55', label: t('womensHealth.meno51to55', 'Age 51–55') },
    { value: 'Over 55 years', label: t('womensHealth.menoOver55', 'Over 55 years') },
  ];

  const PREGNANCY_OPTIONS = [
    { value: 'Never pregnant (nulliparous)', label: t('womensHealth.pregNever', 'Never pregnant (nulliparous)') },
    { value: '1 or 2 full-term pregnancies', label: t('womensHealth.preg1or2', '1 or 2 full-term pregnancies') },
    { value: '3 or more full-term pregnancies', label: t('womensHealth.preg3plus', '3 or more full-term pregnancies') },
  ];

  const AGE_FIRST_BIRTH_OPTIONS = [
    { value: 'Before age 30 (<30)', label: t('womensHealth.birthUnder30', 'Before age 30 (<30)') },
    { value: 'Age 30 or older (30+)', label: t('womensHealth.birth30plus', 'Age 30 or older (30+)') },
  ];

  const NUM_RELATIVES_BREAST_OPTIONS = [
    { value: '0 (None)', label: t('womensHealth.rel0', '0 (None)') },
    { value: '1 relative', label: t('womensHealth.rel1', '1 relative') },
    { value: '2 or more relatives (2+)', label: t('womensHealth.rel2plus', '2 or more relatives (2+)') },
    { value: 'Unknown / Not sure', label: t('womensHealth.relUnknown', 'Unknown / Not sure') },
  ];

  const PRIOR_BIOPSY_OPTIONS = [
    { value: 'No', label: t('common.no', 'No') },
    { value: 'Yes', label: t('common.yes', 'Yes') },
    { value: 'Unknown / Not sure', label: t('womensHealth.biopsyUnknown', 'Unknown / Not sure') },
  ];

  const LAST_MAMMOGRAM_OPTIONS = [
    { value: 'Negative / Normal', label: t('womensHealth.mammoNegative', 'Negative / Normal') },
    { value: 'False positive / Benign finding', label: t('womensHealth.mammoFalsePos', 'False positive / Benign finding') },
    { value: 'Unknown / Never screened', label: t('womensHealth.mammoNever', 'Unknown / Never screened') },
  ];

  const ORAL_CONTRACEPTIVE_OPTIONS = [
    { value: 'Never used birth control pills', label: t('womensHealth.bcNever', 'Never used birth control pills') },
    { value: 'Used in the past (more than 1 year ago)', label: t('womensHealth.bcPast', 'Used in the past (more than 1 year ago)') },
    { value: 'Currently using oral contraceptives', label: t('womensHealth.bcCurrent', 'Currently using oral contraceptives') },
  ];

  const DURATION_YEARS_OPTIONS = [
    { value: 'Less than 1 year (<1 yr)', label: t('womensHealth.durUnder1', 'Less than 1 year (<1 yr)') },
    { value: '1 to 4 years', label: t('womensHealth.dur1to4', '1 to 4 years') },
    { value: '5 to 9 years', label: t('womensHealth.dur5to9', '5 to 9 years') },
    { value: '10 or more years (10+ yrs)', label: t('womensHealth.dur10plus', '10 or more years (10+ yrs)') },
  ];

  const HRT_OPTIONS = [
    { value: 'Never used hormone therapy', label: t('womensHealth.hrtNever', 'Never used hormone therapy') },
    { value: 'Past user of HRT (completed course)', label: t('womensHealth.hrtPast', 'Past user of HRT (completed course)') },
    { value: 'Currently using Hormone Replacement Therapy', label: t('womensHealth.hrtCurrent', 'Currently using Hormone Replacement Therapy') },
  ];

  const IUD_OPTIONS = [
    { value: 'Never used an IUD', label: t('womensHealth.iudNever', 'Never used an IUD') },
    { value: 'Used an IUD in the past', label: t('womensHealth.iudPast', 'Used an IUD in the past') },
    { value: 'Currently using an Intrauterine Device (IUD)', label: t('womensHealth.iudCurrent', 'Currently using an Intrauterine Device (IUD)') },
  ];

  const SEXUAL_PARTNERS_OPTIONS = [
    { value: 'None', label: t('womensHealth.partnerNone', 'None') },
    { value: '1 partner', label: t('womensHealth.partner1', '1 partner') },
    { value: '2 to 3 partners', label: t('womensHealth.partner2to3', '2 to 3 partners') },
    { value: '4 to 5 partners', label: t('womensHealth.partner4to5', '4 to 5 partners') },
    { value: '6 or more partners', label: t('womensHealth.partner6plus', '6 or more partners') },
    { value: 'Prefer not to say', label: t('womensHealth.partnerPreferNotToSay', 'Prefer not to say') },
  ];

  const FIRST_INTERCOURSE_AGE_OPTIONS = [
    { value: 'Under age 16 (<16)', label: t('womensHealth.sexUnder16', 'Under age 16 (<16)') },
    { value: 'Age 16–18 (Age 17)', label: t('womensHealth.sex16to18', 'Age 16–18 (Age 17)') },
    { value: 'Age 19–21', label: t('womensHealth.sex19to21', 'Age 19–21') },
    { value: 'Age 22 or older', label: t('womensHealth.sex22plus', 'Age 22 or older') },
  ];

  const STI_COUNT_OPTIONS = [
    { value: 'None (0)', label: t('womensHealth.sti0', 'None (0)') },
    { value: '1 prior STI diagnosis (1)', label: t('womensHealth.sti1', '1 prior STI diagnosis (1)') },
    { value: '2 or more prior STI diagnoses (2+)', label: t('womensHealth.sti2plus', '2 or more prior STI diagnoses (2+)') },
  ];

  const BREAST_DENSITY_OPTIONS = [
    { value: 'Unknown / Not tested', label: t('womensHealth.densityUnknown', 'Unknown / Not tested') },
    { value: 'Almost entirely fatty tissue (BI-RADS 1)', label: t('womensHealth.densityBirads1', 'Almost entirely fatty tissue (BI-RADS 1)') },
    { value: 'Scattered fibroglandular densities (BI-RADS 2)', label: t('womensHealth.densityBirads2', 'Scattered fibroglandular densities (BI-RADS 2)') },
    { value: 'Heterogeneously dense tissue (BI-RADS 3)', label: t('womensHealth.densityBirads3', 'Heterogeneously dense tissue (BI-RADS 3)') },
    { value: 'Extremely dense tissue (BI-RADS 4)', label: t('womensHealth.densityBirads4', 'Extremely dense tissue (BI-RADS 4)') },
  ];

  // If male, automatically redirect to screening history (only after hydration confirms sex)
  useEffect(() => {
    if (isHydrated && !isFemale) {
      onNavigate('assessment-step-screening');
    }
  }, [isHydrated, isFemale, onNavigate]);

  const [agePeriodsBegan, setAgePeriodsBegan] = useState(
    assessmentState.womenOnly.agePeriodsBegan || assessmentState.womenOnly.firstPeriodAge || ''
  );
  const [menopauseStatus, setMenopauseStatus] = useState(
    assessmentState.womenOnly.menopauseStatus || ''
  );
  const [menopauseAge, setMenopauseAge] = useState(
    assessmentState.womenOnly.menopauseAge || ''
  );
  const [hadSurgicalMenopause, setHadSurgicalMenopause] = useState(
    assessmentState.womenOnly.hadSurgicalMenopause || 'Natural'
  );
  const [pregnancyHistory, setPregnancyHistory] = useState(
    assessmentState.womenOnly.pregnancyHistory || assessmentState.womenOnly.hadChildren || ''
  );
  const [ageAtFirstBirth, setAgeAtFirstBirth] = useState(
    assessmentState.womenOnly.ageAtFirstBirth || '<30'
  );
  const [numRelativesWithBreastCancer, setNumRelativesWithBreastCancer] = useState(
    assessmentState.womenOnly.numRelativesWithBreastCancer || '0 (None)'
  );
  const [hasPriorBreastProcedure, setHasPriorBreastProcedure] = useState(
    assessmentState.womenOnly.hasPriorBreastProcedure || 'No'
  );
  const [lastMammogramResult, setLastMammogramResult] = useState(
    assessmentState.womenOnly.lastMammogramResult || 'Unknown / Never screened'
  );
  const [oralContraceptiveUse, setOralContraceptiveUse] = useState(
    assessmentState.womenOnly.oralContraceptiveUse || ''
  );
  const [oralContraceptiveYears, setOralContraceptiveYears] = useState(
    assessmentState.womenOnly.oralContraceptiveYears || '1 to 4 years'
  );
  const [hormoneReplacementTherapy, setHormoneReplacementTherapy] = useState(
    assessmentState.womenOnly.hormoneReplacementTherapy || assessmentState.womenOnly.usedHormoneTherapy || ''
  );
  const [usedIud, setUsedIud] = useState(
    assessmentState.womenOnly.usedIud || 'No'
  );
  const [iudYears, setIudYears] = useState(
    assessmentState.womenOnly.iudYears || '1 to 4 years'
  );
  const [numSexualPartners, setNumSexualPartners] = useState(
    assessmentState.womenOnly.numSexualPartners &&
    assessmentState.womenOnly.numSexualPartners !== '1 partner (Default)' &&
    assessmentState.womenOnly.numSexualPartners !== 1
      ? String(assessmentState.womenOnly.numSexualPartners)
      : ''
  );
  const [firstIntercourseAge, setFirstIntercourseAge] = useState(
    assessmentState.womenOnly.numSexualPartners === 'None'
      ? ''
      : (assessmentState.womenOnly.firstIntercourseAge ? String(assessmentState.womenOnly.firstIntercourseAge) : 'Age 16–18 (Age 17)')
  );
  const [stdCount, setStdCount] = useState(
    assessmentState.womenOnly.stdCount || 'None (0)'
  );
  const [breastDensity, setBreastDensity] = useState(
    assessmentState.womenOnly.breastDensity || 'Unknown / Not tested'
  );
  const [isHpvPositive, setIsHpvPositive] = useState(
    assessmentState.womenOnly.isHpvPositive === true || assessmentState.womenOnly.isHpvPositive === 'Yes'
      ? 'Yes'
      : assessmentState.womenOnly.isHpvPositive === false || assessmentState.womenOnly.isHpvPositive === 'No'
      ? 'No'
      : 'No'
  );
  const [isScreeningOverdue, setIsScreeningOverdue] = useState(
    assessmentState.womenOnly.isScreeningOverdue === true || assessmentState.womenOnly.isScreeningOverdue === 'Yes'
      ? 'Yes'
      : assessmentState.womenOnly.isScreeningOverdue === false || assessmentState.womenOnly.isScreeningOverdue === 'No'
      ? 'No'
      : 'No'
  );
  const [hasStdHistory, setHasStdHistory] = useState(
    assessmentState.womenOnly.stdCount && assessmentState.womenOnly.stdCount !== 'None (0)' && assessmentState.womenOnly.stdCount !== 0 ? 'Yes' : 'No'
  );
  const [cervicalSmokingYears, setCervicalSmokingYears] = useState(
    assessmentState.womenOnly.cervicalSmokingYears || assessmentState.lifestyle.tobaccoDuration || '0 (Never smoked)'
  );

  // Synchronize local form state with AssessmentContext upon hydration
  useEffect(() => {
    if (isHydrated && assessmentState.womenOnly) {
      setAgePeriodsBegan(assessmentState.womenOnly.agePeriodsBegan || assessmentState.womenOnly.firstPeriodAge || '');
      setMenopauseStatus(assessmentState.womenOnly.menopauseStatus || '');
      setMenopauseAge(assessmentState.womenOnly.menopauseAge || '');
      setHadSurgicalMenopause(assessmentState.womenOnly.hadSurgicalMenopause || 'Natural');
      setPregnancyHistory(assessmentState.womenOnly.pregnancyHistory || assessmentState.womenOnly.hadChildren || '');
      setAgeAtFirstBirth(assessmentState.womenOnly.ageAtFirstBirth || '<30');
      setNumRelativesWithBreastCancer(assessmentState.womenOnly.numRelativesWithBreastCancer || '0 (None)');
      setHasPriorBreastProcedure(assessmentState.womenOnly.hasPriorBreastProcedure || 'No');
      setLastMammogramResult(assessmentState.womenOnly.lastMammogramResult || 'Unknown / Never screened');
      setOralContraceptiveUse(assessmentState.womenOnly.oralContraceptiveUse || '');
      setOralContraceptiveYears(assessmentState.womenOnly.oralContraceptiveYears || '1 to 4 years');
      setHormoneReplacementTherapy(assessmentState.womenOnly.hormoneReplacementTherapy || assessmentState.womenOnly.usedHormoneTherapy || '');
      setUsedIud(assessmentState.womenOnly.usedIud || 'No');
      setIudYears(assessmentState.womenOnly.iudYears || '1 to 4 years');
      setNumSexualPartners(
        assessmentState.womenOnly.numSexualPartners &&
        assessmentState.womenOnly.numSexualPartners !== '1 partner (Default)' &&
        assessmentState.womenOnly.numSexualPartners !== 1
          ? String(assessmentState.womenOnly.numSexualPartners)
          : ''
      );
      setFirstIntercourseAge(
        assessmentState.womenOnly.numSexualPartners === 'None'
          ? ''
          : (assessmentState.womenOnly.firstIntercourseAge ? String(assessmentState.womenOnly.firstIntercourseAge) : 'Age 16–18 (Age 17)')
      );
      setStdCount(assessmentState.womenOnly.stdCount || 'None (0)');
      setBreastDensity(assessmentState.womenOnly.breastDensity || 'Unknown / Not tested');
      setIsHpvPositive(
        assessmentState.womenOnly.isHpvPositive === true || assessmentState.womenOnly.isHpvPositive === 'Yes'
          ? 'Yes'
          : assessmentState.womenOnly.isHpvPositive === false || assessmentState.womenOnly.isHpvPositive === 'No'
          ? 'No'
          : 'No'
      );
      setIsScreeningOverdue(
        assessmentState.womenOnly.isScreeningOverdue === true || assessmentState.womenOnly.isScreeningOverdue === 'Yes'
          ? 'Yes'
          : assessmentState.womenOnly.isScreeningOverdue === false || assessmentState.womenOnly.isScreeningOverdue === 'No'
          ? 'No'
          : 'No'
      );
      setHasStdHistory(
        assessmentState.womenOnly.stdCount && assessmentState.womenOnly.stdCount !== 'None (0)' && assessmentState.womenOnly.stdCount !== 0 ? 'Yes' : 'No'
      );
      setCervicalSmokingYears(
        assessmentState.womenOnly.cervicalSmokingYears || assessmentState.lifestyle.tobaccoDuration || '0 (Never smoked)'
      );
    }
  }, [isHydrated, assessmentState.womenOnly, assessmentState.lifestyle.tobaccoDuration]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!agePeriodsBegan) {
      errs.agePeriodsBegan = 'Please select the age range when your periods began.';
    }
    if (!menopauseStatus) {
      errs.menopauseStatus = 'Please select your menopause status.';
    } else if (menopauseStatus.includes('Post-menopausal') && !menopauseAge) {
      errs.menopauseAge = 'Please specify the age range when menopause occurred.';
    }
    if (!pregnancyHistory) {
      errs.pregnancyHistory = 'Please select your pregnancy history.';
    }
    if (!oralContraceptiveUse) {
      errs.oralContraceptiveUse = 'Please select your hormonal contraceptive use.';
    }
    if (!hormoneReplacementTherapy) {
      errs.hormoneReplacementTherapy = 'Please select your hormone replacement therapy history.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    updateWomenOnly({
      agePeriodsBegan,
      firstPeriodAge: agePeriodsBegan,
      menopauseStatus,
      menopauseAge,
      hadSurgicalMenopause,
      pregnancyHistory,
      ageAtFirstBirth: pregnancyHistory.includes('Never') || pregnancyHistory.includes('0') ? 'Nulliparous' : ageAtFirstBirth,
      numRelativesWithBreastCancer,
      hasPriorBreastProcedure,
      lastMammogramResult,
      hadChildren: pregnancyHistory.includes('Never') || pregnancyHistory.includes('0') ? 'No' : 'Yes',
      oralContraceptiveUse,
      oralContraceptiveYears: oralContraceptiveUse.includes('Never') || oralContraceptiveUse === 'No' ? '0' : oralContraceptiveYears,
      hormoneReplacementTherapy,
      usedHormoneTherapy: hormoneReplacementTherapy.includes('Never') ? 'No' : 'Yes',
      usedIud: usedIud.includes('Never') || usedIud === 'No' ? 'No' : 'Yes',
      iudYears: usedIud.includes('Never') || usedIud === 'No' ? '0' : iudYears,
      numSexualPartners,
      firstIntercourseAge: numSexualPartners === 'None' ? '' : firstIntercourseAge,
      stdCount: hasStdHistory === 'No' ? 'None (0)' : stdCount,
      cervicalSmokingYears,
      isHpvPositive: isHpvPositive === 'Yes',
      isScreeningOverdue: isScreeningOverdue === 'Yes',
      breastDensity,
    });

    onNavigate('assessment-step-screening');
  };

  if (!isFemale) {
    return null;
  }

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
              {t('nav.healthProfile', 'Assessment')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('womensHealth.stepTitle', "Women's Health")}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('assessment-step3')}
          >
            {t('womensHealth.backToMedical', '← Back to Medical & Family History')}
          </button>
        </header>

        <div className="assessment-page-layout-grid">
          <div className="medical-container">
            <div className="medical-form-card">
              <div className="step-progress-banner" aria-label={t('common.assessmentProgress', 'Assessment Progress')}>
                <div className="step-progress-top">
                  <div className="step-progress-label">
                    <span className="step-indicator-pill">{t('womensHealth.stepIndicator', 'Step 4 of 5')}</span>
                    <span className="step-page-title">{t('womensHealth.stepTitle', "Women's Health")}</span>
                  </div>
                  <span className="step-pct-text">80% {t('common.complete', 'Complete')}</span>
                </div>
                <div className="step-progress-bar-track">
                  <div className="step-progress-bar-fill" style={{ width: '80%' }} />
                </div>
              </div>

              <div className="form-header-group">
                <h1 className="form-section-heading">{t('womensHealth.heading', "Women's Health & Reproductive History")}</h1>
                <p className="form-section-subtext">
                  {t('womensHealth.subheading', 'Hormonal milestones, reproductive markers, and HPV immunization history for breast & cervical risk calibration.')}
                </p>
              </div>

              <form onSubmit={handleNext} className="questionnaire-form" noValidate>
                {/* 1. Age Periods Began */}
                <div className={`medical-question-card ${errors.agePeriodsBegan ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.menarcheBadge', 'Menarche Milestone')}</span>
                    <h2 className="question-prompt">{t('womensHealth.menarcheQuestion', 'At what age did your menstrual periods begin?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.menarcheSubPrompt', 'Early menarche influences lifetime estrogen exposure.')}</span>
                  </div>
                  <div className="options-grid-3col" role="radiogroup">
                    {AGE_PERIODS_OPTIONS.map((opt) => {
                      const isSelected = agePeriodsBegan === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setAgePeriodsBegan(opt.value);
                            if (errors.agePeriodsBegan) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.agePeriodsBegan;
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
                  {errors.agePeriodsBegan && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.agePeriodsBegan}</span>
                    </div>
                  )}
                </div>

                {/* 2. Menopause Status & Age */}
                <div className={`medical-question-card ${errors.menopauseStatus || errors.menopauseAge ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.menopauseBadge', 'Menopause Transition')}</span>
                    <h2 className="question-prompt">{t('womensHealth.menopauseQuestion', 'What is your current menopause status?')}</h2>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {MENOPAUSE_STATUS_OPTIONS.map((opt) => {
                      const isSelected = menopauseStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setMenopauseStatus(opt.value);
                            if (!opt.value.includes('Post-menopausal')) {
                              setMenopauseAge('');
                            }
                            if (errors.menopauseStatus) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.menopauseStatus;
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
                          {isSelected && (
                            <div className="option-check-indicator" aria-hidden="true">
                              <CheckIcon size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.menopauseStatus && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.menopauseStatus}</span>
                    </div>
                  )}

                  {/* Conditional Menopause Details */}
                  {menopauseStatus.includes('Post-menopausal') && (
                    <div className="sub-question-section" style={{ marginTop: '16px' }}>
                      <h3 className="sub-section-title">{t('womensHealth.menopauseAgeQuestion', 'At what age did menopause occur?')}</h3>
                      <div className="options-grid-3col" style={{ marginBottom: '16px' }}>
                        {MENOPAUSE_AGE_OPTIONS.map((opt) => {
                          const isSelected = menopauseAge === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setMenopauseAge(opt.value);
                                if (errors.menopauseAge) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.menopauseAge;
                                    return next;
                                  });
                                }
                              }}
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

                      <h3 className="sub-section-title">{t('womensHealth.menopauseTypeTitle', 'Type of Menopause:')}</h3>
                      <div className="options-grid-2col">
                        {[
                          { key: 'Natural', label: t('womensHealth.naturalMeno', 'Natural Menopause'), sub: t('womensHealth.naturalMenoSub', 'Spontaneous cessation of periods') },
                          { key: 'Surgical', label: t('womensHealth.surgicalMeno', 'Surgical Menopause'), sub: t('womensHealth.surgicalMenoSub', 'Oophorectomy or hysterectomy') },
                        ].map((mType) => {
                          const isSelected = hadSurgicalMenopause === mType.key;
                          return (
                            <button
                              key={mType.key}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setHadSurgicalMenopause(mType.key)}
                            >
                              <div className="option-left-content">
                                <div className="option-radio-circle">
                                  {isSelected && <span className="radio-check-dot" />}
                                </div>
                                <div className="option-text-block">
                                  <span className="option-title-text">{mType.label}</span>
                                  <span className="option-sub-text">{mType.sub}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {errors.menopauseAge && (
                        <div className="question-error-banner" role="alert" style={{ marginTop: '10px' }}>
                          <AlertCircleIcon size={15} className="question-error-icon" />
                          <span>{errors.menopauseAge}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Pregnancy History */}
                <div className={`medical-question-card ${errors.pregnancyHistory ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.pregnancyBadge', 'Pregnancy History')}</span>
                    <h2 className="question-prompt">{t('womensHealth.pregnancyQuestion', 'How many times have you been pregnant?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.pregnancySubPrompt', 'Include all pregnancies.')}</span>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {PREGNANCY_OPTIONS.map((opt) => {
                      const isSelected = pregnancyHistory === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setPregnancyHistory(opt.value);
                            if (errors.pregnancyHistory) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.pregnancyHistory;
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
                          {isSelected && (
                            <div className="option-check-indicator" aria-hidden="true">
                              <CheckIcon size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.pregnancyHistory && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.pregnancyHistory}</span>
                    </div>
                  )}

                  {/* Conditional: Age at first birth if gave birth */}
                  {(!pregnancyHistory.includes('Never') && !pregnancyHistory.includes('0')) && (
                    <div className="sub-question-section" style={{ marginTop: '16px' }}>
                      <h3 className="sub-section-title">{t('womensHealth.ageFirstBirthTitle', 'Age at first full-term birth:')}</h3>
                      <div className="options-grid-2col">
                        {AGE_FIRST_BIRTH_OPTIONS.map((opt) => {
                          const isSelected = ageAtFirstBirth === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setAgeAtFirstBirth(opt.value)}
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
                    </div>
                  )}
                </div>

                {/* 4. Oral Contraceptive Use */}
                <div className={`medical-question-card ${errors.oralContraceptiveUse ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.bcBadge', 'Contraceptive History')}</span>
                    <h2 className="question-prompt">{t('womensHealth.bcQuestion', 'For how many years have you used hormonal contraceptives?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.bcSubPrompt', 'Enter the total duration of hormonal contraceptive use.')}</span>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {ORAL_CONTRACEPTIVE_OPTIONS.map((opt) => {
                      const isSelected = oralContraceptiveUse === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setOralContraceptiveUse(opt.value);
                            if (errors.oralContraceptiveUse) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.oralContraceptiveUse;
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
                          {isSelected && (
                            <div className="option-check-indicator" aria-hidden="true">
                              <CheckIcon size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.oralContraceptiveUse && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.oralContraceptiveUse}</span>
                    </div>
                  )}

                  {/* Duration follow-up if used */}
                  {oralContraceptiveUse && !oralContraceptiveUse.includes('Never') && (
                    <div className="sub-question-section" style={{ marginTop: '16px' }}>
                      <h3 className="sub-section-title">{t('womensHealth.bcDurationTitle', 'For how many years have you used hormonal contraceptives?')}</h3>
                      <div className="options-grid-2col">
                        {DURATION_YEARS_OPTIONS.map((opt) => {
                          const isSelected = oralContraceptiveYears === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setOralContraceptiveYears(opt.value)}
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
                    </div>
                  )}
                </div>

                {/* 5. Intrauterine Device (IUD) */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.iudBadge', 'IUD Contraception')}</span>
                    <h2 className="question-prompt">{t('womensHealth.iudQuestion', 'Have you ever used an IUD?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.iudSubPrompt', 'Select Yes if you have used an intrauterine device.')}</span>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {IUD_OPTIONS.map((opt) => {
                      const isSelected = usedIud === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setUsedIud(opt.value)}
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

                  {/* Duration follow-up if used */}
                  {usedIud && !usedIud.includes('Never') && usedIud !== 'No' && (
                    <div className="sub-question-section" style={{ marginTop: '16px' }}>
                      <h3 className="sub-section-title">{t('womensHealth.iudDurationTitle', 'For how many years have you used an IUD?')}</h3>
                      <span className="question-sub-prompt" style={{ display: 'block', marginBottom: '8px' }}>{t('womensHealth.iudDurationSub', 'Enter the total duration of IUD use.')}</span>
                      <div className="options-grid-2col">
                        {DURATION_YEARS_OPTIONS.map((opt) => {
                          const isSelected = iudYears === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setIudYears(opt.value)}
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
                    </div>
                  )}
                </div>

                {/* 6. Hormone Replacement Therapy (HRT) */}
                <div className={`medical-question-card ${errors.hormoneReplacementTherapy ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.hrtBadge', 'Hormone Replacement')}</span>
                    <h2 className="question-prompt">{t('womensHealth.hrtQuestion', 'Hormone Replacement Therapy (HRT) use:')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.hrtSubPrompt', 'Combined estrogen/progestin or estrogen-only therapies.')}</span>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {HRT_OPTIONS.map((opt) => {
                      const isSelected = hormoneReplacementTherapy === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setHormoneReplacementTherapy(opt.value);
                            if (errors.hormoneReplacementTherapy) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.hormoneReplacementTherapy;
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
                          {isSelected && (
                            <div className="option-check-indicator" aria-hidden="true">
                              <CheckIcon size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.hormoneReplacementTherapy && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.hormoneReplacementTherapy}</span>
                    </div>
                  )}
                </div>

                {/* 7. Breast Cancer Family Burden (BCSC) */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.hereditaryBadge', 'Hereditary Breast Risk')}</span>
                    <h2 className="question-prompt">{t('womensHealth.hereditaryQuestion', 'Number of first-degree relatives with breast cancer:')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.hereditarySubPrompt', 'Mother, sister, or daughter diagnosed with breast cancer.')}</span>
                  </div>
                  <div className="options-grid-2col" role="radiogroup">
                    {NUM_RELATIVES_BREAST_OPTIONS.map((opt) => {
                      const isSelected = numRelativesWithBreastCancer === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setNumRelativesWithBreastCancer(opt.value)}
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
                </div>

                {/* 8. Prior Breast Biopsy / Procedure (BCSC) */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.priorProcedureBadge', 'Prior Breast Procedures')}</span>
                    <h2 className="question-prompt">{t('womensHealth.priorProcedureQuestion', 'Have you ever had a prior breast biopsy or procedure?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.priorProcedureSubPrompt', 'Fine needle aspiration, core needle biopsy, or surgical excision.')}</span>
                  </div>
                  <div className="options-grid-3col" role="radiogroup">
                    {PRIOR_BIOPSY_OPTIONS.map((opt) => {
                      const isSelected = hasPriorBreastProcedure === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setHasPriorBreastProcedure(opt.value)}
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
                </div>

                {/* 9. Last Mammogram Result & Breast Density (BCSC) */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.mammoHistoryBadge', 'Mammography History')}</span>
                    <h2 className="question-prompt">{t('womensHealth.mammoHistoryQuestion', 'Result of your most recent mammogram (if screened):')}</h2>
                  </div>
                  <div className="option-cards-stack" role="radiogroup">
                    {LAST_MAMMOGRAM_OPTIONS.map((opt) => {
                      const isSelected = lastMammogramResult === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setLastMammogramResult(opt.value)}
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

                  <div className="sub-question-section" style={{ marginTop: '20px' }}>
                    <h3 className="sub-section-title">{t('womensHealth.densityTitle', 'Mammographic Breast Density (if previously reported):')}</h3>
                    <div className="option-cards-stack" role="radiogroup">
                      {BREAST_DENSITY_OPTIONS.map((opt) => {
                        const isSelected = breastDensity === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setBreastDensity(opt.value)}
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
                  </div>
                </div>

                {/* 10. Cervical Risk Factors (UCI Dataset) */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.cervicalProfileBadge', 'Cervical Health Profile')}</span>
                    <h2 className="question-prompt">{t('womensHealth.cervicalProfileQuestion', 'Sexual health and reproductive history (UCI Risk Factors):')}</h2>
                  </div>

                  <div className="sub-question-section" style={{ marginTop: '12px' }}>
                    <h3 className="sub-section-title">{t('womensHealth.partnersTitle', 'Number of lifetime sexual partners:')}</h3>
                    <div className="options-grid-2col" style={{ marginBottom: '16px' }}>
                      {SEXUAL_PARTNERS_OPTIONS.map((opt) => {
                        const isSelected = numSexualPartners === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => {
                              setNumSexualPartners(opt.value);
                              if (opt.value === 'None') {
                                setFirstIntercourseAge('');
                              }
                            }}
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

                    {numSexualPartners !== 'None' && (
                      <>
                        <h3 className="sub-section-title">{t('womensHealth.firstSexTitle', 'Age at first sexual intercourse:')}</h3>
                        <div className="options-grid-2col" style={{ marginBottom: '16px' }}>
                          {FIRST_INTERCOURSE_AGE_OPTIONS.map((opt) => {
                            const isSelected = firstIntercourseAge === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => setFirstIntercourseAge(opt.value)}
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
                      </>
                    )}

                    <h3 className="sub-section-title">{t('womensHealth.stiHistoryTitle', 'Have you ever had a sexually transmitted infection (STI/STD)?')}</h3>
                    <span className="question-sub-prompt" style={{ display: 'block', marginBottom: '8px' }}>{t('womensHealth.stiHistorySubPrompt', 'Select Yes if you have a history of an STI or STD.')}</span>
                    <div className="options-grid-2col" style={{ marginBottom: '16px' }}>
                      {[
                        { key: 'No', label: t('common.no', 'No') },
                        { key: 'Yes', label: t('common.yes', 'Yes') },
                      ].map((opt) => {
                        const isSelected = hasStdHistory === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setHasStdHistory(opt.key)}
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

                    {hasStdHistory === 'Yes' && (
                      <div style={{ marginBottom: '16px' }}>
                        <h3 className="sub-section-title">{t('womensHealth.stiCountTitle', 'How many sexually transmitted infections have you had?')}</h3>
                        <span className="question-sub-prompt" style={{ display: 'block', marginBottom: '8px' }}>{t('womensHealth.stiCountSubPrompt', 'Enter the number of diagnosed STI/STD infections.')}</span>
                        <div className="options-grid-3col">
                          {STI_COUNT_OPTIONS.map((opt) => {
                            const isSelected = stdCount === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => setStdCount(opt.value)}
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
                      </div>
                    )}

                    <h3 className="sub-section-title">{t('womensHealth.smokingYearsTitle', 'For how many years have you smoked?')}</h3>
                    <span className="question-sub-prompt" style={{ display: 'block', marginBottom: '8px' }}>{t('womensHealth.smokingYearsSubPrompt', 'Enter the total number of years you have smoked.')}</span>
                    <div className="options-grid-2col">
                      {[
                        { key: '0 (Never smoked)', label: t('womensHealth.smoke0', '0 (Never smoked)') },
                        { key: '1 to 4 years', label: t('womensHealth.smoke1to4', '1 to 4 years') },
                        { key: '5 to 9 years', label: t('womensHealth.smoke5to9', '5 to 9 years') },
                        { key: '10 or more years', label: t('womensHealth.smoke10plus', '10 or more years') },
                      ].map((opt) => {
                        const isSelected = cervicalSmokingYears === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setCervicalSmokingYears(opt.key)}
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
                  </div>
                </div>

                {/* 11. HPV & Screening Overdue Status */}
                <div className="medical-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('womensHealth.hpvBadge', 'HPV & Screening Status')}</span>
                    <h2 className="question-prompt">{t('womensHealth.hpvQuestion', 'Have you ever tested positive for HPV?')}</h2>
                    <span className="question-sub-prompt">{t('womensHealth.hpvSubPrompt', 'Select Yes if you have a known positive HPV test result.')}</span>
                  </div>
                  <div className="options-grid-3col" role="radiogroup" style={{ marginBottom: '20px' }}>
                    {[
                      { key: 'No', label: t('common.no', 'No') },
                      { key: 'Yes', label: t('common.yes', 'Yes') },
                      { key: 'Not sure / Never tested', label: t('womensHealth.neverTested', 'Not sure / Never tested') },
                    ].map((opt) => {
                      const isSelected = isHpvPositive === opt.key || (isHpvPositive === 'Yes' && opt.key === 'Yes') || (isHpvPositive === 'No' && opt.key === 'No');
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setIsHpvPositive(opt.key)}
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

                  <div className="sub-question-section">
                    <h3 className="sub-section-title">{t('womensHealth.overdueTitle', 'Is your cervical cancer screening overdue?')}</h3>
                    <span className="question-sub-prompt" style={{ display: 'block', marginBottom: '8px' }}>{t('womensHealth.overdueSubPrompt', 'Your recommended Pap smear or HPV screening has not been completed within the recommended interval.')}</span>
                    <div className="options-grid-3col" role="radiogroup">
                      {[
                        { key: 'No', label: t('common.no', 'No') },
                        { key: 'Yes', label: t('common.yes', 'Yes') },
                        { key: 'Not sure / Never screened', label: t('womensHealth.neverScreened', 'Not sure / Never screened') },
                      ].map((opt) => {
                        const isSelected = isScreeningOverdue === opt.key || (isScreeningOverdue === 'Yes' && opt.key === 'Yes') || (isScreeningOverdue === 'No' && opt.key === 'No');
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setIsScreeningOverdue(opt.key)}
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
                  </div>
                </div>

                <div className="form-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav-back"
                    onClick={() => onNavigate('assessment-step3')}
                  >
                    {t('common.back', '← Back')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                  >
                    <span>{t('womensHealth.continueToScreening', 'Continue to Screening History →')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <AssessmentSidePanel
            currentStep={4}
            totalSteps={5}
            isFemale={true}
          />
        </div>
      </main>

      <MobileBottomNav activeItem="health-profile" onNavigate={onNavigate} />
    </div>
  );
};

export default WomenOnlySectionPage;

