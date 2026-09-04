import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAssessment } from './context/AssessmentContext';
import { BreastSelfExamModal } from './components/BreastSelfExamModal';
import {
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  InformationCircleIcon,
} from './assets/MedicalIcons';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import './styles/SymptomsSectionPage.css';

import { getApplicableScreeningAlerts } from './config/screeningGuidelines';

interface SymptomsSectionPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface SymptomItem {
  id: string;
  label: string;
  description: string;
  isRedFlag?: boolean;
  requiresSeverity?: boolean;
  customOptions?: { value: string; label: string }[];
}

interface SymptomCategory {
  id: string;
  title: string;
  subtitle: string;
  isFemaleOnly?: boolean;
  hasBseGuide?: boolean;
  symptoms: SymptomItem[];
}

export const SEVERITY_OPTIONS = [
  'Mild',
  'Moderate',
  'Severe',
] as const;

export type SeverityLevel = typeof SEVERITY_OPTIONS[number];

export const DURATION_OPTIONS = [
  '<1 week',
  '1–2 weeks',
  '2–4 weeks',
  '1–3 months',
  '3+ months',
];

export const SymptomsSectionPage: React.FC<SymptomsSectionPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, updateSymptoms, isFemale } = useAssessment();

  const SYMPTOM_CATEGORIES: SymptomCategory[] = [
    {
      id: 'lung',
      title: t('symptoms.lungTitle', 'Lung & Respiratory Symptoms'),
      subtitle: t('symptoms.lungSub', 'Persistent cough, chest sensations, and respiratory warning signs'),
      symptoms: [
        {
          id: 'has_coughing_blood',
          label: t('symptoms.coughingBloodLabel', 'Blood when coughing (Hemoptysis)'),
          description: t('symptoms.coughingBloodDesc', 'Coughing up fresh blood or blood-streaked sputum'),
          isRedFlag: true,
          requiresSeverity: true,
        },
        {
          id: 'has_unexplained_weight_loss_lung',
          label: t('symptoms.weightLossLabel', 'Unexplained significant weight loss'),
          description: t('symptoms.weightLossDesc', 'Rapid drop in body weight without changes in diet or physical routine'),
          isRedFlag: true,
          requiresSeverity: true,
        },
        {
          id: 'has_cough',
          label: t('symptoms.coughLabel', 'Persistent dry or worsening cough'),
          description: t('symptoms.coughDesc', 'Continuous cough lasting several weeks without a respiratory infection'),
          requiresSeverity: true,
        },
        {
          id: 'has_chest_pain',
          label: t('symptoms.chestPainLabel', 'Persistent chest or shoulder pain'),
          description: t('symptoms.chestPainDesc', 'Aching or sharp discomfort that may worsen with deep breathing or coughing'),
          requiresSeverity: true,
        },
        {
          id: 'has_shortness_of_breath',
          label: t('symptoms.shortBreathLabel', 'Shortness of breath (Breathlessness)'),
          description: t('symptoms.shortBreathDesc', 'Unusual breathlessness during light activity or rest'),
          requiresSeverity: true,
        },
        {
          id: 'has_wheezing',
          label: t('symptoms.wheezingLabel', 'Wheezing or noisy breathing'),
          description: t('symptoms.wheezingDesc', 'High-pitched whistling sound during inhalation or exhalation'),
          requiresSeverity: true,
        },
        {
          id: 'has_difficulty_swallowing',
          label: t('symptoms.swallowingLabel', 'Difficulty swallowing (Dysphagia)'),
          description: t('symptoms.swallowingDesc', 'Sensation of food sticking in throat, painful swallowing, or hoarseness'),
          isRedFlag: true,
          requiresSeverity: true,
        },
        {
          id: 'has_frequent_cold',
          label: t('symptoms.frequentColdLabel', 'Frequent chest colds or respiratory infections'),
          description: t('symptoms.frequentColdDesc', 'Recurring episodes of bronchitis or persistent colds'),
          requiresSeverity: true,
        },
        {
          id: 'has_snoring',
          label: t('symptoms.snoringLabel', 'Heavy snoring or sleep breathing pauses'),
          description: t('symptoms.snoringDesc', 'Frequent loud snoring or daytime sleepiness'),
          requiresSeverity: true,
        },
        {
          id: 'has_fatigue',
          label: t('symptoms.fatigueLabel', 'Persistent debilitating fatigue'),
          description: t('symptoms.fatigueDesc', 'Severe exhaustion that interferes with daily tasks and does not improve with rest'),
          requiresSeverity: true,
        },
      ],
    },
    {
      id: 'breast',
      title: t('symptoms.breastTitle', 'Breast Symptoms'),
      subtitle: t('symptoms.breastSub', 'Palpable lumps, localized tenderness, nipple changes, and asymmetry'),
      isFemaleOnly: true,
      hasBseGuide: true,
      symptoms: [
        {
          id: 'has_breast_lump',
          label: t('symptoms.breastLumpLabel', 'Lump in breast or armpit'),
          description: t('symptoms.breastLumpDesc', 'Firm, painless or tender mass in breast tissue or axilla'),
          isRedFlag: true,
        },
        {
          id: 'has_breast_skin_changes',
          label: t('symptoms.breastSkinLabel', 'Skin changes (dimpling, redness, or puckering)'),
          description: t('symptoms.breastSkinDesc', 'Orange-peel texture (peau d’orange), indentation, or persistent localized erythema'),
        },
        {
          id: 'has_nipple_changes',
          label: t('symptoms.nippleChangesLabel', 'Nipple changes (inversion or spontaneous discharge)'),
          description: t('symptoms.nippleChangesDesc', 'Inward turning nipple or unexplained fluid/blood discharge'),
        },
        {
          id: 'has_breast_asymmetry',
          label: t('symptoms.breastAsymLabel', 'Unexplained difference in breast size or shape'),
          description: t('symptoms.breastAsymDesc', 'Sudden or noticeable contour asymmetry'),
        },
        {
          id: 'has_breast_pain',
          label: t('symptoms.breastPainLabel', 'Persistent breast pain or localized tenderness'),
          description: t('symptoms.breastPainDesc', 'Pain not correlated with menstrual cycle changes'),
          requiresSeverity: true,
        },
      ],
    },
    {
      id: 'oral',
      title: t('symptoms.oralTitle', 'Oral Cancer Symptoms'),
      subtitle: t('symptoms.oralSub', 'Mouth lesions, mucosal patches, throat, or neck symptoms'),
      symptoms: [
        {
          id: 'has_mouth_ulcer_2w',
          label: t('symptoms.mouthUlcerLabel', 'Mouth sore unhealed for 2+ weeks'),
          description: t('symptoms.mouthUlcerDesc', 'Persistent mucosal ulcer on tongue, gums, cheek lining, or palate'),
          isRedFlag: true,
        },
        {
          id: 'has_oral_lump',
          label: t('symptoms.oralLumpLabel', 'Lump in mouth, jaw, or neck (Neck Swelling)'),
          description: t('symptoms.oralLumpDesc', 'Palpable swelling or firm node in the oral cavity or cervical lymph chain'),
          isRedFlag: true,
        },
        {
          id: 'has_hoarseness_3w',
          label: t('symptoms.hoarsenessLabel', 'Hoarse voice or persistent sore throat for 3+ weeks'),
          description: t('symptoms.hoarsenessDesc', 'Vocal changes or chronic irritation in throat'),
          isRedFlag: true,
          requiresSeverity: true,
        },
        {
          id: 'has_oral_red_white_patches',
          label: t('symptoms.oralPatchesLabel', 'White or red patches in mouth (Leukoplakia / Erythroplakia)'),
          description: t('symptoms.oralPatchesDesc', 'Velvety red or rough white mucosal discoloration that cannot be wiped away'),
        },
        {
          id: 'has_oral_bleeding',
          label: t('symptoms.oralBleedingLabel', 'Unexplained bleeding in oral cavity'),
          description: t('symptoms.oralBleedingDesc', 'Bleeding without apparent trauma or dental disease'),
        },
        {
          id: 'uses_smokeless_tobacco',
          label: t('symptoms.smokelessLabel', 'Do you currently use smokeless tobacco products?'),
          description: t('symptoms.smokelessDesc', 'Chewing tobacco, gutkha, khaini, betel quid with tobacco, or zarda'),
          customOptions: [
            { value: 'Never', label: t('lifestyle.tobaccoNever', 'Never') },
            { value: 'Occasionally', label: t('lifestyle.tobaccoOccasional', 'Occasionally') },
            { value: 'Frequently / Daily', label: t('lifestyle.tobaccoDaily', 'Frequently / Daily') },
          ],
        },
      ],
    },
    {
      id: 'cervical',
      title: t('symptoms.cervicalTitle', "Cervical & Women's Health Symptoms"),
      subtitle: t('symptoms.cervicalSub', 'Atypical bleeding, vaginal discharge, and pelvic markers'),
      isFemaleOnly: true,
      symptoms: [
        {
          id: 'has_abnormal_vaginal_bleeding',
          label: t('symptoms.abnormalBleedLabel', 'Have you experienced abnormal vaginal bleeding?'),
          description: t('symptoms.abnormalBleedDesc', 'Intermenstrual bleeding, irregular or heavy periods, or bleeding after menopause.'),
          isRedFlag: true,
        },
        {
          id: 'has_post_coital_bleeding',
          label: t('symptoms.postCoitalLabel', 'Bleeding after sexual intercourse (Post-coital bleeding)'),
          description: t('symptoms.postCoitalDesc', 'Noticing blood spots or bleeding following intercourse'),
          isRedFlag: true,
        },
        {
          id: 'has_abnormal_vaginal_discharge',
          label: t('symptoms.dischargeLabel', 'Have you experienced unusual or abnormal vaginal discharge?'),
          description: t('symptoms.dischargeDesc', 'Persistent, unusual, foul-smelling, watery, or blood-tinged discharge.'),
        },
        {
          id: 'has_pelvic_pain',
          label: t('symptoms.pelvicPainLabel', 'Have you experienced persistent pelvic or lower abdominal pain?'),
          description: t('symptoms.pelvicPainDesc', 'Pelvic or lower abdominal discomfort that is persistent or unusual.'),
          requiresSeverity: true,
        },
      ],
    },
  ];

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    assessmentState.symptoms.selectedSymptoms || []
  );
  const [symptomDurations, setSymptomDurations] = useState<Record<string, string>>(
    assessmentState.symptoms.symptomDurations || {}
  );
  const [symptomSeverities, setSymptomSeverities] = useState<Record<string, string | number>>(
    assessmentState.symptoms.symptomSeverities || {}
  );
  const [isBseModalOpen, setIsBseModalOpen] = useState(false);

  // Accordion open states
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    lung: true,
    breast: true,
    oral: true,
    cervical: true,
  });

  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleToggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => {
      const filtered = prev.filter((s) => s !== 'None of the above');
      if (filtered.includes(symptomId)) {
        // remove symptom, duration, and severity
        setSymptomDurations((dPrev) => {
          const nextD = { ...dPrev };
          delete nextD[symptomId];
          return nextD;
        });
        setSymptomSeverities((sPrev) => {
          const nextS = { ...sPrev };
          delete nextS[symptomId];
          return nextS;
        });
        return filtered.filter((s) => s !== symptomId);
      } else {
        // add symptom with default duration and severity
        setSymptomDurations((dPrev) => ({
          ...dPrev,
          [symptomId]: dPrev[symptomId] || '2–4 weeks',
        }));
        setSymptomSeverities((sPrev) => ({
          ...sPrev,
          [symptomId]: sPrev[symptomId] || '4',
        }));
        return [...filtered, symptomId];
      }
    });
  };

  const handleSetDuration = (symptomId: string, duration: string) => {
    setSymptomDurations((prev) => ({
      ...prev,
      [symptomId]: duration,
    }));
  };

  const handleSetSeverity = (symptomId: string, severity: string | number) => {
    setSymptomSeverities((prev) => ({
      ...prev,
      [symptomId]: severity,
    }));
  };

  const handleSelectNone = () => {
    setSelectedSymptoms(['None of the above']);
    setSymptomDurations({});
    setSymptomSeverities({});
  };

  const isNoneSelected = selectedSymptoms.includes('None of the above');
  const totalSelectedCount = isNoneSelected
    ? 0
    : selectedSymptoms.filter((s) => s !== 'None of the above').length;

  const handleSaveAndAnalyze = (e: React.FormEvent) => {
    e.preventDefault();

    const finalSymptoms = selectedSymptoms.length > 0 ? selectedSymptoms : ['None of the above'];

    updateSymptoms({
      selectedSymptoms: finalSymptoms,
      symptomDurations,
      symptomSeverities,
    });

    onNavigate('assessment-analyzing');
  };

  // Filter categories by biological sex: Never show breast/cervical to males
  const visibleCategories = SYMPTOM_CATEGORIES.filter((cat) => {
    if (cat.isFemaleOnly && !isFemale) {
      return false;
    }
    return true;
  });

  const isSmoker = Boolean(
    assessmentState.lifestyle.isCurrentSmoker === true ||
    (typeof assessmentState.lifestyle.tobaccoUse === 'string' && assessmentState.lifestyle.tobaccoUse.includes('Smoke'))
  );
  const usesTobacco = Boolean(
    assessmentState.lifestyle.usesSmokelessTobacco === true ||
    (typeof assessmentState.lifestyle.tobaccoUse === 'string' && assessmentState.lifestyle.tobaccoUse && assessmentState.lifestyle.tobaccoUse !== 'Never' && assessmentState.lifestyle.tobaccoUse !== 'never')
  );
  const drinksAlcohol = Boolean(
    assessmentState.lifestyle.isAlcoholConsuming === true ||
    (typeof assessmentState.lifestyle.alcoholConsumption === 'string' &&
      (assessmentState.lifestyle.alcoholConsumption.includes('Regularly') || assessmentState.lifestyle.alcoholConsumption.includes('Occasionally') || assessmentState.lifestyle.alcoholConsumption.includes('Daily')))
  );

  const activeAlerts = getApplicableScreeningAlerts({
    age: assessmentState.basicInfo.age,
    gender: assessmentState.basicInfo.biologicalSex || assessmentState.basicInfo.biological_sex,
    isSmoker,
    usesTobacco,
    drinksAlcohol,
  });
  const unreadAlertsCount = activeAlerts.length;

  return (
    <div className="symptoms-layout-root">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="symptoms"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Main Content Area */}
      <main className="symptoms-main-area">
        {/* Top Header & Breadcrumbs */}
        <header className="symptoms-top-header">
          <div className="breadcrumb-nav">
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" className="breadcrumb-link" onClick={() => onNavigate('health-profile')}>
              Assessment
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Current Symptoms</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-return-dash"
            onClick={() => onNavigate('dashboard')}
          >
            {t('common.returnToDashboard', '← Return to Dashboard')}
          </button>
        </header>

        <div className="section-container" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="symptoms-form-card">
            {/* Header */}
            <div className="form-header-group">
              <div className="symptoms-counter-row">
                <h1 className="form-section-heading">Current Symptoms Assessment</h1>
                <span className="symptoms-count-pill">
                  {totalSelectedCount === 0
                    ? t('symptoms.noSymptomsLogged', 'No symptoms logged')
                    : `${totalSelectedCount} ${t('symptoms.symptomsLogged', 'symptoms logged')}`}
                </span>
              </div>
              <p className="form-section-subtext">
                Select any current or persistent physical signs across respiratory, oral, general, and organ-specific categories. These will be evaluated against evidence-based ICMR screening protocols.
              </p>
            </div>

            <form onSubmit={handleSaveAndAnalyze} className="questionnaire-form" noValidate>
              {/* ACCORDION CATEGORIES */}
              <div className="symptoms-accordions-list">
                {visibleCategories.map((category) => {
                  const isExpanded = Boolean(expandedCategories[category.id]);
                  const categorySelectedCount = category.symptoms.filter((sym) =>
                    selectedSymptoms.includes(sym.id)
                  ).length;

                  return (
                    <div key={category.id} className="symptom-category-card">
                      {/* Category Accordion Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}>
                        <button
                          type="button"
                          className="accordion-header-btn"
                          style={{ flex: 1 }}
                          onClick={() => toggleCategory(category.id)}
                          aria-expanded={isExpanded}
                        >
                          <div className="accordion-title-col">
                            <div className="category-title-badge-row">
                              <h2 className="accordion-category-title">{category.title}</h2>
                              {categorySelectedCount > 0 && (
                                <span className="cat-badge-pill">
                                  {categorySelectedCount} {t('common.selected', 'selected')}
                                </span>
                              )}
                            </div>
                            <span className="accordion-category-subtitle">{category.subtitle}</span>
                          </div>

                          <span className={`accordion-chevron-icon ${isExpanded ? 'open' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {/* BSE Guide Button (Female Breast only) */}
                        {category.hasBseGuide && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#0D9488',
                              backgroundColor: '#F0FDFA',
                              borderColor: '#99F6E4',
                              whiteSpace: 'nowrap',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBseModalOpen(true);
                            }}
                          >
                            <InformationCircleIcon size={14} color="#0D9488" />
                            <span>{t('symptoms.howToCheckBse', 'How to check for symptoms')}</span>
                          </button>
                        )}
                      </div>

                      {/* Category Body */}
                      {isExpanded && (
                        <div className="accordion-body-panel">
                          <div className="symptom-cards-grid">
                            {category.symptoms.map((symptom) => {
                              const isChecked = selectedSymptoms.includes(symptom.id);
                              const currentDuration =
                                symptomDurations[symptom.id] || '2–4 weeks';

                              return (
                                <div
                                  key={symptom.id}
                                  className={`symptom-item-card ${isChecked ? 'is-selected' : ''}`}
                                >
                                  <div
                                    className="symptom-card-header-clickable"
                                    onClick={() => handleToggleSymptom(symptom.id)}
                                    role="checkbox"
                                    aria-checked={isChecked}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        handleToggleSymptom(symptom.id);
                                      }
                                    }}
                                  >
                                    <div className="symptom-left-row">
                                      <div className={`custom-checkbox-box ${isChecked ? 'checked' : ''}`}>
                                        {isChecked && <CheckIcon size={13} />}
                                      </div>
                                      <div className="symptom-text-col">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span className="symptom-name-title">{symptom.label}</span>
                                          {symptom.isRedFlag && (
                                            <span
                                              style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                color: '#DC2626',
                                                backgroundColor: '#FEF2F2',
                                                border: '1px solid #FECACA',
                                                padding: '1px 7px',
                                                borderRadius: '9999px',
                                              }}
                                            >
                                              {t('symptoms.redFlag', 'Red-Flag')}
                                            </span>
                                          )}
                                        </div>
                                        <span className="symptom-desc-sub">{symptom.description}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inline Severity / Custom Options & Duration Selector */}
                                  {isChecked && (
                                    <div className="symptom-duration-picker-box">
                                      {/* Custom Options Selector (e.g. smokeless tobacco frequency) */}
                                      {symptom.customOptions && (
                                        <div className="symptom-picker-group">
                                          <div className="duration-picker-header">
                                            <AlertCircleIcon size={14} color="#0F766E" />
                                            <span>{t('symptoms.frequencyStatus', 'Frequency / Status:')}</span>
                                          </div>
                                          <div className="duration-pills-row">
                                            {symptom.customOptions.map((opt) => {
                                              const activeOpt = symptomSeverities[symptom.id] || 'Frequently / Daily';
                                              const isOptActive = activeOpt === opt.value;
                                              return (
                                                <button
                                                  key={opt.value}
                                                  type="button"
                                                  className={`duration-pill-btn severity-pill-btn ${isOptActive ? 'is-active' : ''}`}
                                                  onClick={() => {
                                                    handleSetSeverity(symptom.id, opt.value);
                                                    if (opt.value === 'Never') {
                                                      setSelectedSymptoms((prev) => prev.filter((id) => id !== symptom.id));
                                                    }
                                                  }}
                                                >
                                                  <span>{opt.label}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Severity Selector - only for symptoms requiring severity */}
                                      {symptom.requiresSeverity && !symptom.customOptions && (() => {
                                        const rawVal = symptomSeverities[symptom.id];
                                        const numVal = typeof rawVal === 'number' ? rawVal : (parseInt(String(rawVal || '4'), 10) || 4);
                                        const currentSeverity = Math.min(Math.max(numVal, 1), 8);
                                        const getSeverityLabel = (val: number) => {
                                          if (val <= 3) return t('symptoms.mild', 'Mild');
                                          if (val <= 5) return t('symptoms.moderate', 'Moderate');
                                          return t('symptoms.severe', 'Severe');
                                        };

                                        return (
                                          <div className="symptom-picker-group">
                                            <div className="duration-picker-header" style={{ justifyContent: 'space-between' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <AlertCircleIcon size={14} color="#0F766E" />
                                                <span>{t('symptoms.severityLevel', 'Severity Rating (1–8):')}</span>
                                              </div>
                                              <span className="severity-rating-badge">
                                                <strong>{currentSeverity}</strong> / 8 ({getSeverityLabel(currentSeverity)})
                                              </span>
                                            </div>
                                            <div className="symptom-slider-container">
                                              <input
                                                type="range"
                                                min={1}
                                                max={8}
                                                step={1}
                                                value={currentSeverity}
                                                onChange={(e) => handleSetSeverity(symptom.id, e.target.value)}
                                                className="symptom-severity-slider"
                                                aria-label={`${symptom.label} severity rating from 1 to 8`}
                                              />
                                              <div className="slider-ticks-row">
                                                <span>1 ({t('symptoms.mild', 'Mild')})</span>
                                                <span>4 ({t('symptoms.moderate', 'Mod')})</span>
                                                <span>8 ({t('symptoms.severe', 'Severe')})</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* Duration Selector */}
                                      {!symptom.customOptions && (
                                        <div className="symptom-picker-group" style={{ marginTop: symptom.requiresSeverity ? '4px' : '0' }}>
                                          <div className="duration-picker-header">
                                            <ClockIcon size={14} color="#0F766E" />
                                            <span>{t('symptoms.howLongNoticed', 'How long have you noticed this symptom?')}</span>
                                          </div>
                                          <div className="duration-pills-row">
                                            {[
                                              { key: '<1 week', label: t('symptoms.under1week', '<1 week') },
                                              { key: '1–2 weeks', label: t('symptoms.1to2weeks', '1–2 weeks') },
                                              { key: '2–4 weeks', label: t('symptoms.2to4weeks', '2–4 weeks') },
                                              { key: '1–3 months', label: t('symptoms.1to3months', '1–3 months') },
                                              { key: '3+ months', label: t('symptoms.3plusMonths', '3+ months') },
                                            ].map((dur) => {
                                              const isDurActive = currentDuration === dur.key;
                                              return (
                                                <button
                                                  key={dur.key}
                                                  type="button"
                                                  className={`duration-pill-btn ${isDurActive ? 'is-active' : ''}`}
                                                  onClick={() => handleSetDuration(symptom.id, dur.key)}
                                                >
                                                  <span>{dur.label}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BOTTOM NONE OF THESE BUTTON */}
              <div className="none-of-above-container">
                <button
                  type="button"
                  className={`none-select-btn ${isNoneSelected ? 'is-active' : ''}`}
                  onClick={handleSelectNone}
                >
                  <div className={`custom-radio-circle ${isNoneSelected ? 'checked' : ''}`}>
                    {isNoneSelected && <span className="radio-inner-dot" />}
                  </div>
                  <span>{t('symptoms.noneApply', 'None of these symptoms apply to me currently')}</span>
                </button>
              </div>

              {/* Mandatory Clinical Disclaimer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#FEFCE8',
                  border: '1px solid #FEF08A',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  fontSize: '0.83rem',
                  color: '#854D0E',
                  lineHeight: 1.5,
                  marginTop: '16px',
                }}
                role="note"
              >
                <AlertCircleIcon size={20} color="#854D0E" />
                <span>{t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}</span>
              </div>

              {/* Form Actions Footer */}
              <div className="symptoms-actions-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-nav-back"
                  onClick={() => onNavigate('dashboard')}
                >
                  {t('common.returnToDashboard', '← Return to Dashboard')}
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontWeight: 700 }}
                    onClick={() => {
                      updateSymptoms({
                        selectedSymptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['None of the above'],
                        symptomDurations,
                      });
                      onNavigate('dashboard');
                    }}
                  >
                    {t('symptoms.saveSymptoms', 'Save Symptoms')}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-nav-next"
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    <span>{t('symptoms.submitForAnalysis', 'Submit for AI Analysis →')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* BSE Slide-in Modal */}
      <BreastSelfExamModal
        isOpen={isBseModalOpen}
        onClose={() => setIsBseModalOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="symptoms" onNavigate={onNavigate} />
    </div>
  );
};

export default SymptomsSectionPage;

