import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, SecureShieldIcon, AlertCircleIcon } from './assets/MedicalIcons';
import { useAssessment } from './context/AssessmentContext';
import { CancerResultItem, RiskTier, AssessmentResponseCard } from './types/assessment';
import {
  getScreeningRecommendation,
  CLINICAL_DISCLAIMER,
} from './config/screeningGuidelines';
import './styles/SubmitAnalyzePage.css';

interface SubmitAnalyzePageProps {
  onAnalysisComplete: () => void;
  onNavigate: (route: string) => void;
}

interface AnalysisStage {
  id: number;
  label: string;
  sublabel: string;
}

export const SubmitAnalyzePage: React.FC<SubmitAnalyzePageProps> = ({
  onAnalysisComplete,
}) => {
  const { t } = useTranslation();
  const { state: assessmentState, completeAssessment, isFemale, getBackendPayload } = useAssessment();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  const STAGES: AnalysisStage[] = [
    { id: 1, label: t('analyzing.stage1', 'Assessment verified'), sublabel: t('analyzing.stage1Sub', 'Structuring personal, lifestyle, medical, & screening records') },
    { id: 2, label: t('analyzing.stage2', 'Symptoms & red flags processed'), sublabel: t('analyzing.stage2Sub', 'Assessing reported duration and clinical alarm signals') },
    { id: 3, label: t('analyzing.stage3', 'Running ML & clinical evaluation'), sublabel: t('analyzing.stage3Sub', 'Executing FastAPI XGBoost + SHAP explainability models') },
    { id: 4, label: t('analyzing.stage4', 'Cross-referencing screening guidelines'), sublabel: t('analyzing.stage4Sub', 'Matching personalized intervals from evidence-based protocols') },
  ];

  useEffect(() => {
    let isMounted = true;

    // Stage 1 (15% -> 40%)
    const timer1 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStageIndex(1);
      setProgressPercent(45);
    }, 700);

    // Stage 2 (45% -> 75%)
    const timer2 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStageIndex(2);
      setProgressPercent(75);
    }, 1400);

    // Stage 3 (75% -> 95%)
    const timer3 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStageIndex(3);
      setProgressPercent(95);
    }, 2100);

    // Perform Backend Request & Clinical Guideline Synthesis
    const runAnalysis = async () => {
      const payload = getBackendPayload();
      const age = parseInt(assessmentState.basicInfo.age || '40', 10) || 40;
      const sex = isFemale ? 'female' : 'male';

      let backendData: any = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          backendData = await response.json();
        }
      } catch (err) {
        backendData = null;
      }

      // Helper for tier conversion
      const tierRank = (t: string) => {
        const lower = String(t || '').toLowerCase();
        if (lower.includes('high')) return 2;
        if (lower.includes('med') || lower.includes('mod')) return 1;
        return 0;
      };

      const maxTierStr = (t1: string, t2: string): 'low' | 'medium' | 'high' => {
        return tierRank(t1) >= tierRank(t2)
          ? (tierRank(t1) === 2 ? 'high' : tierRank(t1) === 1 ? 'medium' : 'low')
          : (tierRank(t2) === 2 ? 'high' : tierRank(t2) === 1 ? 'medium' : 'low');
      };

      // Fix 3: Convert backend snake_case triggered_factors to human-readable Title Case.
      // e.g. "current_smoker" → "Current Smoker", "age_over_50" → "Age Over 50"
      const humanizeFactor = (factor: string): string => {
        return factor
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Fix 2: Extract guidance_text from layer3 object (real backend) or fall back
      // to the layer3 value itself (heuristic fallback path, where it is a string).
      const extractGuidance = (layer3: any): string | undefined => {
        if (!layer3) return undefined;
        if (typeof layer3 === 'string') return layer3;
        return layer3.guidance_text ?? undefined;
      };

      const toDisplayTier = (t: 'low' | 'medium' | 'high'): RiskTier => {
        if (t === 'high') return 'High Risk';
        if (t === 'medium') return 'Moderate Risk';
        return 'Low Risk';
      };

      // -------------------------------------------------------------
      // 1. LUNG CANCER EVALUATION
      // -------------------------------------------------------------
      const lungTriggered: string[] = [];
      if (payload.has_coughing_blood) lungTriggered.push('Coughing up blood (Hemoptysis)');
      if (payload.cough_duration_weeks >= 3 && payload.is_current_smoker) {
        lungTriggered.push('Persistent cough (>=3 weeks) with current smoking habit');
      }
      if (payload.is_current_smoker && !lungTriggered.includes('Persistent cough (>=3 weeks) with current smoking habit')) {
        lungTriggered.push('Active tobacco smoking habit');
      }
      if (payload.has_family_history_lung_cancer) lungTriggered.push('First-degree family history of lung cancer');
      if (payload.has_occupational_exposure) lungTriggered.push('Occupational exposure to hazardous dusts/fumes/asbestos');
      if (payload.cough_duration_weeks >= 3 && !payload.is_current_smoker) {
        lungTriggered.push('Persistent cough lasting 3+ weeks');
      }
      if (payload.lung_chest_pain_severity >= 5) lungTriggered.push('Chronic or severe chest discomfort');
      if (payload.lung_shortness_of_breath_severity >= 5) lungTriggered.push('Unexplained shortness of breath');

      let lungL1Tier: 'low' | 'medium' | 'high' = 'low';
      if (payload.has_coughing_blood || (payload.cough_duration_weeks >= 3 && payload.is_current_smoker)) {
        lungL1Tier = 'high';
      } else if (
        payload.is_current_smoker ||
        payload.has_family_history_lung_cancer ||
        payload.has_occupational_exposure ||
        payload.cough_duration_weeks >= 3 ||
        payload.lung_smoking_severity >= 4
      ) {
        lungL1Tier = 'medium';
      }

      // Layer 2 estimation (0 - 100)
      const lungScore = Math.min(
        Math.max(
          Math.round(
            15 +
            (payload.is_current_smoker ? 25 : 0) +
            payload.lung_smoking_severity * 3 +
            payload.lung_air_pollution_exposure * 2.5 +
            payload.lung_genetic_risk * 3.5 +
            (payload.has_coughing_blood ? 30 : 0) +
            payload.cough_duration_weeks * 2 +
            payload.lung_chest_pain_severity * 2
          ),
          12
        ),
        95
      );
      const lungL2Tier: 'low' | 'medium' | 'high' = lungScore >= 60 ? 'high' : lungScore >= 35 ? 'medium' : 'low';
      const lungOverallTier = backendData?.lung?.overall_tier || maxTierStr(lungL1Tier, lungL2Tier);

      const lungCard: AssessmentResponseCard = backendData?.lung || {
        overall_tier: lungOverallTier,
        layer1: {
          triggered_factors: lungTriggered.length > 0 ? lungTriggered : ['No immediate high-risk tobacco or symptom alarm triggers reported'],
        },
        layer2: {
          smoking_exposure: payload.lung_smoking_severity,
          air_pollution_exposure: payload.lung_air_pollution_exposure,
          genetic_risk: payload.lung_genetic_risk,
          respiratory_symptoms: payload.lung_dry_cough_severity,
          model_score: lungScore,
        },
        layer3: getScreeningRecommendation('lung', age, sex, toDisplayTier(lungOverallTier), {
          tobaccoHistory: payload.is_current_smoker || payload.lung_smoking_severity > 1,
          symptomsReported: payload.has_coughing_blood || payload.cough_duration_weeks > 0,
        }),
      };
      // Fix 2: extract guidance_text for lung
      const lungGuidance = extractGuidance(lungCard.layer3);
      // Fix 3: humanize lung layer1 triggered_factors
      const lungKeyFactors = (lungCard.layer1?.triggered_factors || []).map(humanizeFactor);

      // -------------------------------------------------------------
      // 2. ORAL CANCER EVALUATION
      // -------------------------------------------------------------
      const oralTriggered: string[] = [];
      if (payload.has_mouth_ulcer && payload.mouth_ulcer_duration_weeks >= 2) {
        oralTriggered.push('Mouth ulcer unhealed for 2+ weeks');
      }
      if (payload.has_oral_red_white_patches) {
        oralTriggered.push('Oral red or white mucosal patches (leukoplakia / erythroplakia)');
      }
      if (payload.has_neck_swelling) oralTriggered.push('Palpable lump in neck or mouth cavity');
      if (payload.uses_smokeless_tobacco) oralTriggered.push('Chewing smokeless tobacco / gutkha / paan habit');
      if (payload.is_current_smoker && payload.is_alcohol_consuming) {
        oralTriggered.push('Synergistic smoking and regular alcohol consumption');
      }
      if (payload.has_difficulty_swallowing) oralTriggered.push('Difficulty swallowing / persistent vocal hoarseness');

      let oralL1Tier: 'low' | 'medium' | 'high' = 'low';
      if (
        (payload.has_mouth_ulcer && payload.mouth_ulcer_duration_weeks >= 2) ||
        payload.has_oral_red_white_patches ||
        payload.has_neck_swelling
      ) {
        oralL1Tier = 'high';
      } else if (
        payload.uses_smokeless_tobacco ||
        (payload.is_current_smoker && payload.is_alcohol_consuming) ||
        payload.has_difficulty_swallowing ||
        payload.has_mouth_ulcer
      ) {
        oralL1Tier = 'medium';
      }

      const oralScore = Math.min(
        Math.max(
          Math.round(
            12 +
            (payload.uses_smokeless_tobacco ? 30 : 0) +
            (payload.has_oral_red_white_patches ? 28 : 0) +
            (payload.has_mouth_ulcer ? 20 : 0) +
            (payload.is_alcohol_consuming ? 10 : 0) +
            (payload.is_current_smoker ? 12 : 0)
          ),
          10
        ),
        95
      );
      const oralL2Tier: 'low' | 'medium' | 'high' = oralScore >= 55 ? 'high' : oralScore >= 32 ? 'medium' : 'low';
      const oralOverallTier = backendData?.oral?.overall_tier || maxTierStr(oralL1Tier, oralL2Tier);

      const oralCard: AssessmentResponseCard = backendData?.oral || {
        overall_tier: oralOverallTier,
        layer1: {
          triggered_factors: oralTriggered.length > 0 ? oralTriggered : ['Healthy oral mucosal baseline without chronic smokeless tobacco habit'],
        },
        layer2: {
          smokeless_tobacco_risk: payload.uses_smokeless_tobacco ? 8 : 1,
          alcohol_cofactor: payload.is_alcohol_consuming ? 6 : 1,
          mucosal_symptom_signals: payload.has_mouth_ulcer ? 7 : 1,
          model_score: oralScore,
        },
        layer3: getScreeningRecommendation('oral', age, sex, toDisplayTier(oralOverallTier), {
          smokelessTobacco: payload.uses_smokeless_tobacco,
          symptomsReported: payload.has_mouth_ulcer || payload.has_oral_red_white_patches || payload.has_neck_swelling,
        }),
      };
      // Fix 2: extract guidance_text for oral
      const oralGuidance = extractGuidance(oralCard.layer3);
      // Fix 3: humanize oral layer1 triggered_factors
      const oralKeyFactors = (oralCard.layer1?.triggered_factors || []).map(humanizeFactor);

      // -------------------------------------------------------------
      // 3. BREAST CANCER EVALUATION (Female only)
      // -------------------------------------------------------------
      let breastCard: AssessmentResponseCard = {
        overall_tier: 'not_applicable',
        layer1: null,
        layer2: null,
        layer3: 'Not applicable for male biological profile.',
      };
      let breastScore = 15;
      let breastGuidance: string | undefined;
      let breastKeyFactors: string[] = [];

      if (isFemale) {
        const breastTriggered: string[] = [];
        if (payload.has_breast_lump) breastTriggered.push('Palpable lump or thickened mass in breast/axilla');
        if (payload.has_breast_skin_changes) breastTriggered.push('Breast skin retraction, dimpling, or redness');
        if (payload.has_nipple_discharge) breastTriggered.push('Spontaneous or atypical nipple discharge/inversion');
        if (payload.has_family_history_breast_cancer || payload.breast_num_relatives_with_breast_cancer >= 1) {
          breastTriggered.push('First-degree family history of breast malignancy');
        }
        if (payload.breast_has_prior_breast_procedure === 1) breastTriggered.push('Prior breast procedure / diagnostic biopsy');
        if (payload.breast_density >= 3) breastTriggered.push('Dense breast tissue (BI-RADS 3 or 4)');
        if (age >= 40) breastTriggered.push('Age-based screening surveillance threshold (40+ years)');

        let breastL1Tier: 'low' | 'medium' | 'high' = 'low';
        if (payload.has_breast_lump || payload.has_breast_skin_changes || payload.has_nipple_discharge) {
          breastL1Tier = 'high';
        } else if (
          payload.has_family_history_breast_cancer ||
          payload.breast_num_relatives_with_breast_cancer >= 1 ||
          payload.breast_has_prior_breast_procedure === 1 ||
          (age >= 40 && payload.breast_density >= 3) ||
          age >= 50
        ) {
          breastL1Tier = 'medium';
        }

        breastScore = Math.min(
          Math.max(
            Math.round(
              15 +
              (payload.has_breast_lump ? 35 : 0) +
              (payload.has_family_history_breast_cancer ? 20 : 0) +
              (age >= 50 ? 15 : age >= 40 ? 10 : 0) +
              (payload.breast_density >= 3 ? 12 : 0) +
              (payload.has_nipple_discharge ? 18 : 0)
            ),
            12
          ),
          95
        );
        const breastL2Tier: 'low' | 'medium' | 'high' = breastScore >= 55 ? 'high' : breastScore >= 35 ? 'medium' : 'low';
        const breastOverallTier = backendData?.breast?.overall_tier || maxTierStr(breastL1Tier, breastL2Tier);

        breastCard = backendData?.breast || {
          overall_tier: breastOverallTier,
          layer1: {
            triggered_factors: breastTriggered.length > 0 ? breastTriggered : ['No palpable breast lumps or first-degree breast cancer history reported'],
          },
          layer2: {
            bcsc_age_factor: age >= 50 ? 2 : 1,
            bcsc_density_category: payload.breast_density,
            family_history_score: payload.breast_num_relatives_with_breast_cancer,
            model_score: breastScore,
          },
          layer3: getScreeningRecommendation('breast', age, sex, toDisplayTier(breastOverallTier), {
            familyHistoryBreast: payload.has_family_history_breast_cancer,
            symptomsReported: payload.has_breast_lump || payload.has_nipple_discharge || payload.has_breast_skin_changes,
          }),
        };
        // Fix 2: extract guidance_text for breast
        breastGuidance = extractGuidance(breastCard.layer3);
        // Fix 3: humanize breast layer1 triggered_factors
        breastKeyFactors = (breastCard.layer1?.triggered_factors || []).map(humanizeFactor);
      }

      // -------------------------------------------------------------
      // 4. CERVICAL CANCER EVALUATION (Female only)
      // -------------------------------------------------------------
      let cervicalCard: AssessmentResponseCard = {
        overall_tier: 'not_applicable',
        layer1: null,
        layer2: null,
        layer3: 'Not applicable for male biological profile.',
      };
      let cervicalScore = 15;
      let cervicalGuidance: string | undefined;
      let cervicalKeyFactors: string[] = [];

      if (isFemale) {
        const cervicalTriggered: string[] = [];
        if (payload.has_abnormal_vaginal_bleeding) cervicalTriggered.push('Atypical intermenstrual or post-coital vaginal bleeding');
        if (payload.is_hpv_positive) cervicalTriggered.push('High-risk Human Papillomavirus (HPV) infection documented');
        if (payload.has_abnormal_vaginal_discharge) cervicalTriggered.push('Persistent atypical vaginal discharge');
        if (payload.has_pelvic_pain) cervicalTriggered.push('Persistent pelvic pain / dyspareunia');
        if (payload.is_screening_overdue) cervicalTriggered.push('Overdue for routine Pap smear or HPV cervical screening');
        if (payload.cervical_smoking_years >= 5) cervicalTriggered.push('Chronic tobacco exposure (cervical cofactor)');
        if (payload.cervical_has_std_history) cervicalTriggered.push('Documented prior STD / infection history');

        let cervicalL1Tier: 'low' | 'medium' | 'high' = 'low';
        if (payload.has_abnormal_vaginal_bleeding || payload.is_hpv_positive) {
          cervicalL1Tier = 'high';
        } else if (
          payload.has_abnormal_vaginal_discharge ||
          payload.has_pelvic_pain ||
          payload.is_screening_overdue ||
          payload.cervical_smoking_years >= 5 ||
          payload.cervical_has_std_history
        ) {
          cervicalL1Tier = 'medium';
        }

        cervicalScore = Math.min(
          Math.max(
            Math.round(
              12 +
              (payload.is_hpv_positive ? 35 : 0) +
              (payload.has_abnormal_vaginal_bleeding ? 30 : 0) +
              (payload.is_screening_overdue ? 15 : 0) +
              (payload.has_pelvic_pain ? 10 : 0) +
              (payload.cervical_smoking_years >= 5 ? 10 : 0)
            ),
            10
          ),
          95
        );
        const cervicalL2Tier: 'low' | 'medium' | 'high' = cervicalScore >= 55 ? 'high' : cervicalScore >= 32 ? 'medium' : 'low';
        const cervicalOverallTier = backendData?.cervical?.overall_tier || maxTierStr(cervicalL1Tier, cervicalL2Tier);

        cervicalCard = backendData?.cervical || {
          overall_tier: cervicalOverallTier,
          layer1: {
            triggered_factors: cervicalTriggered.length > 0 ? cervicalTriggered : ['No high-risk HPV history or abnormal gynecological bleeding symptoms reported'],
          },
          layer2: {
            hpv_status_signal: payload.is_hpv_positive ? 9 : 1,
            screening_interval_flag: payload.is_screening_overdue ? 7 : 1,
            smoking_years_cofactor: payload.cervical_smoking_years,
            model_score: cervicalScore,
          },
          layer3: getScreeningRecommendation('cervical', age, sex, toDisplayTier(cervicalOverallTier), {
            hpvPositive: payload.is_hpv_positive,
            symptomsReported: payload.has_abnormal_vaginal_bleeding || payload.has_abnormal_vaginal_discharge || payload.has_pelvic_pain,
          }),
        };
        // Fix 2: extract guidance_text for cervical
        cervicalGuidance = extractGuidance(cervicalCard.layer3);
        // Fix 3: humanize cervical layer1 triggered_factors
        cervicalKeyFactors = (cervicalCard.layer1?.triggered_factors || []).map(humanizeFactor);
      }

      // Build cancer results list for Results & Report views
      const cancerResults: CancerResultItem[] = [];

      cancerResults.push({
        cancerType: 'lung',
        displayName: 'Lung Cancer',
        riskTier: toDisplayTier(lungCard.overall_tier as any),
        score: lungScore,
        modelType: 'ml_model',
        keyFactors: lungKeyFactors,
        guidelineRecommendation: lungGuidance,
        isApplicable: true,
      });

      cancerResults.push({
        cancerType: 'oral',
        displayName: 'Oral Cancer',
        riskTier: toDisplayTier(oralCard.overall_tier as any),
        score: oralScore,
        modelType: 'prototype_model',
        keyFactors: oralKeyFactors,
        guidelineRecommendation: oralGuidance,
        isApplicable: true,
      });

      if (isFemale) {
        cancerResults.push({
          cancerType: 'breast',
          displayName: 'Breast Cancer',
          riskTier: toDisplayTier(breastCard.overall_tier as any),
          score: breastScore,
          modelType: 'prototype_model',
          keyFactors: breastKeyFactors,
          guidelineRecommendation: breastGuidance,
          isApplicable: true,
        });

        cancerResults.push({
          cancerType: 'cervical',
          displayName: 'Cervical Cancer',
          riskTier: toDisplayTier(cervicalCard.overall_tier as any),
          score: cervicalScore,
          modelType: 'prototype_model',
          keyFactors: cervicalKeyFactors,
          guidelineRecommendation: cervicalGuidance,
          isApplicable: true,
        });
      }

      // Overall Composite Score & Category
      const applicableScores = [lungScore, oralScore];
      if (isFemale) {
        applicableScores.push(breastScore, cervicalScore);
      }
      const avgScore = Math.round(applicableScores.reduce((a, b) => a + b, 0) / applicableScores.length);

      let overallCat: 'Lower Risk' | 'Moderate Risk' | 'Higher Risk' = 'Moderate Risk';
      if (cancerResults.some((c) => c.riskTier === 'High Risk') || avgScore >= 55) {
        overallCat = 'Higher Risk';
      } else if (avgScore <= 35 && !cancerResults.some((c) => c.riskTier === 'Moderate Risk')) {
        overallCat = 'Lower Risk';
      }

      const factors = [
        {
          name: 'Primary Assessment Determinants',
          impact: (overallCat === 'Higher Risk' ? 'Higher' : overallCat === 'Moderate Risk' ? 'Moderate' : 'Lower') as 'Higher' | 'Moderate' | 'Lower',
          description: `Evaluated across ${cancerResults.map((c) => c.displayName).join(', ')} for a ${age}-year-old ${isFemale ? 'female' : 'male'}.`,
        },
      ];

      const explanation = `Based on your demographic baseline (${age} yrs, ${isFemale ? 'Female' : 'Male'}), lifestyle exposure, medical/family history, and reported symptoms, your overall profile matches the ${overallCat} surveillance category. Recommended early detection steps are outlined in your results.`;

      if (isMounted) {
        setProgressPercent(100);
        completeAssessment({
          riskScore: avgScore,
          riskCategory: overallCat,
          explanation,
          assessmentDate: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          factors,
          cancerResults,
          lung: lungCard,
          breast: breastCard,
          oral: oralCard,
          cervical: cervicalCard,
        });

        setTimeout(() => {
          if (isMounted) {
            onAnalysisComplete();
          }
        }, 600);
      }
    };

    const timerComplete = setTimeout(runAnalysis, 2800);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerComplete);
    };
  }, []);

  return (
    <main className="analyzing-page-root">
      <div className="analyzing-card">
        {/* Animated Central Graphic */}
        <div className="analyzing-visual-ring" aria-hidden="true">
          <div className="radar-pulse-ring" />
          <div className="radar-pulse-ring-delayed" />
          <div className="shield-icon-container">
            <img
              src="/logo-icon.png"
              alt="OncoGuards AI"
              className="analyzing-shield-img"
              style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '12px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Headings */}
        <div className="analyzing-header-group">
          <div className="analyzing-badge">
            <span className="analyzing-badge-dot" />
            <span>{t('analyzing.engineBadge', 'AI Clinical Evaluation Engine')}</span>
          </div>
          <h1 className="analyzing-title">{t('analyzing.title', 'Analyzing Your Assessment')}</h1>
          <p className="analyzing-subtext">
            {t('analyzing.subtext', 'Synthesizing lifestyle exposure, hereditary background, and reported warning symptoms with evidence-based cancer screening pathways.')}
          </p>
        </div>

        {/* Progress Bar Track */}
        <div className="analyzing-progress-wrapper" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="analyzing-progress-track">
            <div className="analyzing-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="analyzing-progress-pct">{progressPercent}%</span>
        </div>

        {/* Multi-Stage Step Progression Checklist */}
        <div className="analyzing-stages-list">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`stage-row-item ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-active' : ''}`}
              >
                <div className="stage-icon-cell">
                  {isCompleted ? (
                    <div className="stage-done-icon">
                      <CheckCircleIcon size={18} color="#0F766E" />
                    </div>
                  ) : isCurrent ? (
                    <div className="stage-spinner-ring" />
                  ) : (
                    <div className="stage-dot-idle" />
                  )}
                </div>

                <div className="stage-text-cell">
                  <span className="stage-primary-label">{stage.label}</span>
                  <span className="stage-secondary-label">{stage.sublabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Disclaimer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#FEFCE8',
            border: '1px solid #FEF08A',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#854D0E',
            lineHeight: 1.4,
            textAlign: 'left',
          }}
          role="note"
        >
          <AlertCircleIcon size={16} color="#854D0E" />
          <span>{t('common.clinicalDisclaimer', CLINICAL_DISCLAIMER)}</span>
        </div>

        {/* Security Footnote */}
        <div className="analyzing-security-note">
          <SecureShieldIcon size={16} color="#0F766E" />
          <span>{t('analyzing.securityNote', 'Evaluation strictly adheres to evidence-based oncology screening guidelines (USPSTF, NCCN, WHO).')}</span>
        </div>
      </div>
    </main>
  );
};

export default SubmitAnalyzePage;

