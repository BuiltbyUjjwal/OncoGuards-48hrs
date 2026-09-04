import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { AssessmentSidePanel } from './components/AssessmentSidePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { BiologicalSex } from './types/assessment';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  UserIcon,
} from './assets/MedicalIcons';
import './styles/BasicInfoSectionPage.css';

interface BasicInfoSectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface FormErrors {
  fullName?: string;
  age?: string;
  biologicalSex?: string;
  city?: string;
  state?: string;
}

export const INDIA_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const BasicInfoSectionPage: React.FC<BasicInfoSectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, updateBasicInfo } = useAssessment();
  const [formData, setFormData] = useState({
    fullName: assessmentState.basicInfo.fullName || '',
    age: assessmentState.basicInfo.age || '',
    biologicalSex:
      assessmentState.basicInfo.biological_sex ||
      (assessmentState.basicInfo.biologicalSex
        ? (assessmentState.basicInfo.biologicalSex.toLowerCase() as BiologicalSex)
        : ('' as BiologicalSex | '')),
    city: assessmentState.basicInfo.city || '',
    state: assessmentState.basicInfo.state || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Searchable State Dropdown state
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isStateDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isStateDropdownOpen]);

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  // Validation functions
  const validateFullName = (val: string): string | undefined => {
    if (!val.trim()) return t('basicInfo.nameRequired', 'Full name is required.');
    if (val.trim().length < 2) return t('basicInfo.nameTooShort', 'Please enter your full name.');
    return undefined;
  };

  const validateAge = (val: string): string | undefined => {
    if (!val.trim()) return t('basicInfo.ageRequired', 'Age is required.');
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 125) {
      return t('basicInfo.ageInvalid', 'Please enter a valid age between 1 and 125.');
    }
    return undefined;
  };

  const validateBiologicalSex = (val: string): string | undefined => {
    if (!val) return t('basicInfo.sexRequired', 'Please select your biological sex.');
    return undefined;
  };

  const validateCity = (val: string): string | undefined => {
    if (!val.trim()) return t('basicInfo.cityRequired', 'City is required.');
    return undefined;
  };

  const validateState = (val: string): string | undefined => {
    if (!val.trim()) return t('basicInfo.stateRequired', 'Please select your State or Union Territory.');
    return undefined;
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'fullName') {
      setErrors((prev) => ({ ...prev, fullName: validateFullName(formData.fullName) }));
    } else if (field === 'age') {
      setErrors((prev) => ({ ...prev, age: validateAge(formData.age) }));
    } else if (field === 'biologicalSex') {
      setErrors((prev) => ({ ...prev, biologicalSex: validateBiologicalSex(formData.biologicalSex) }));
    } else if (field === 'city') {
      setErrors((prev) => ({ ...prev, city: validateCity(formData.city) }));
    } else if (field === 'state') {
      setErrors((prev) => ({ ...prev, state: validateState(formData.state) }));
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field] || errors[field as keyof FormErrors]) {
      if (field === 'fullName') {
        setErrors((prev) => ({ ...prev, fullName: validateFullName(value) }));
      } else if (field === 'age') {
        setErrors((prev) => ({ ...prev, age: validateAge(value) }));
      } else if (field === 'biologicalSex') {
        setErrors((prev) => ({ ...prev, biologicalSex: validateBiologicalSex(value) }));
      } else if (field === 'city') {
        setErrors((prev) => ({ ...prev, city: validateCity(value) }));
      } else if (field === 'state') {
        setErrors((prev) => ({ ...prev, state: validateState(value) }));
      }
    }
  };

  const handleSelectState = (stateName: string) => {
    handleChange('state', stateName);
    setIsStateDropdownOpen(false);
    setStateSearchQuery('');
  };

  const filteredStates = INDIA_STATES_AND_UTS.filter((s) =>
    s.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateFullName(formData.fullName);
    const ageErr = validateAge(formData.age);
    const sexErr = validateBiologicalSex(formData.biologicalSex);
    const cityErr = validateCity(formData.city);
    const stateErr = validateState(formData.state);

    setTouched({
      fullName: true,
      age: true,
      biologicalSex: true,
      city: true,
      state: true,
    });

    if (nameErr || ageErr || sexErr || cityErr || stateErr) {
      setErrors({
        fullName: nameErr,
        age: ageErr,
        biologicalSex: sexErr,
        city: cityErr,
        state: stateErr,
      });
      return;
    }

    setErrors({});

    const normalizedSex = formData.biologicalSex.toLowerCase() as 'male' | 'female' | 'other';

    // Save to shared state with biological_sex
    updateBasicInfo({
      fullName: formData.fullName.trim(),
      age: formData.age.trim(),
      biologicalSex: normalizedSex,
      biological_sex: normalizedSex,
      city: formData.city.trim(),
      state: formData.state.trim(),
    });

    // Navigate to Step 2: Lifestyle
    onNavigate('assessment-step2');
  };

  const isFemaleSelected = formData.biologicalSex.toLowerCase() === 'female';

  return (
    <div className="section-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="health-profile"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={1}
      />

      {/* Main Content Area */}
      <main className="section-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="section-top-header">
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
            <span className="breadcrumb-current">{t('basicInfo.stepTitle', 'Basic Information')}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('health-profile')}
          >
            {t('common.backToOverview', '← Back to Overview')}
          </button>
        </header>

        {/* Assessment Grid Wrapper with Right Context Panel */}
        <div className="assessment-page-layout-grid">
          {/* Main Form Container */}
          <div className="section-container">
            <div className="section-form-card">
              {/* Step Indicator & Progress Bar */}
              <div className="step-progress-banner" aria-label={t('common.assessmentProgress', 'Assessment Progress')}>
                <div className="step-progress-top">
                  <div className="step-progress-label">
                    <span className="step-indicator-pill">{t('basicInfo.stepIndicator', `Step 1 of ${isFemaleSelected ? 5 : 4}`)}</span>
                    <span className="step-page-title">{t('basicInfo.stepTitle', 'Basic Information')}</span>
                  </div>
                  <span className="step-pct-text">{isFemaleSelected ? '20%' : '25%'} {t('common.complete', 'Complete')}</span>
                </div>
                <div className="step-progress-bar-track">
                  <div
                    className="step-progress-bar-fill"
                    style={{ width: isFemaleSelected ? '20%' : '25%' }}
                  />
                </div>
              </div>

              {/* Section Heading & Subtext */}
              <div className="form-header-group">
                <h1 className="form-section-heading">{t('basicInfo.tellUsAboutYourself', 'Tell Us About Yourself')}</h1>
                <p className="form-section-subtext">
                  {t('basicInfo.demographicBaseline', 'Your demographic and biological baseline helps calibrate standard clinical screening guidelines.')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleNext} className="questionnaire-form" noValidate>
                {/* 2-Column Row: Full Name & Age */}
                <div className="form-2col-row">
                  {/* Field 1: Full Name */}
                  <div className="form-field-group">
                    <label htmlFor="field-fullname" className="field-label">
                      {t('basicInfo.fullName', 'Full Name')} <span className="required-star">*</span>
                    </label>
                    <div className={`input-field-wrapper ${errors.fullName ? 'input-field-error' : ''}`}>
                      <span className="field-icon-box" aria-hidden="true">
                        <UserIcon size={18} />
                      </span>
                      <input
                        id="field-fullname"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        placeholder={t('basicInfo.enterFullName', 'Enter your full name')}
                        autoComplete="name"
                        required
                        aria-required="true"
                        aria-invalid={errors.fullName ? 'true' : 'false'}
                        aria-describedby={errors.fullName ? 'fullname-error-msg' : undefined}
                        className="text-input-control"
                      />
                    </div>
                    {errors.fullName && (
                      <div id="fullname-error-msg" className="field-inline-error" role="alert">
                        <AlertCircleIcon size={14} className="error-icon" />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Field 2: Age */}
                  <div className="form-field-group">
                    <label htmlFor="field-age" className="field-label">
                      {t('basicInfo.age', 'Age')} <span className="required-star">*</span>
                    </label>
                    <div className={`input-field-wrapper ${errors.age ? 'input-field-error' : ''}`}>
                      <input
                        id="field-age"
                        type="number"
                        name="age"
                        min="1"
                        max="125"
                        value={formData.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        onBlur={() => handleBlur('age')}
                        placeholder="e.g. 42"
                        required
                        aria-required="true"
                        aria-invalid={errors.age ? 'true' : 'false'}
                        aria-describedby={errors.age ? 'age-error-msg' : undefined}
                        className="text-input-control"
                      />
                      <span className="field-unit-text">{t('basicInfo.years', 'years')}</span>
                    </div>
                    {errors.age && (
                      <div id="age-error-msg" className="field-inline-error" role="alert">
                        <AlertCircleIcon size={14} className="error-icon" />
                        <span>{errors.age}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Field 3: Biological Sex (Clickable Selectable Options) */}
                <div className="form-field-group">
                  <label className="field-label">
                    {t('basicInfo.biologicalSex', 'Biological Sex')} <span className="required-star">*</span>
                  </label>
                  <p className="field-helper-note">
                    {t('basicInfo.sexHelperNote', 'Used strictly for organ-specific cancer screening models (e.g. breast, ovarian, cervical, prostate).')}
                  </p>
                  <div className="radio-options-group" role="radiogroup" aria-required="true">
                    {[
                      { key: 'male', label: t('basicInfo.sexMale', 'Male') },
                      { key: 'female', label: t('basicInfo.sexFemale', 'Female') },
                      { key: 'other', label: t('basicInfo.sexOther', 'Other') },
                    ].map((option) => {
                      const isSelected = formData.biologicalSex.toLowerCase() === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          className={`radio-card-button ${isSelected ? 'selected' : ''} ${
                            errors.biologicalSex ? 'error' : ''
                          }`}
                          onClick={() => handleChange('biologicalSex', option.key)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className={`custom-radio-circle ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <span className="radio-inner-dot" />}
                          </div>
                          <span className="radio-label-text">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.biologicalSex && (
                    <div className="field-inline-error" role="alert">
                      <AlertCircleIcon size={14} className="error-icon" />
                      <span>{errors.biologicalSex}</span>
                    </div>
                  )}
                  {isFemaleSelected && (
                    <div className="branching-hint-box" role="status">
                      <CheckCircleIcon size={15} className="hint-icon" />
                      <span>{t('basicInfo.femaleHint', "Women's Health screening questions will be included in your profile.")}</span>
                    </div>
                  )}
                  {formData.biologicalSex.toLowerCase() === 'male' && (
                    <div className="branching-hint-box hint-neutral" role="status">
                      <CheckCircleIcon size={15} className="hint-icon" />
                      <span>{t('basicInfo.maleHint', "Women's Health module will automatically be skipped for male users.")}</span>
                    </div>
                  )}
                </div>

                {/* 2-Column Row: City & State */}
                <div className="form-2col-row">
                  {/* Field 4: City */}
                  <div className="form-field-group">
                    <label htmlFor="field-city" className="field-label">
                      {t('basicInfo.city', 'City')} <span className="required-star">*</span>
                    </label>
                    <div className={`input-field-wrapper ${errors.city ? 'input-field-error' : ''}`}>
                      <input
                        id="field-city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        onBlur={() => handleBlur('city')}
                        placeholder={t('basicInfo.enterCity', 'Enter your city')}
                        autoComplete="address-level2"
                        required
                        aria-required="true"
                        aria-invalid={errors.city ? 'true' : 'false'}
                        aria-describedby={errors.city ? 'city-error-msg' : undefined}
                        className="text-input-control"
                      />
                    </div>
                    {errors.city && (
                      <div id="city-error-msg" className="field-inline-error" role="alert">
                        <AlertCircleIcon size={14} className="error-icon" />
                        <span>{errors.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Field 5: State (Searchable Dropdown with 36 Indian States & UTs) */}
                  <div className="form-field-group" ref={dropdownRef}>
                    <label id="label-state-dropdown" className="field-label">
                      {t('basicInfo.state', 'State / Union Territory')} <span className="required-star">*</span>
                    </label>
                    
                    <div className="searchable-dropdown-root">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isStateDropdownOpen}
                        aria-labelledby="label-state-dropdown"
                        className={`dropdown-trigger-btn ${formData.state ? 'has-value' : ''} ${
                          errors.state ? 'input-field-error' : ''
                        }`}
                        onClick={() => setIsStateDropdownOpen((prev) => !prev)}
                      >
                        <span className="dropdown-value-text">
                          {formData.state || t('basicInfo.selectState', 'Select State / Union Territory...')}
                        </span>
                        <span className="dropdown-caret-arrow" aria-hidden="true">
                          ▼
                        </span>
                      </button>

                      {isStateDropdownOpen && (
                        <div className="dropdown-popup-panel" role="listbox">
                          <div className="dropdown-search-box">
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={stateSearchQuery}
                              onChange={(e) => setStateSearchQuery(e.target.value)}
                              placeholder={t('basicInfo.searchStates', 'Type to search states...')}
                              className="dropdown-search-input"
                              aria-label={t('basicInfo.searchStates', 'Search Indian States')}
                            />
                          </div>

                          <div className="dropdown-options-scroll">
                            {filteredStates.length > 0 ? (
                              filteredStates.map((st) => {
                                const isSelected = formData.state === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    className={`dropdown-option-item ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => handleSelectState(st)}
                                    role="option"
                                    aria-selected={isSelected}
                                  >
                                    <span>{st}</span>
                                    {isSelected && <CheckIcon size={14} />}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="dropdown-no-results">
                                {t('basicInfo.noStatesFound', 'No matching state found')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.state && (
                      <div id="state-error-msg" className="field-inline-error" role="alert">
                        <AlertCircleIcon size={14} className="error-icon" />
                        <span>{errors.state}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Navigation Buttons */}
                <div className="form-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-nav-back"
                    onClick={() => onNavigate('health-profile')}
                  >
                    {t('common.back', '← Back')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                  >
                    <span>{t('basicInfo.continueToLifestyle', 'Continue to Lifestyle →')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Desktop Contextual Progress & Reassurance Sidebar */}
          <AssessmentSidePanel
            currentStep={1}
            totalSteps={isFemaleSelected ? 5 : 4}
            isFemale={isFemaleSelected}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="health-profile" onNavigate={onNavigate} />
    </div>
  );
};

export default BasicInfoSectionPage;
