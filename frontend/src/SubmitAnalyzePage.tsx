import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, SecureShieldIcon, AlertCircleIcon } from './assets/MedicalIcons';
import { useAssessment } from './context/AssessmentContext';
import { CancerResultItem, RiskTier } from './types/assessment';
import { CLINICAL_DISCLAIMER } from './config/screeningGuidelines';
import { API_BASE_URL } from './config/api';
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
  const [apiError, setApiError] = useState<string | null>(null);

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

      let backendData: any = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${API_BASE_URL}/api/v1/assessment`, {
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
        } else {
          let errorDetail = `API returned status ${response.status}`;
          try {
            const errorJson = await response.json();
            if (errorJson.detail) {
              errorDetail = `${errorDetail}: ${JSON.stringify(errorJson.detail)}`;
            }
          } catch (e) {
            // Ignore JSON parse error if response is not JSON
          }
          throw new Error(errorDetail);
        }
      } catch (err) {
        console.error('[assessment] backend call failed:', err);
        setApiError(err instanceof Error ? err.message : 'Unknown error');
        setProgressPercent(100);
        return; // Abort further execution on error
      }

      // Helper for tier conversion
      const toDisplayTier = (t: string): RiskTier => {
        const lower = String(t || '').toLowerCase();
        if (lower.includes('high')) return 'High Risk';
        if (lower.includes('med') || lower.includes('mod')) return 'Moderate Risk';
        return 'Low Risk';
      };

      const humanizeFactor = (factor: string): string => {
        return factor
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      const extractGuidance = (layer3: any): string | undefined => {
        if (!layer3) return undefined;
        if (typeof layer3 === 'string') return layer3;
        return layer3.guidance_text ?? undefined;
      };

      const cancerResults: CancerResultItem[] = [];

      if (backendData?.lung) {
        cancerResults.push({
          cancerType: 'lung',
          displayName: 'Lung Health',
          riskTier: toDisplayTier(backendData.lung.overall_tier),
          score: backendData.lung.layer2?.model_score || 0,
          modelType: 'ml_model',
          keyFactors: (backendData.lung.layer1?.triggered_factors || []).map(humanizeFactor),
          guidelineRecommendation: extractGuidance(backendData.lung.layer3),
          isApplicable: true,
        });
      }

      if (backendData?.oral) {
        cancerResults.push({
          cancerType: 'oral',
          displayName: 'Oral Health',
          riskTier: toDisplayTier(backendData.oral.overall_tier),
          score: backendData.oral.layer2?.model_score || 0,
          modelType: 'prototype_model',
          keyFactors: (backendData.oral.layer1?.triggered_factors || []).map(humanizeFactor),
          guidelineRecommendation: extractGuidance(backendData.oral.layer3),
          isApplicable: true,
        });
      }

      if (isFemale) {
        if (backendData?.breast) {
          cancerResults.push({
            cancerType: 'breast',
            displayName: 'Breast Health',
            riskTier: toDisplayTier(backendData.breast.overall_tier),
            score: backendData.breast.layer2?.model_score || 0,
            modelType: 'prototype_model',
            keyFactors: (backendData.breast.layer1?.triggered_factors || []).map(humanizeFactor),
            guidelineRecommendation: extractGuidance(backendData.breast.layer3),
            isApplicable: true,
          });
        }
        if (backendData?.cervical) {
          cancerResults.push({
            cancerType: 'cervical',
            displayName: 'Cervical Health',
            riskTier: toDisplayTier(backendData.cervical.overall_tier),
            score: backendData.cervical.layer2?.model_score || 0,
            modelType: 'prototype_model',
            keyFactors: (backendData.cervical.layer1?.triggered_factors || []).map(humanizeFactor),
            guidelineRecommendation: extractGuidance(backendData.cervical.layer3),
            isApplicable: true,
          });
        }
      }
      
      const overallCat = backendData?.risk_category || backendData?.riskCategory || 'Moderate Risk';
      const avgScore = backendData?.risk_score || backendData?.riskScore || 0;
      const explanation = backendData?.explanation || `Based on your demographic baseline, lifestyle exposure, medical/family history, and reported symptoms, your overall profile matches the ${overallCat} surveillance category. Recommended early detection steps are outlined in your results.`;
      
      const factors = backendData?.factors || [
        {
          name: 'Primary Assessment Determinants',
          impact: (overallCat === 'Higher Risk' || overallCat === 'High Risk' ? 'Higher' : overallCat.includes('Moderate') ? 'Moderate' : 'Lower'),
          description: `Evaluated across ${cancerResults.map((c) => c.displayName).join(', ')} for a ${age}-year-old ${isFemale ? 'female' : 'male'}.`,
        },
      ];

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
          lung: backendData?.lung,
          breast: backendData?.breast,
          oral: backendData?.oral,
          cervical: backendData?.cervical,
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

  if (apiError) {
    return (
      <main className="analyzing-page-root">
        <div className="analyzing-card" style={{ textAlign: 'center' }}>
          <div className="error-icon" style={{ fontSize: '3rem', color: '#EF4444', marginBottom: '1rem' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.5rem' }}>
            Connection Error
          </h2>
          <p style={{ color: '#64748B', marginBottom: '1rem' }}>
            Unable to reach the analysis server. Please ensure you are connected to the network and try again.
          </p>
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', wordBreak: 'break-word', textAlign: 'left' }}>
            <strong>Error Details:</strong> {apiError}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Retry Analysis
          </button>
        </div>
      </main>
    );
  }

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
            {t('analyzing.subtext', 'Synthesizing lifestyle exposure, hereditary background, and reported warning symptoms with evidence-based health screening pathways.')}
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

