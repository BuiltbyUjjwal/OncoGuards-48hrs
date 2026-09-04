import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { AssessmentSidePanel } from './components/AssessmentSidePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import {
  AlertCircleIcon,
  CheckIcon,
} from './assets/MedicalIcons';
import './styles/LifestyleSectionPage.css';

interface LifestyleSectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface LifestyleFormState {
  tobaccoUse: string;
  tobaccoDuration: string;
  isCurrentSmoker: boolean | string;
  usesSmokelessTobacco: boolean | string;
  alcoholConsumption: string;
  isAlcoholConsuming: boolean | string;
  hasOccupationalExposure: string;
  airPollutionExposure: string;
  dustAllergySeverity: string;
  dietDescription: string;
  physicalActivityLevel: string;
  overweightStatus: string;
}

export const LifestyleSectionPage: React.FC<LifestyleSectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, updateLifestyle, isFemale } = useAssessment();

  const TOBACCO_OPTIONS = [
    { value: 'never', label: t('lifestyle.tobaccoNever', 'Never'), subtext: t('lifestyle.tobaccoNeverSub', 'I do not use any tobacco') },
    { value: 'cigarette', label: t('lifestyle.tobaccoCigarette', 'Cigarettes'), subtext: t('lifestyle.tobaccoCigaretteSub', 'Commercial filtered/unfiltered cigarettes') },
    { value: 'bidi', label: t('lifestyle.tobaccoBidi', 'Bidis'), subtext: t('lifestyle.tobaccoBidiSub', 'Traditional hand-rolled tobacco') },
    { value: 'smokeless', label: t('lifestyle.tobaccoSmokeless', 'Smokeless Tobacco'), subtext: t('lifestyle.tobaccoSmokelessSub', 'Chewing tobacco, gutkha, khaini, betel quid') },
    { value: 'multiple types', label: t('lifestyle.tobaccoMultiple', 'Multiple Types'), subtext: t('lifestyle.tobaccoMultipleSub', 'Combination of smoking and chewing') },
  ];

  const TOBACCO_DURATION_OPTIONS = [
    { value: 'Less than 1 year', label: t('lifestyle.durationLess1', 'Less than 1 year') },
    { value: '1 to 5 years', label: t('lifestyle.duration1to5', '1–5 years') },
    { value: '5 to 10 years', label: t('lifestyle.duration5to10', '5–10 years') },
    { value: 'More than 10 years', label: t('lifestyle.durationMore10', 'More than 10 years') },
  ];

  const ALCOHOL_OPTIONS = [
    { value: 'Never', label: t('lifestyle.alcoholNever', 'Never'), subtext: t('lifestyle.alcoholNeverSub', 'No alcohol consumption') },
    { value: 'Occasionally', label: t('lifestyle.alcoholOccasional', 'Occasionally'), subtext: t('lifestyle.alcoholOccasionalSub', 'Socially or 1–2 times a month') },
    { value: 'Regularly — more than 3 times a week', label: t('lifestyle.alcoholRegular', 'Regularly'), subtext: t('lifestyle.alcoholRegularSub', 'More than 3 times a week') },
  ];

  const AIR_POLLUTION_OPTIONS = [
    { value: 'Low — Mostly clean air / rarely exposed', label: t('lifestyle.airLow', 'Low — Mostly clean air / rarely exposed') },
    { value: 'Moderate — Occasional exposure to traffic, smoke, or polluted areas', label: t('lifestyle.airModerate', 'Moderate — Occasional exposure to traffic, smoke, or polluted areas') },
    { value: 'High — Frequent exposure to heavy traffic, industrial areas, or severe air pollution', label: t('lifestyle.airHigh', 'High — Frequent exposure to heavy traffic, industrial areas, or severe air pollution') },
  ];

  const DUST_ALLERGY_OPTIONS = [
    { value: 'None / Very mild', label: t('lifestyle.dustNone', 'None / Very mild') },
    { value: 'Mild', label: t('lifestyle.dustMild', 'Mild') },
    { value: 'Moderate', label: t('lifestyle.dustModerate', 'Moderate') },
    { value: 'Severe / Frequent', label: t('lifestyle.dustSevere', 'Severe / Frequent') },
  ];

  const DIET_OPTIONS = [
    { value: 'Mostly home-cooked', label: t('lifestyle.dietHome', 'Mostly Home-Cooked'), subtext: t('lifestyle.dietHomeSub', 'Fresh ingredients, low preservatives') },
    { value: 'Lots of processed/packaged food', label: t('lifestyle.dietProcessed', 'Processed / Fast Food'), subtext: t('lifestyle.dietProcessedSub', 'Packaged snacks, fried items') },
    { value: 'High red meat consumption', label: t('lifestyle.dietRedMeat', 'High Red Meat'), subtext: t('lifestyle.dietRedMeatSub', 'Frequent beef, pork, or mutton') },
    { value: 'Balanced', label: t('lifestyle.dietBalanced', 'Balanced & Nutritious'), subtext: t('lifestyle.dietBalancedSub', 'High fiber, vegetables, whole grains') },
  ];

  const ACTIVITY_OPTIONS = [
    { value: 'Sedentary — desk job no exercise', label: t('lifestyle.activitySedentary', 'Sedentary'), subtext: t('lifestyle.activitySedentarySub', 'Desk job, minimal physical activity') },
    { value: 'Light — walking occasionally', label: t('lifestyle.activityLight', 'Light Activity'), subtext: t('lifestyle.activityLightSub', 'Occasional walking or light movement') },
    { value: 'Moderate — 3 to 4 times a week', label: t('lifestyle.activityModerate', 'Moderate Exercise'), subtext: t('lifestyle.activityModerateSub', '3 to 4 days of cardio / gym weekly') },
    { value: 'Active — daily exercise', label: t('lifestyle.activityActive', 'Active'), subtext: t('lifestyle.activityActiveSub', 'Daily workouts or intense physical labor') },
  ];

  const OVERWEIGHT_OPTIONS = [
    { value: 'No', label: t('common.no', 'No'), subtext: t('lifestyle.overweightNoSub', 'Within healthy BMI range') },
    { value: 'Yes', label: t('common.yes', 'Yes'), subtext: t('lifestyle.overweightYesSub', 'Above recommended body weight') },
    { value: 'Not sure', label: t('lifestyle.notSure', 'Not Sure'), subtext: t('lifestyle.overweightNotSureSub', 'Have not checked recently') },
  ];

  const [lifestyleData, setLifestyleData] = useState<LifestyleFormState>({
    tobaccoUse: assessmentState.lifestyle.tobaccoUse || '',
    tobaccoDuration: assessmentState.lifestyle.tobaccoDuration || '',
    isCurrentSmoker: assessmentState.lifestyle.isCurrentSmoker ?? '',
    usesSmokelessTobacco: assessmentState.lifestyle.usesSmokelessTobacco ?? '',
    alcoholConsumption: assessmentState.lifestyle.alcoholConsumption || '',
    isAlcoholConsuming: assessmentState.lifestyle.isAlcoholConsuming ?? '',
    hasOccupationalExposure:
      typeof assessmentState.lifestyle.hasOccupationalExposure === 'boolean'
        ? assessmentState.lifestyle.hasOccupationalExposure ? 'Yes' : 'No'
        : (assessmentState.lifestyle.hasOccupationalExposure as string) || 'No',
    airPollutionExposure: assessmentState.lifestyle.airPollutionExposure || '',
    dustAllergySeverity: assessmentState.lifestyle.dustAllergySeverity || '',
    dietDescription: assessmentState.lifestyle.dietDescription || '',
    physicalActivityLevel: assessmentState.lifestyle.physicalActivityLevel || '',
    overweightStatus: assessmentState.lifestyle.overweightStatus || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const handleSelectOption = (field: keyof LifestyleFormState, value: any) => {
    setLifestyleData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'tobaccoUse') {
        const valLower = String(value).toLowerCase();
        if (valLower === 'never') {
          updated.tobaccoDuration = '';
          updated.isCurrentSmoker = false;
          updated.usesSmokelessTobacco = false;
        } else if (valLower === 'cigarette' || valLower === 'bidi') {
          updated.isCurrentSmoker = true;
          updated.usesSmokelessTobacco = false;
        } else if (valLower === 'smokeless') {
          updated.isCurrentSmoker = false;
          updated.usesSmokelessTobacco = true;
        } else if (valLower === 'multiple types' || valLower.includes('multiple')) {
          updated.isCurrentSmoker = true;
          updated.usesSmokelessTobacco = true;
        }
      }

      if (field === 'alcoholConsumption') {
        updated.isAlcoholConsuming = value !== 'Never';
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const tobaccoLower = (lifestyleData.tobaccoUse || '').toLowerCase();
    if (!lifestyleData.tobaccoUse) {
      newErrors.tobaccoUse = 'Please select your tobacco use status.';
    } else if (tobaccoLower !== 'never' && !lifestyleData.tobaccoDuration) {
      newErrors.tobaccoDuration = 'Please specify how long you have used tobacco.';
    }
    if (!lifestyleData.alcoholConsumption) {
      newErrors.alcoholConsumption = 'Please select your alcohol consumption level.';
    }
    if (!lifestyleData.hasOccupationalExposure) {
      newErrors.hasOccupationalExposure = 'Please select Yes or No for occupational exposure.';
    }
    if (!lifestyleData.dietDescription) {
      newErrors.dietDescription = 'Please select a diet description.';
    }
    if (!lifestyleData.physicalActivityLevel) {
      newErrors.physicalActivityLevel = 'Please select your physical activity level.';
    }
    if (!lifestyleData.overweightStatus) {
      newErrors.overweightStatus = 'Please select an option for weight status.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const valLower = (lifestyleData.tobaccoUse || '').toLowerCase();
    const isSmoker = Boolean(
      lifestyleData.isCurrentSmoker === true ||
      valLower === 'cigarette' ||
      valLower === 'bidi' ||
      valLower.includes('multiple')
    );

    const isChewer = Boolean(
      lifestyleData.usesSmokelessTobacco === true ||
      valLower === 'smokeless' ||
      valLower.includes('multiple')
    );

    const isAlcohol = Boolean(
      lifestyleData.isAlcoholConsuming === true ||
      (lifestyleData.alcoholConsumption && lifestyleData.alcoholConsumption !== 'Never')
    );

    updateLifestyle({
      tobaccoUse: lifestyleData.tobaccoUse,
      tobaccoDuration: lifestyleData.tobaccoDuration,
      isCurrentSmoker: isSmoker,
      usesSmokelessTobacco: isChewer,
      isAlcoholConsuming: isAlcohol,
      alcoholConsumption: lifestyleData.alcoholConsumption,
      hasOccupationalExposure: lifestyleData.hasOccupationalExposure === 'Yes',
      airPollutionExposure: lifestyleData.airPollutionExposure,
      dustAllergySeverity: lifestyleData.dustAllergySeverity,
      dietDescription: lifestyleData.dietDescription,
      physicalActivityLevel: lifestyleData.physicalActivityLevel,
      overweightStatus: lifestyleData.overweightStatus,
    });

    onNavigate('assessment-step3');
  };

  const showDurationQuestion =
    lifestyleData.tobaccoUse && lifestyleData.tobaccoUse.toLowerCase() !== 'never';

  return (
    <div className="lifestyle-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      {/* Main Content Area */}
      <main className="lifestyle-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="lifestyle-top-header">
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
              {t('nav.healthProfile', 'Health Profile')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{t('lifestyle.stepTitle', 'Lifestyle')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('assessment-step1')}
          >
            {t('lifestyle.backToBasicInfo', '← Back to Basic Information')}
          </button>
        </header>

        {/* Assessment Grid Wrapper with Right Context Panel */}
        <div className="assessment-page-layout-grid">
          <div className="lifestyle-container">
            <div className="lifestyle-form-card">
              {/* Step Progress Banner */}
              <div className="step-progress-banner" aria-label={t('common.assessmentProgress', 'Assessment Progress')}>
                <div className="step-progress-top">
                  <div className="step-progress-label">
                    <span className="step-indicator-pill">{t('lifestyle.stepIndicator', `Step 2 of ${isFemale ? 5 : 4}`)}</span>
                    <span className="step-page-title">{t('lifestyle.stepTitle', 'Lifestyle')}</span>
                  </div>
                  <span className="step-pct-text">{isFemale ? '40%' : '50%'} {t('common.complete', 'Complete')}</span>
                </div>
                <div className="step-progress-bar-track">
                  <div
                    className="step-progress-bar-fill"
                    style={{ width: isFemale ? '40%' : '50%' }}
                  />
                </div>
              </div>

              {/* Header */}
              <div className="form-header-group">
                <h1 className="form-section-heading">{t('lifestyle.heading', 'Lifestyle & Environmental Factors')}</h1>
                <p className="form-section-subtext">
                  {t('lifestyle.subheading', 'Tobacco exposure, alcohol habits, occupational environment, and lifestyle markers for oncologic stratification.')}
                </p>
              </div>

              <form onSubmit={handleNext} className="questionnaire-form" noValidate>
                {/* QUESTION 1: Tobacco Use (Smoking & Smokeless) */}
                <div className={`lifestyle-question-card ${errors.tobaccoUse ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.tobaccoBadge', 'Tobacco Exposure')}</span>
                    <h2 className="question-prompt">{t('lifestyle.tobaccoQuestion', 'Do you currently use tobacco products?')}</h2>
                    <span className="question-sub-prompt">
                      {t('lifestyle.tobaccoSubPrompt', 'Includes combustible smoking (cigarettes, bidis) and smokeless forms (gutkha, khaini, betel quid).')}
                    </span>
                  </div>

                  <div className="option-cards-stack" role="radiogroup">
                    {TOBACCO_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.tobaccoUse === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('tobaccoUse', opt.value)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className="option-radio-circle">
                              {isSelected && <span className="radio-check-dot" />}
                            </div>
                            <div className="option-text-block">
                              <span className="option-title-text">{opt.label}</span>
                              <span className="option-sub-text">{opt.subtext}</span>
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

                  {errors.tobaccoUse && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.tobaccoUse}</span>
                    </div>
                  )}
                </div>

                {/* Tobacco Duration (Conditional) */}
                {showDurationQuestion && (
                  <div
                    className={`lifestyle-question-card conditional-active ${
                      errors.tobaccoDuration ? 'has-error' : ''
                    }`}
                  >
                    <div className="question-card-header">
                      <span className="question-number-badge">{t('lifestyle.followUpBadge', 'Follow-up')}</span>
                      <h2 className="question-prompt">{t('lifestyle.durationQuestion', 'How long have you used tobacco?')}</h2>
                      <span className="question-sub-prompt">{t('lifestyle.durationSubPrompt', 'Cumulative duration helps calculate pack-year and mucosal exposure.')}</span>
                    </div>

                    <div className="option-cards-grid-2" role="radiogroup">
                      {TOBACCO_DURATION_OPTIONS.map((opt) => {
                        const isSelected = lifestyleData.tobaccoDuration === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => handleSelectOption('tobaccoDuration', opt.value)}
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

                    {errors.tobaccoDuration && (
                      <div className="question-error-banner" role="alert">
                        <AlertCircleIcon size={15} className="question-error-icon" />
                        <span>{errors.tobaccoDuration}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* QUESTION 2: Alcohol Consumption */}
                <div className={`lifestyle-question-card ${errors.alcoholConsumption ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.alcoholBadge', 'Alcohol Intake')}</span>
                    <h2 className="question-prompt">{t('lifestyle.alcoholQuestion', 'Do you consume alcohol?')}</h2>
                    <span className="question-sub-prompt">{t('lifestyle.alcoholSubPrompt', 'Select your average frequency of alcohol intake.')}</span>
                  </div>

                  <div className="option-cards-stack" role="radiogroup">
                    {ALCOHOL_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.alcoholConsumption === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('alcoholConsumption', opt.value)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className="option-radio-circle">
                              {isSelected && <span className="radio-check-dot" />}
                            </div>
                            <div className="option-text-block">
                              <span className="option-title-text">{opt.label}</span>
                              <span className="option-sub-text">{opt.subtext}</span>
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

                  {errors.alcoholConsumption && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.alcoholConsumption}</span>
                    </div>
                  )}
                </div>

                {/* QUESTION 3: Occupational Exposure */}
                <div className={`lifestyle-question-card ${errors.hasOccupationalExposure ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.occupationalBadge', 'Occupational Exposure')}</span>
                    <h2 className="question-prompt">
                      {t('lifestyle.occupationalQuestion', 'Do you have regular occupational exposure to hazardous substances?')}
                    </h2>
                    <span className="question-sub-prompt">
                      {t('lifestyle.occupationalSubPrompt', 'Such as asbestos, silica, radon, industrial chemical fumes, coal dust, or heavy metals.')}
                    </span>
                  </div>

                  <div className="yes-no-binary-grid" role="radiogroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { key: 'No', label: t('common.no', 'No') },
                      { key: 'Yes', label: t('common.yes', 'Yes') },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`selectable-option-card ${lifestyleData.hasOccupationalExposure === opt.key ? 'is-selected' : ''}`}
                        onClick={() => handleSelectOption('hasOccupationalExposure', opt.key)}
                        role="radio"
                        aria-checked={lifestyleData.hasOccupationalExposure === opt.key}
                      >
                        <div className="option-left-content">
                          <div className="option-radio-circle">
                            {lifestyleData.hasOccupationalExposure === opt.key && <span className="radio-check-dot" />}
                          </div>
                          <span className="option-title-text">{opt.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {errors.hasOccupationalExposure && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.hasOccupationalExposure}</span>
                    </div>
                  )}
                </div>

                {/* Air Pollution Exposure */}
                <div className="lifestyle-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.airBadge', 'Air Pollution Exposure')}</span>
                    <h2 className="question-prompt">{t('lifestyle.airQuestion', 'How would you describe your exposure to air pollution?')}</h2>
                  </div>

                  <div className="option-cards-stack" role="radiogroup">
                    {AIR_POLLUTION_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.airPollutionExposure === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('airPollutionExposure', opt.value)}
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
                </div>

                {/* Dust Allergy & Sensitivity */}
                <div className="lifestyle-question-card">
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.dustBadge', 'Dust Sensitivity')}</span>
                    <h2 className="question-prompt">{t('lifestyle.dustQuestion', 'How often do you experience allergies or breathing problems from dust?')}</h2>
                  </div>

                  <div className="options-grid-2col" role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {DUST_ALLERGY_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.dustAllergySeverity === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('dustAllergySeverity', opt.value)}
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
                </div>

                {/* QUESTION 4: Diet Pattern */}
                <div className={`lifestyle-question-card ${errors.dietDescription ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.dietBadge', 'Dietary Pattern')}</span>
                    <h2 className="question-prompt">{t('lifestyle.dietQuestion', 'How would you describe your dietary pattern?')}</h2>
                    <span className="question-sub-prompt">{t('lifestyle.dietSubPrompt', 'Nutritional balance influences cellular health and metabolic markers.')}</span>
                  </div>

                  <div className="option-cards-grid-2" role="radiogroup">
                    {DIET_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.dietDescription === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('dietDescription', opt.value)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className="option-radio-circle">
                              {isSelected && <span className="radio-check-dot" />}
                            </div>
                            <div className="option-text-block">
                              <span className="option-title-text">{opt.label}</span>
                              <span className="option-sub-text">{opt.subtext}</span>
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

                  {errors.dietDescription && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.dietDescription}</span>
                    </div>
                  )}
                </div>

                {/* QUESTION 6: Physical Activity */}
                <div className={`lifestyle-question-card ${errors.physicalActivityLevel ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.activityBadge', 'Physical Activity')}</span>
                    <h2 className="question-prompt">{t('lifestyle.activityQuestion', 'Physical activity level')}</h2>
                    <span className="question-sub-prompt">{t('lifestyle.activitySubPrompt', 'Regular aerobic exercise helps mitigate cancer risk factors.')}</span>
                  </div>

                  <div className="option-cards-grid-2" role="radiogroup">
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.physicalActivityLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`selectable-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('physicalActivityLevel', opt.value)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="option-left-content">
                            <div className="option-radio-circle">
                              {isSelected && <span className="radio-check-dot" />}
                            </div>
                            <div className="option-text-block">
                              <span className="option-title-text">{opt.label}</span>
                              <span className="option-sub-text">{opt.subtext}</span>
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

                  {errors.physicalActivityLevel && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.physicalActivityLevel}</span>
                    </div>
                  )}
                </div>

                {/* QUESTION 7: Overweight / Obesity */}
                <div className={`lifestyle-question-card ${errors.overweightStatus ? 'has-error' : ''}`}>
                  <div className="question-card-header">
                    <span className="question-number-badge">{t('lifestyle.overweightBadge', 'Weight Baseline')}</span>
                    <h2 className="question-prompt">{t('lifestyle.overweightQuestion', 'Do you consider yourself overweight or obese?')}</h2>
                    <span className="question-sub-prompt">{t('lifestyle.overweightSubPrompt', 'Select the option that best reflects your current status.')}</span>
                  </div>

                  <div className="large-buttons-row" role="radiogroup">
                    {OVERWEIGHT_OPTIONS.map((opt) => {
                      const isSelected = lifestyleData.overweightStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`large-choice-btn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption('overweightStatus', opt.value)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <span>{opt.label}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'inherit', opacity: 0.85 }}>
                            {opt.subtext}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errors.overweightStatus && (
                    <div className="question-error-banner" role="alert">
                      <AlertCircleIcon size={15} className="question-error-icon" />
                      <span>{errors.overweightStatus}</span>
                    </div>
                  )}
                </div>

                {/* Form Actions Footer */}
                <div className="lifestyle-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav-back"
                    onClick={() => onNavigate('assessment-step1')}
                  >
                    {t('common.back', '← Back')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                  >
                    <span>{t('lifestyle.continueToMedical', 'Continue to Medical History →')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Desktop Contextual Progress Sidebar */}
          <AssessmentSidePanel
            currentStep={2}
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

export default LifestyleSectionPage;
