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
  isHydrated: boolean;
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

const getStorageKey = (uid: string) => `oncoguards_health_profile_state_v4_${uid}`;
const getPastAssessmentsKey = (uid: string) => `oncoguards_past_assessments_v1_${uid}`;

const LEGACY_STORAGE_KEY = 'oncoguards_health_profile_state_v4';
const LEGACY_PAST_ASSESSMENTS_KEY = 'oncoguards_past_assessments_v1';

// Safely clean up un-scoped legacy keys to prevent cross-account data leakage
const cleanLegacyGlobalStorage = () => {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PAST_ASSESSMENTS_KEY);
  } catch {
    // ignore
  }
};

const loadLocalStateForUid = (uid: string): AssessmentState | null => {
  try {
    const saved = localStorage.getItem(getStorageKey(uid));
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
  return null;
};

const loadLocalPastAssessmentsForUid = (uid: string): PastAssessmentRecord[] => {
  try {
    const saved = localStorage.getItem(getPastAssessmentsKey(uid));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return [];
};

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoadedFromDb, setIsLoadedFromDb] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedUidRef = useRef<string | null>(null);

  // Clean legacy global keys on mount
  useEffect(() => {
    cleanLegacyGlobalStorage();
  }, []);

  // Initialize state synchronously from UID-scoped localStorage (or blank if no active UID or new user)
  const [state, setState] = useState<AssessmentState>(() => {
    cleanLegacyGlobalStorage();
    if (currentUser?.uid) {
      const local = loadLocalStateForUid(currentUser.uid);
      if (local) return local;
    }
    return initialAssessmentState;
  });

  const [pastAssessments, setPastAssessments] = useState<PastAssessmentRecord[]>(() => {
    if (currentUser?.uid) {
      return loadLocalPastAssessmentsForUid(currentUser.uid);
    }
    return [];
  });

  // Handle user login, logout, and switching with strict UID isolation
  useEffect(() => {
    // 1. User logged out or guest mount
    if (!currentUser) {
      loadedUidRef.current = null;
      setIsLoadedFromDb(false);
      setIsHydrated(true); // Unauthenticated guest is ready with clean default state
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setState(initialAssessmentState);
      setPastAssessments([]);
      return;
    }

    const targetUid = currentUser.uid;

    // If UID has not changed (e.g. Firebase token refresh with new object reference), do not re-fetch/re-hydrate!
    if (loadedUidRef.current === targetUid) {
      return;
    }

    // 2. User switched or first load for this user
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setIsLoadedFromDb(false);
    setIsHydrated(false);

    // Optimistically load cached local state for this specific UID if present
    const localState = loadLocalStateForUid(targetUid);
    const localPast = loadLocalPastAssessmentsForUid(targetUid);
    setState(localState || initialAssessmentState);
    setPastAssessments(localPast);

    let isCancelled = false;

    // 3. Fetch from Firestore for the active UID
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', targetUid);
        const docSnap = await getDoc(docRef);

        if (isCancelled) return;

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data.assessmentState) {
            const remoteState = data.assessmentState;
            const mergedState: AssessmentState = {
              ...initialAssessmentState,
              ...remoteState,
              basicInfo: { ...initialAssessmentState.basicInfo, ...(remoteState.basicInfo || {}) },
              lifestyle: { ...initialAssessmentState.lifestyle, ...(remoteState.lifestyle || {}) },
              medicalHistory: { ...initialAssessmentState.medicalHistory, ...(remoteState.medicalHistory || {}) },
              womenOnly: { ...initialAssessmentState.womenOnly, ...(remoteState.womenOnly || {}) },
              screeningHistory: { ...initialAssessmentState.screeningHistory, ...(remoteState.screeningHistory || {}) },
              symptoms: { ...initialAssessmentState.symptoms, ...(remoteState.symptoms || {}) },
              hasCompletedProfile: Boolean(remoteState.hasCompletedProfile),
              hasCompletedAssessment: Boolean(remoteState.hasCompletedAssessment || remoteState.backendResult),
              backendResult: remoteState.backendResult,
            };

            setState(mergedState);
            try {
              localStorage.setItem(getStorageKey(targetUid), JSON.stringify(mergedState));
            } catch {}
          } else {
            // Document exists but has no assessmentState -> check local or blank
            const localState = loadLocalStateForUid(targetUid);
            if (!localState) {
              setState(initialAssessmentState);
            }
          }

          if (data.pastAssessments && Array.isArray(data.pastAssessments)) {
            setPastAssessments(data.pastAssessments);
            try {
              localStorage.setItem(getPastAssessmentsKey(targetUid), JSON.stringify(data.pastAssessments));
            } catch {}
          } else {
            const localPast = loadLocalPastAssessmentsForUid(targetUid);
            if (!localPast.length) {
              setPastAssessments([]);
            }
          }
        } else {
          // Document does NOT exist -> Brand new user!
          // Strictly initialize to blank initial state if no local cache exists for this UID
          const localState = loadLocalStateForUid(targetUid);
          if (!localState) {
            setState(initialAssessmentState);
          }
          const localPast = loadLocalPastAssessmentsForUid(targetUid);
          if (!localPast.length) {
            setPastAssessments([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
      } finally {
        if (!isCancelled) {
          loadedUidRef.current = targetUid;
          setIsLoadedFromDb(true);
          setIsHydrated(true);
        }
      }
    };

    fetchUserData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.uid]);

  // Sync state changes to UID-scoped localStorage and debounced Firestore
  useEffect(() => {
    if (!currentUser || loadedUidRef.current !== currentUser.uid) {
      return;
    }

    const currentUid = currentUser.uid;

    try {
      localStorage.setItem(getStorageKey(currentUid), JSON.stringify(state));
    } catch {
      // ignore
    }

    // Only sync to Firestore after remote doc has resolved for this UID to prevent overwriting with stale initial data
    if (isLoadedFromDb && isHydrated && loadedUidRef.current === currentUid) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          if (loadedUidRef.current === currentUid) {
            const docRef = doc(db, 'users', currentUid);
            await setDoc(docRef, { assessmentState: state }, { merge: true });
          }
        } catch (error) {
          console.error('Error saving state to Firestore', error);
        }
      }, 1000);
    }
  }, [state, currentUser?.uid, isLoadedFromDb, isHydrated]);

  // Sync pastAssessments changes to UID-scoped localStorage and Firestore
  useEffect(() => {
    if (!currentUser || loadedUidRef.current !== currentUser.uid) {
      return;
    }

    const currentUid = currentUser.uid;

    try {
      localStorage.setItem(getPastAssessmentsKey(currentUid), JSON.stringify(pastAssessments));
    } catch {
      // ignore
    }

    if (isLoadedFromDb && isHydrated && loadedUidRef.current === currentUid) {
      try {
        if (loadedUidRef.current === currentUid) {
          const docRef = doc(db, 'users', currentUid);
          setDoc(docRef, { pastAssessments }, { merge: true });
        }
      } catch (error) {
        console.error('Error saving past assessments', error);
      }
    }
  }, [pastAssessments, currentUser?.uid, isLoadedFromDb, isHydrated]);

  const sexNormalized = (
    state.basicInfo.biological_sex ||
    state.basicInfo.biologicalSex ||
    ''
  ).toLowerCase();
  const isFemale = sexNormalized === 'female';
  const isMale = sexNormalized === 'male';
  const isWomenSectionApplicable = isFemale;

  const updateBasicInfo = (data: Partial<BasicInfoData>) => {
    setState((prev) => {
      const rawSex = data.biological_sex || data.biologicalSex || prev.basicInfo.biologicalSex || prev.basicInfo.biological_sex || '';
      const normalized = rawSex ? (rawSex.toLowerCase() as 'male' | 'female' | 'other') : '';

      return {
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          ...data,
          biologicalSex: rawSex,
          biological_sex: normalized,
        },
      };
    });
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
      if (currentUser) {
        try {
          localStorage.setItem(getStorageKey(currentUser.uid), JSON.stringify(next));
        } catch {}
      }
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

  // Complete assessment: Save immediately & synchronously to UID-scoped localStorage and Firestore
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
        name: state.basicInfo.fullName?.trim() || 'Registered User',
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

    // 2. Synchronously write to UID-scoped localStorage immediately (guarantees survival on instant refresh)
    if (currentUser) {
      try {
        localStorage.setItem(getStorageKey(currentUser.uid), JSON.stringify(nextState));
        localStorage.setItem(getPastAssessmentsKey(currentUser.uid), JSON.stringify(nextPastAssessments));
      } catch (err) {
        console.error('Error saving assessment to localStorage:', err);
      }

      // 3. Immediately sync to Firestore without delay
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
    if (currentUser) {
      try {
        localStorage.removeItem(getStorageKey(currentUser.uid));
        localStorage.removeItem(getPastAssessmentsKey(currentUser.uid));
      } catch {
        // ignore
      }
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
        isHydrated,
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
