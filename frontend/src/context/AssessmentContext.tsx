import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import {
  AssessmentState,
  BasicInfoData,
  LifestyleData,
  MedicalHistoryData,
  WomenOnlyData,
  ScreeningHistoryData,
  SymptomsData,
  BackendAnalysisResult,
  PastAssessmentRecord,
  initialAssessmentState,
  CancerTypeKey,
  AssessmentFlatPayload,
  buildAssessmentPayload,
  UploadedMedicalReport,
  RecordedSymptom,
} from '../types/assessment';

interface AssessmentContextValue {
  state: AssessmentState;
  pastAssessments: PastAssessmentRecord[];
  addUploadedReport: (report: Omit<UploadedMedicalReport, 'id'>) => void;
  removeUploadedReport: (id: string) => void;
  updateBasicInfo: (data: Partial<BasicInfoData>) => void;
  updateLifestyle: (data: Partial<LifestyleData>) => void;
  updateMedicalHistory: (data: Partial<MedicalHistoryData>) => void;
  updateWomenOnly: (data: Partial<WomenOnlyData>) => void;
  updateScreeningHistory: (data: Partial<ScreeningHistoryData>) => void;
  updateSymptoms: (data: Partial<SymptomsData>) => void;
  completeAssessment: (result?: BackendAnalysisResult) => void;
  markProfileCompleted: (isComplete?: boolean) => void;
  resetAssessment: () => void;
  isWomenSectionApplicable: boolean;
  isFemale: boolean;
  isMale: boolean;
  getBackendPayload: (overrideSymptoms?: SymptomsData) => AssessmentFlatPayload;
  buildAssessmentPayload: (overrideSymptoms?: SymptomsData) => AssessmentFlatPayload;
}

const STORAGE_KEY = 'oncoguards_health_profile_state_v4';
const PAST_ASSESSMENTS_KEY = 'oncoguards_past_assessments_v1';

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoadedFromDb, setIsLoadedFromDb] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state synchronously from localStorage to ensure zero-flash on refresh
  const [state, setState] = useState<AssessmentState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialAssessmentState,
          ...parsed,
          basicInfo: { ...initialAssessmentState.basicInfo, ...(parsed.basicInfo || {}) },
          lifestyle: { ...initialAssessmentState.lifestyle, ...(parsed.lifestyle || {}) },
          medicalHistory: { ...initialAssessmentState.medicalHistory, ...(parsed.medicalHistory || {}) },
          womenOnly: { ...initialAssessmentState.womenOnly, ...(parsed.womenOnly || {}) },
          screeningHistory: { ...initialAssessmentState.screeningHistory, ...(parsed.screeningHistory || {}) },
          symptoms: { ...initialAssessmentState.symptoms, ...(parsed.symptoms || {}) },
          hasCompletedAssessment: Boolean(parsed.hasCompletedAssessment || parsed.backendResult),
          hasCompletedProfile: Boolean(parsed.hasCompletedProfile),
          backendResult: parsed.backendResult,
        };
      }
    } catch {
      // ignore
    }
    return initialAssessmentState;
  });

  const [pastAssessments, setPastAssessments] = useState<PastAssessmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PAST_ASSESSMENTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Fetch and intelligently merge remote data from Firestore on user login/refresh
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setIsLoadedFromDb(true);
        return;
      }

      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data.assessmentState) {
            setState((prev) => {
              const remoteState = data.assessmentState;
              const isLocalCompleted = Boolean(prev.hasCompletedAssessment && prev.backendResult);
              const isRemoteCompleted = Boolean(remoteState.hasCompletedAssessment && remoteState.backendResult);

              const mergedBackendResult = isRemoteCompleted
                ? remoteState.backendResult
                : isLocalCompleted
                ? prev.backendResult
                : remoteState.backendResult || prev.backendResult;

              const mergedHasCompleted = Boolean(
                remoteState.hasCompletedAssessment || prev.hasCompletedAssessment || mergedBackendResult
              );

              const mergedState: AssessmentState = {
                ...prev,
                ...remoteState,
                basicInfo: { ...prev.basicInfo, ...(remoteState.basicInfo || {}) },
                lifestyle: { ...prev.lifestyle, ...(remoteState.lifestyle || {}) },
                medicalHistory: { ...prev.medicalHistory, ...(remoteState.medicalHistory || {}) },
                womenOnly: { ...prev.womenOnly, ...(remoteState.womenOnly || {}) },
                screeningHistory: { ...prev.screeningHistory, ...(remoteState.screeningHistory || {}) },
                symptoms: { ...prev.symptoms, ...(remoteState.symptoms || {}) },
                hasCompletedProfile: Boolean(remoteState.hasCompletedProfile || prev.hasCompletedProfile),
                hasCompletedAssessment: mergedHasCompleted,
                backendResult: mergedBackendResult,
              };

              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedState));
              } catch {}

              return mergedState;
            });
          }

          if (data.pastAssessments && Array.isArray(data.pastAssessments)) {
            setPastAssessments((prev) => {
              const remotePast: PastAssessmentRecord[] = data.pastAssessments;
              const merged = [...remotePast];
              prev.forEach((localRec) => {
                if (!merged.some((r) => r.id === localRec.id)) {
                  merged.push(localRec);
                }
              });

              try {
                localStorage.setItem(PAST_ASSESSMENTS_KEY, JSON.stringify(merged));
              } catch {}

              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
      } finally {
        setIsLoadedFromDb(true);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Sync state changes to localStorage and debounced Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }

    if (currentUser && isLoadedFromDb) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          await setDoc(docRef, { assessmentState: state }, { merge: true });
        } catch (error) {
          console.error('Error saving state to Firestore', error);
        }
      }, 1000);
    }
  }, [state, currentUser, isLoadedFromDb]);

  // Sync pastAssessments changes to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem(PAST_ASSESSMENTS_KEY, JSON.stringify(pastAssessments));
    } catch {
      // ignore
    }

    if (currentUser && isLoadedFromDb) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        setDoc(docRef, { pastAssessments }, { merge: true });
      } catch (error) {
        console.error('Error saving past assessments', error);
      }
    }
  }, [pastAssessments, currentUser, isLoadedFromDb]);

  const sexNormalized = (
    state.basicInfo.biological_sex ||
    state.basicInfo.biologicalSex ||
    ''
  ).toLowerCase();
  const isFemale = sexNormalized === 'female';
  const isMale = sexNormalized === 'male';
  const isWomenSectionApplicable = isFemale;

  const updateBasicInfo = (data: Partial<BasicInfoData>) => {
    const rawSex = data.biological_sex || data.biologicalSex || state.basicInfo.biologicalSex;
    const normalized = rawSex ? (rawSex.toLowerCase() as 'male' | 'female' | 'other') : '';

    setState((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        ...data,
        biologicalSex: rawSex,
        biological_sex: normalized,
      },
    }));
  };

  const updateLifestyle = (data: Partial<LifestyleData>) => {
    setState((prev) => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        ...data,
      },
    }));
  };

  const updateMedicalHistory = (data: Partial<MedicalHistoryData>) => {
    setState((prev) => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        ...data,
      },
    }));
  };

  const updateWomenOnly = (data: Partial<WomenOnlyData>) => {
    setState((prev) => ({
      ...prev,
      womenOnly: {
        ...prev.womenOnly,
        ...data,
      },
    }));
  };

  const updateScreeningHistory = (data: Partial<ScreeningHistoryData>) => {
    setState((prev) => ({
      ...prev,
      screeningHistory: {
        ...prev.screeningHistory,
        ...data,
      },
    }));
  };

  const updateSymptoms = (data: Partial<SymptomsData>) => {
    setState((prev) => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        ...data,
      },
    }));
  };

  const markProfileCompleted = (isComplete = true) => {
    setState((prev) => {
      const next = { ...prev, hasCompletedProfile: isComplete };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addUploadedReport = (report: Omit<UploadedMedicalReport, 'id'>) => {
    setState((prev) => {
      const newReport = { ...report, id: `REPORT-${Date.now()}` };
      return {
        ...prev,
        uploadedReports: prev.uploadedReports ? [newReport, ...prev.uploadedReports] : [newReport],
      };
    });
  };

  const removeUploadedReport = (id: string) => {
    setState((prev) => ({
      ...prev,
      uploadedReports: prev.uploadedReports?.filter((r) => r.id !== id),
    }));
  };

  // Complete assessment: Save immediately & synchronously to localStorage and Firestore
  const completeAssessment = (result?: BackendAnalysisResult) => {
    const finalResult = result ? result : state.backendResult;
    if (!finalResult) return;

    const nextState: AssessmentState = {
      ...state,
      hasCompletedAssessment: true,
      hasCompletedProfile: true,
      backendResult: finalResult,
    };

    const currentDate = new Date();
    const formattedShort = currentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedFull = currentDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const SYMPTOM_LABELS: Record<string, { label: string; category: string }> = {
      has_coughing_blood: { label: 'Blood when coughing (Hemoptysis)', category: 'Lung' },
      has_unexplained_weight_loss_lung: { label: 'Unexplained significant weight loss', category: 'Lung' },
      has_cough: { label: 'Persistent dry or worsening cough', category: 'Lung' },
      has_chest_pain: { label: 'Persistent chest or shoulder pain', category: 'Lung' },
      has_shortness_of_breath: { label: 'Shortness of breath', category: 'Lung' },
      has_wheezing: { label: 'Wheezing or noisy breathing', category: 'Lung' },
      has_difficulty_swallowing: { label: 'Difficulty swallowing (Dysphagia)', category: 'Lung' },
      has_frequent_cold: { label: 'Frequent chest colds / respiratory infections', category: 'Lung' },
      has_snoring: { label: 'Heavy snoring or sleep breathing pauses', category: 'Lung' },
      has_fatigue: { label: 'Persistent debilitating fatigue', category: 'Lung' },
      has_breast_lump: { label: 'Lump in breast or armpit', category: 'Breast' },
      has_breast_skin_changes: { label: 'Skin changes (dimpling, redness, or puckering)', category: 'Breast' },
      has_nipple_changes: { label: 'Nipple changes (inversion or discharge)', category: 'Breast' },
      has_breast_asymmetry: { label: 'Unexplained breast asymmetry', category: 'Breast' },
      has_breast_pain: { label: 'Persistent localized breast pain', category: 'Breast' },
      has_mouth_ulcer: { label: 'Non-healing mouth ulcer or sore (>3 weeks)', category: 'Oral' },
      has_oral_red_white_patches: { label: 'White or red mucosal patches (Leukoplakia / Erythroplakia)', category: 'Oral' },
      has_oral_bleeding: { label: 'Unexplained bleeding in oral cavity', category: 'Oral' },
      uses_smokeless_tobacco: { label: 'Smokeless tobacco use (gutkha/khaini/paan)', category: 'Oral' },
      has_abnormal_vaginal_bleeding: { label: 'Abnormal vaginal bleeding', category: 'Cervical' },
      has_post_coital_bleeding: { label: 'Post-coital vaginal bleeding', category: 'Cervical' },
      has_abnormal_vaginal_discharge: { label: 'Unusual or persistent vaginal discharge', category: 'Cervical' },
      has_pelvic_pain: { label: 'Persistent pelvic pain', category: 'Cervical' },
    };

    const recordedSymptoms: RecordedSymptom[] = (state.symptoms.selectedSymptoms || [])
      .filter((id) => id && id !== 'None of the above' && !id.toLowerCase().includes('none'))
      .map((id) => {
        const info = SYMPTOM_LABELS[id] || { label: id.replace(/^has_/, '').replace(/_/g, ' '), category: 'General' };
        const dur = state.symptoms.symptomDurations?.[id];
        const sev = state.symptoms.symptomSeverities?.[id];
        return {
          id,
          label: info.label,
          category: info.category,
          duration: dur,
          severity: sev,
        };
      });

    const cancerList: any[] = [];
    const types: CancerTypeKey[] = ['lung', 'breast', 'oral', 'cervical'];
    const evaluatedTiers: string[] = [];

    types.forEach((t) => {
      const res = finalResult[t as keyof BackendAnalysisResult] as any;
      if (res && res.overall_tier !== 'not_applicable') {
        evaluatedTiers.push(String(res.overall_tier).toLowerCase());
        cancerList.push({
          cancerType: t,
          displayName: t.charAt(0).toUpperCase() + t.slice(1) + ' Cancer',
          riskTier: res.overall_tier,
          riskScore: undefined,
          modelType: 'ml_model',
          recommendations: res.layer3?.recommended_actions || [],
          guidelineRecommendation: res.layer3?.guidance_text || '',
        });
      }
    });

    let calculatedOverallTier = 'LOWER';
    if (evaluatedTiers.some((tier) => tier.includes('high'))) calculatedOverallTier = 'HIGHER';
    else if (evaluatedTiers.some((tier) => tier.includes('med') || tier.includes('mod'))) calculatedOverallTier = 'MODERATE';

    const newRecord: PastAssessmentRecord = {
      id: `OG-${Date.now().toString().slice(-6)}`,
      date: formattedShort,
      fullDate: formattedFull,
      userDemographics: {
        name: state.basicInfo.fullName || 'Registered Patient',
        age: state.basicInfo.age || '',
        sex: state.basicInfo.biological_sex || state.basicInfo.biologicalSex || '',
        location:
          state.basicInfo.city && state.basicInfo.state
            ? `${state.basicInfo.city}, ${state.basicInfo.state}`
            : state.basicInfo.state || '',
      },
      cancerAssessments: cancerList,
      overallRiskTier: calculatedOverallTier,
      overallScore: typeof finalResult.riskScore === 'number' ? finalResult.riskScore : undefined,
      backendResult: finalResult,
      recordedSymptoms,
    };

    const nextPastAssessments = pastAssessments.some((a) => a.id === newRecord.id)
      ? pastAssessments
      : [newRecord, ...pastAssessments];

    // 1. Update React state
    setState(nextState);
    setPastAssessments(nextPastAssessments);

    // 2. Synchronously write to localStorage immediately (guarantees survival on instant refresh)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      localStorage.setItem(PAST_ASSESSMENTS_KEY, JSON.stringify(nextPastAssessments));
    } catch (err) {
      console.error('Error saving assessment to localStorage:', err);
    }

    // 3. Immediately sync to Firestore without delay
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        setDoc(docRef, { assessmentState: nextState, pastAssessments: nextPastAssessments }, { merge: true }).catch(
          (err) => console.error('Error saving to Firestore:', err)
        );
      } catch (err) {
        console.error('Error invoking setDoc on completeAssessment:', err);
      }
    }
  };

  const resetAssessment = () => {
    setState(initialAssessmentState);
    setPastAssessments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PAST_ASSESSMENTS_KEY);
    } catch {
      // ignore
    }
  };

  const getBackendPayload = (overrideSymptoms?: SymptomsData): AssessmentFlatPayload => {
    return buildAssessmentPayload(state, overrideSymptoms);
  };

  return (
    <AssessmentContext.Provider
      value={{
        state,
        pastAssessments,
        updateBasicInfo,
        updateLifestyle,
        updateMedicalHistory,
        updateWomenOnly,
        updateScreeningHistory,
        updateSymptoms,
        completeAssessment,
        markProfileCompleted,
        resetAssessment,
        addUploadedReport,
        removeUploadedReport,
        isWomenSectionApplicable,
        isFemale,
        isMale,
        getBackendPayload,
        buildAssessmentPayload: (overrideSymptoms?: SymptomsData) =>
          buildAssessmentPayload(state, overrideSymptoms),
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextValue => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

export default AssessmentProvider;
