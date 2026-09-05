export type BiologicalSex = 'male' | 'female' | 'other' | 'Male' | 'Female' | 'Other';

export interface BasicInfoData {
  fullName: string;
  age: string;
  biologicalSex: BiologicalSex | '';
  biological_sex?: 'male' | 'female' | 'other' | '';
  city: string;
  state: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  googleConnected?: boolean;
  googleEmail?: string;
}

export interface LifestyleData {
  // Backend mapped fields
  isCurrentSmoker?: boolean | string;
  usesSmokelessTobacco?: boolean | string;
  isAlcoholConsuming?: boolean | string;
  hasOccupationalExposure?: boolean | string;
  airPollutionExposure?: string;
  dustAllergySeverity?: string;
  hasYellowFingers?: boolean | string;
  hasPeerPressure?: boolean | string;

  // Specific required options: never/cigarette/bidi/smokeless/multiple types, + duration if used
  tobaccoUse: 'never' | 'cigarette' | 'bidi' | 'smokeless' | 'multiple types' | string;
  tobaccoDuration: string;
  alcoholConsumption: string;
  dietDescription: string;
  physicalActivityLevel: string;
  overweightStatus: string;
}

export interface MedicalHistoryData {
  // Family history of cancer (+ type if yes)
  hasFamilyCancerHistory: 'Yes' | 'No' | 'Not sure' | string;
  familyCancerTypes: string[];
  familyCancerOtherText?: string;
  hasFamilyHistoryLungCancer?: boolean;
  hasFamilyHistoryBreastCancer?: boolean;
  hasChronicDisease?: boolean;
  hasAllergy?: boolean;
  hasAnxiety?: boolean;

  // Medical conditions: HPV, Hep B, Hep C, diabetes, none, not sure (+ others)
  medicalConditions: string[];

  // Previous cancer diagnosis (+ type if yes)
  hasPreviousCancerDiagnosis: 'Yes' | 'No' | string;
  previousCancerType?: string;
  previousCancerOtherText?: string;
  previousCancerDiagnosisTime?: string;
  lastCancerScreening?: string;
}

export interface WomenOnlyData {
  // Rendered ONLY when biological_sex === 'female'
  agePeriodsBegan: string; // e.g. '<12', '12–14', '15+'
  firstPeriodAge?: string;
  menopauseStatus: 'Premenopausal' | 'Perimenopausal' | 'Postmenopausal' | 'Yes' | 'No' | string;
  menopauseAge?: string;
  hadSurgicalMenopause?: 'Natural' | 'Surgical' | 'No' | 'Yes' | string;
  pregnancyHistory: string; // e.g. 'Never pregnant', '1–2 children', '3+ children', 'Yes', 'No'
  ageAtFirstBirth?: string; // e.g. '<30', '30+', 'Nulliparous'
  hadChildren?: string;
  oralContraceptiveUse: 'Never used' | 'Past user' | 'Current user' | 'Yes' | 'No' | string;
  oralContraceptiveYears?: number | string;
  hormoneReplacementTherapy: 'Never used' | 'Past user' | 'Current user' | 'Yes' | 'No' | string;
  usedHormoneTherapy?: string;
  usedIud?: 'No' | 'Yes' | string;
  iudYears?: number | string;
  hpvVaccinationStatus: 'Vaccinated (Complete)' | 'Partially vaccinated' | 'Not vaccinated' | 'Not sure' | string;
  isHpvPositive?: boolean | string;
  isScreeningOverdue?: boolean | string;
  priorMammogram?: string;
  lastMammogramResult?: 'Negative / Normal' | 'Benign / False Positive' | 'Unknown' | string;
  breastDensity?: 'Almost entirely fat (1)' | 'Scattered fibroglandular (2)' | 'Heterogeneously dense (3)' | 'Extremely dense (4)' | 'Unknown' | string;
  numRelativesWithBreastCancer?: string | number;
  hasPriorBreastProcedure?: 'No' | 'Yes' | 'Unknown' | string;
  numSexualPartners?: number | string;
  firstIntercourseAge?: number | string;
  stdCount?: string | number;
  cervicalSmokingYears?: string | number;
  raceEthnicity?: 'White' | 'Asian / Pacific Islander' | 'Black' | 'Native American' | 'Other / Mixed' | 'Unknown' | string;
  isHispanic?: 'No' | 'Yes' | 'Unknown' | string;
}

export interface ScreeningHistoryData {
  hasPreviousScreening: 'Yes' | 'No' | 'Not sure' | string;
  screeningsDone: string[]; // e.g. 'Mammogram', 'Pap smear / HPV test', 'Low-Dose CT', 'Oral mucosal examination', 'Colonoscopy'
  lastCancerScreening?: string;
}

export interface SymptomItemDefinition {
  id: string;
  label: string;
  description: string;
  category: 'lung' | 'breast' | 'oral' | 'cervical' | 'general';
  isRedFlag?: boolean;
  isFemaleOnly?: boolean;
}

export interface SymptomsData {
  selectedSymptoms: string[]; // List of symptom IDs
  symptomDurations: Record<string, string>; // symptom ID -> duration bucket string ('<1 week' | '1–2 weeks' | '2–4 weeks' | '1–3 months' | '3+ months')
  symptomSeverities?: Record<string, 'None' | 'Mild' | 'Moderate' | 'Severe' | number | string>;
}

export type CancerTypeKey = 'lung' | 'breast' | 'oral' | 'cervical';
export type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'not_applicable' | 'Low' | 'Moderate' | 'High';
export type ModelType = 'ml_model' | 'ml_xgboost' | 'prototype_model';

export interface CancerResultItem {
  cancerType: CancerTypeKey;
  displayName: string;
  riskTier: RiskTier;
  riskScore?: number; // 0 - 100
  score?: number; // 0 - 100
  modelType: ModelType;
  keyFactors: string[];
  guidelineRecommendation?: string;
  recommendations?: string[];
  summary?: string;
  isApplicable?: boolean;
}

export interface BackendFactorItem {
  name: string;
  impact: 'Higher' | 'Moderate' | 'Lower' | string;
  description: string;
}

export interface AssessmentResponseCard {
  overall_tier: 'low' | 'medium' | 'high' | 'not_applicable';
  layer1: {
    triggered_factors: string[];
    [key: string]: any;
  } | null;
  layer2: any; // SHAP / Feature importance / severity signals
  layer3: any; // Guidance text
}

export interface BackendAnalysisResult {
  lung?: AssessmentResponseCard;
  breast?: AssessmentResponseCard;
  oral?: AssessmentResponseCard;
  cervical?: AssessmentResponseCard;
  
  // Backward compatibility fields
  riskCategory?: string;
  riskScore?: string | number;
  explanation?: string;
  assessmentDate?: string;
  cancerResults?: CancerResultItem[];
  cancers?: any;
  factors?: any[];
  overallAssessment?: any;
}

export interface RecordedSymptom {
  id: string;
  label: string;
  category?: string;
  duration?: string;
  severity?: string | number;
}

export interface PastAssessmentRecord {
  id: string;
  date: string;
  fullDate: string;
  userDemographics: {
    name: string;
    age: string;
    sex: string;
    location: string;
  };
  cancerAssessments: Array<{
    cancerType: CancerTypeKey;
    displayName: string;
    riskTier: RiskTier;
    riskScore?: number;
    modelType: ModelType;
    recommendations?: string[];
    guidelineRecommendation?: string;
  }>;
  overallRiskTier: string;
  overallScore?: number;
  backendResult?: BackendAnalysisResult;
  recordedSymptoms?: RecordedSymptom[];
}

export interface UploadedMedicalReport {
  id: string;
  name: string;
  date: string;
  size: number;
  type: string;
  storageRef: string;
}

export interface AssessmentState {
  basicInfo: BasicInfoData;
  lifestyle: LifestyleData;
  medicalHistory: MedicalHistoryData;
  womenOnly: WomenOnlyData;
  screeningHistory: ScreeningHistoryData;
  symptoms: SymptomsData;
  uploadedReports?: UploadedMedicalReport[];
  backendResult?: BackendAnalysisResult;
  hasCompletedAssessment?: boolean;
  hasCompletedProfile?: boolean;
  completedSections: number[];
}

export const initialAssessmentState: AssessmentState = {
  basicInfo: {
    fullName: '',
    age: '',
    biologicalSex: '',
    biological_sex: '',
    city: '',
    state: '',
  },
  lifestyle: {
    isCurrentSmoker: false,
    usesSmokelessTobacco: false,
    isAlcoholConsuming: false,
    hasOccupationalExposure: false,
    hasYellowFingers: false,
    hasPeerPressure: false,
    tobaccoUse: '',
    tobaccoDuration: '',
    alcoholConsumption: '',
    dietDescription: '',
    physicalActivityLevel: '',
    overweightStatus: '',
  },
  medicalHistory: {
    hasFamilyHistoryLungCancer: false,
    hasFamilyHistoryBreastCancer: false,
    hasChronicDisease: false,
    hasAllergy: false,
    hasAnxiety: false,
    hasFamilyCancerHistory: '',
    familyCancerTypes: [],
    familyCancerOtherText: '',
    medicalConditions: [],
    hasPreviousCancerDiagnosis: '',
    previousCancerType: '',
    previousCancerOtherText: '',
    previousCancerDiagnosisTime: '',
    lastCancerScreening: '',
  },
  womenOnly: {
    agePeriodsBegan: '',
    firstPeriodAge: '',
    menopauseStatus: '',
    menopauseAge: '',
    hadSurgicalMenopause: '',
    pregnancyHistory: '',
    ageAtFirstBirth: '',
    hadChildren: '',
    oralContraceptiveUse: '',
    oralContraceptiveYears: 0,
    hormoneReplacementTherapy: '',
    usedHormoneTherapy: '',
    usedIud: '',
    iudYears: 0,
    hpvVaccinationStatus: '',
    isHpvPositive: false,
    isScreeningOverdue: false,
    priorMammogram: '',
    lastMammogramResult: '',
    breastDensity: '',
    numRelativesWithBreastCancer: '',
    hasPriorBreastProcedure: '',
    numSexualPartners: '',
    firstIntercourseAge: '',
    raceEthnicity: '',
    isHispanic: '',
  },
  screeningHistory: {
    hasPreviousScreening: '',
    screeningsDone: [],
    lastCancerScreening: '',
  },
  symptoms: {
    selectedSymptoms: [],
    symptomDurations: {},
    symptomSeverities: {},
  },
  hasCompletedAssessment: false,
  hasCompletedProfile: false,
  completedSections: [],
};

/**
 * Converts friendly UI duration buckets to representative integer weeks for backend Pydantic schemas.
 */
export function durationBucketToWeeks(bucketString?: string): number {
  if (!bucketString) return 0;
  const trimmed = bucketString.trim().toLowerCase();
  if (trimmed.includes('less than 1') || trimmed.includes('< 1') || trimmed.includes('<1')) return 0;
  if (trimmed.includes('1–2') || trimmed.includes('1-2') || trimmed.includes('1 to 2')) return 1;
  if (trimmed.includes('2–4') || trimmed.includes('2-4') || trimmed.includes('2 to 4')) return 3;
  if (trimmed.includes('1–3 month') || trimmed.includes('1-3 month') || trimmed.includes('1 to 3 month')) return 8;
  if (trimmed.includes('3+ month') || trimmed.includes('more than 3') || trimmed.includes('> 3')) return 16;
  
  const match = bucketString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Converts qualitative Symptoms Tracker / Health Profile answers into an integer (1–9 scale).
 * None / Never / No / <1 week -> 1
 * Mild / Rarely / Light / 1–2 weeks -> 4
 * Moderate / Occasionally / 2–4 weeks / 1–3 months -> 6
 * Severe / Frequently / Very frequent / Daily / 3+ months -> 9
 * Defaults to 1 (never 0).
 */
export function mapSeverityToScale(value?: string | boolean | number): number {
  if (value === undefined || value === null) return 1;
  if (typeof value === 'number') {
    if (isNaN(value) || value <= 0) return 1;
    return Math.min(Math.max(Math.round(value), 1), 9);
  }
  if (typeof value === 'boolean') {
    return value ? 6 : 1;
  }
  const str = String(value).trim().toLowerCase();
  if (!str || str === 'none' || str === 'never' || str === 'no' || str === '0' || str === 'false') {
    return 1;
  }
  // Direct numeric value parsing (1 to 9 scale for model inputs)
  const directNum = parseInt(str, 10);
  if (!isNaN(directNum) && directNum >= 1 && directNum <= 9) {
    return directNum;
  }
  if (
    str.includes('<1') ||
    str.includes('less than 1') ||
    str.includes('mild') ||
    str.includes('rarely') ||
    str.includes('light') ||
    str.includes('1–2') ||
    str.includes('1-2') ||
    str.includes('1 to 2') ||
    str.includes('1 to 5')
  ) {
    return 4;
  }
  if (
    str.includes('moderate') ||
    str.includes('occasionally') ||
    str.includes('sometimes') ||
    str.includes('2–4') ||
    str.includes('2-4') ||
    str.includes('2 to 4') ||
    str.includes('1–3 month') ||
    str.includes('1-3 month') ||
    str.includes('5 to 10')
  ) {
    return 6;
  }
  if (
    str.includes('severe') ||
    str.includes('very') ||
    str.includes('frequently') ||
    str.includes('daily') ||
    str.includes('active') ||
    str.includes('regularly') ||
    str.includes('high') ||
    str.includes('3+') ||
    str.includes('more than') ||
    str.includes('yes')
  ) {
    return 9;
  }
  return 1;
}

export interface AssessmentFlatPayload {
  // Base fields
  age: number;
  gender: 'male' | 'female' | 'other';

  // Lung Layer 1 Rule Engine
  is_current_smoker: boolean;
  cough_duration_weeks: number;
  has_family_history_lung_cancer: boolean;
  has_occupational_exposure: boolean;
  has_coughing_blood: boolean;
  has_difficulty_swallowing: boolean;
  has_neck_swelling: boolean;
  is_alcohol_consuming: boolean;

  // Lung Layer 2 ML Model (1-9 ordinal scale)
  lung_air_pollution_exposure: number;
  lung_alcohol_use_severity: number;
  lung_dust_allergy_severity: number;
  lung_occupational_hazard_severity: number;
  lung_genetic_risk: number;
  lung_chronic_disease_severity: number;
  lung_diet_balance: number;
  lung_obesity_level: number;
  lung_smoking_severity: number;
  lung_passive_smoking_severity: number;
  lung_chest_pain_severity: number;
  lung_coughing_blood_severity: number;
  lung_fatigue_severity: number;
  lung_weight_loss_severity: number;
  lung_shortness_of_breath_severity: number;
  lung_wheezing_severity: number;
  lung_swallowing_difficulty_severity: number;
  lung_finger_clubbing_severity: number;
  lung_frequent_cold_severity: number;
  lung_dry_cough_severity: number;
  lung_snoring_severity: number;

  // Breast Layer 1 Rule Engine
  has_breast_lump: boolean;
  breast_lump_duration_weeks: number;
  has_nipple_discharge: boolean;
  has_breast_skin_changes: boolean;
  has_family_history_breast_cancer: boolean;

  // Breast Layer 2 ML Model (BCSC dataset, default 9)
  breast_menopausal_status: number;
  breast_density: number;
  breast_race: number;
  breast_is_hispanic: number;
  breast_bmi_category: number;
  breast_age_at_first_birth_category: number;
  breast_num_relatives_with_breast_cancer: number;
  breast_has_prior_breast_procedure: number;
  breast_last_mammogram_result: number;
  breast_had_surgical_menopause: number;
  breast_uses_hormone_therapy: number;

  // Oral Layer 1 Rule Engine
  has_mouth_ulcer: boolean;
  mouth_ulcer_duration_weeks: number;
  has_oral_red_white_patches: boolean;
  uses_smokeless_tobacco: boolean;

  // Cervical Layer 1 Rule Engine
  has_abnormal_vaginal_bleeding: boolean;
  has_abnormal_vaginal_discharge: boolean;
  has_pelvic_pain: boolean;
  is_hpv_positive: boolean;
  is_screening_overdue: boolean;

  // Cervical Layer 2 ML Model (UCI dataset)
  cervical_num_sexual_partners: number;
  cervical_first_intercourse_age: number;
  cervical_num_pregnancies: number;
  cervical_smoking_years: number;
  cervical_uses_hormonal_contraceptives: boolean;
  cervical_hormonal_contraceptive_years: number;
  cervical_has_used_iud: boolean;
  cervical_iud_years: number;
  cervical_has_std_history: boolean;
  cervical_std_count: number;
}

export function buildAssessmentPayload(
  state: AssessmentState,
  overrideSymptoms?: SymptomsData
): AssessmentFlatPayload {
  const { basicInfo, lifestyle, medicalHistory, womenOnly, screeningHistory } = state;
  const symptoms = overrideSymptoms || state.symptoms;

  const ageNum = parseInt(basicInfo.age || '40', 10) || 40;
  const rawSex = (basicInfo.biological_sex || basicInfo.biologicalSex || 'other').toLowerCase();
  const gender: 'male' | 'female' | 'other' =
    rawSex === 'male' || rawSex === 'female' ? rawSex : 'other';

  const isCurrentSmoker = Boolean(
    lifestyle.isCurrentSmoker === true ||
    lifestyle.isCurrentSmoker === 'Yes' ||
    lifestyle.tobaccoUse === 'cigarette' ||
    lifestyle.tobaccoUse === 'bidi' ||
    lifestyle.tobaccoUse === 'multiple types' ||
    lifestyle.tobaccoUse?.includes('cigarette') ||
    lifestyle.tobaccoUse?.includes('bidi')
  );

  const selectedSyms = symptoms.selectedSymptoms || [];
  const symDurations = symptoms.symptomDurations || {};

  const coughSelected = selectedSyms.includes('has_cough') || selectedSyms.includes('has_dry_cough');
  const cough_duration_weeks = coughSelected
    ? durationBucketToWeeks(symDurations['has_cough'] || symDurations['has_dry_cough'])
    : 0;

  const has_family_history_lung_cancer = Boolean(
    medicalHistory.familyCancerTypes?.includes('Lung Cancer') ||
    medicalHistory.hasFamilyHistoryLungCancer
  );

  const has_occupational_exposure = Boolean(
    lifestyle.hasOccupationalExposure === true ||
    lifestyle.hasOccupationalExposure === 'Yes'
  );

  const has_coughing_blood = selectedSyms.includes('has_coughing_blood');
  const has_difficulty_swallowing = Boolean(
    selectedSyms.includes('has_difficulty_swallowing') ||
    selectedSyms.includes('has_hoarseness_3w') ||
    selectedSyms.includes('has_swallowing_difficulty')
  );
  const has_neck_swelling = Boolean(
    selectedSyms.includes('has_oral_lump') ||
    selectedSyms.includes('has_neck_swelling') ||
    selectedSyms.includes('has_new_lump')
  );

  const is_alcohol_consuming = Boolean(
    lifestyle.isAlcoholConsuming === true ||
    lifestyle.isAlcoholConsuming === 'Yes' ||
    (lifestyle.alcoholConsumption && lifestyle.alcoholConsumption !== 'Never')
  );

  // Severities (1-9 scale, default 1, never 0)
  let lung_air_pollution_exposure = 1;
  if (lifestyle.airPollutionExposure) {
    if (lifestyle.airPollutionExposure.startsWith('High')) lung_air_pollution_exposure = 8;
    else if (lifestyle.airPollutionExposure.startsWith('Moderate')) lung_air_pollution_exposure = 5;
    else lung_air_pollution_exposure = 2;
  } else {
    lung_air_pollution_exposure = has_occupational_exposure ? 6 : 1;
  }

  const lung_alcohol_use_severity = mapSeverityToScale(lifestyle.alcoholConsumption);

  let lung_dust_allergy_severity = 1;
  if (lifestyle.dustAllergySeverity) {
    if (lifestyle.dustAllergySeverity.includes('Severe')) lung_dust_allergy_severity = 8;
    else if (lifestyle.dustAllergySeverity.includes('Moderate')) lung_dust_allergy_severity = 5;
    else if (lifestyle.dustAllergySeverity.includes('Mild')) lung_dust_allergy_severity = 3;
    else lung_dust_allergy_severity = 1;
  } else {
    lung_dust_allergy_severity =
      medicalHistory.hasAllergy ||
      medicalHistory.medicalConditions?.some((c) => c.toLowerCase().includes('lung') || c.toLowerCase().includes('asthma'))
        ? 6
        : 1;
  }
  const lung_occupational_hazard_severity = has_occupational_exposure ? 6 : 1;
  const lung_genetic_risk = has_family_history_lung_cancer ? 7 : 1;
  const lung_chronic_disease_severity = medicalHistory.medicalConditions?.some(
    (c) => c.toLowerCase().includes('copd') || c.toLowerCase().includes('bronchitis') || c.toLowerCase().includes('lung')
  )
    ? 7
    : 1;
  const lung_diet_balance = lifestyle.dietDescription?.includes('Lots of processed')
    ? 8
    : lifestyle.dietDescription?.includes('High red meat')
    ? 6
    : 1;
  const lung_obesity_level =
    lifestyle.overweightStatus === 'Yes' ? 7 : lifestyle.overweightStatus === 'Not sure' ? 4 : 1;
  const lung_smoking_severity = isCurrentSmoker
    ? mapSeverityToScale(lifestyle.tobaccoDuration || 'Moderate')
    : 1;
  const lung_passive_smoking_severity = 1;

  const symSeverities = symptoms.symptomSeverities || {};

  const getSymptomSeverity = (symptomId: string): number => {
    if (!selectedSyms.includes(symptomId)) return 1;
    if (symSeverities[symptomId]) {
      return mapSeverityToScale(symSeverities[symptomId]);
    }
    return symDurations[symptomId] ? mapSeverityToScale(symDurations[symptomId]) : 6;
  };

  const lung_chest_pain_severity = getSymptomSeverity('has_chest_pain');
  const lung_coughing_blood_severity = has_coughing_blood
    ? (symSeverities['has_coughing_blood'] ? mapSeverityToScale(symSeverities['has_coughing_blood']) : mapSeverityToScale(symDurations['has_coughing_blood']))
    : 1;
  const lung_fatigue_severity = getSymptomSeverity('has_fatigue');
  const lung_weight_loss_severity = getSymptomSeverity('has_unexplained_weight_loss_lung');
  const lung_shortness_of_breath_severity = getSymptomSeverity('has_shortness_of_breath');
  const lung_wheezing_severity = getSymptomSeverity('has_wheezing');
  const lung_swallowing_difficulty_severity = Math.max(
    getSymptomSeverity('has_difficulty_swallowing'),
    getSymptomSeverity('has_hoarseness_3w'),
    getSymptomSeverity('has_swallowing_difficulty')
  );
  const lung_finger_clubbing_severity = getSymptomSeverity('has_nail_clubbing');
  const lung_frequent_cold_severity = Math.max(
    getSymptomSeverity('has_frequent_cold'),
    getSymptomSeverity('has_fever')
  );
  const lung_dry_cough_severity = Math.max(
    getSymptomSeverity('has_cough'),
    getSymptomSeverity('has_dry_cough')
  );
  const lung_snoring_severity = getSymptomSeverity('has_snoring');

  // Breast fields
  const has_breast_lump = selectedSyms.includes('has_breast_lump');
  const breast_lump_duration_weeks = has_breast_lump
    ? durationBucketToWeeks(symDurations['has_breast_lump'])
    : 0;
  const has_nipple_discharge = selectedSyms.includes('has_nipple_changes');
  const has_breast_skin_changes = selectedSyms.includes('has_breast_skin_changes');
  const has_family_history_breast_cancer = Boolean(
    medicalHistory.familyCancerTypes?.includes('Breast Cancer') ||
    medicalHistory.hasFamilyHistoryBreastCancer
  );

  // Breast ML BCSC fields (0/1/2/3/4/9)
  const breast_menopausal_status = womenOnly.menopauseStatus?.includes('Post-menopausal') || ageNum >= 55
    ? 1
    : womenOnly.menopauseStatus?.includes('Pre-menopausal')
    ? 0
    : 9;

  let breast_density = 9;
  if (womenOnly.breastDensity?.includes('1')) breast_density = 1;
  else if (womenOnly.breastDensity?.includes('2')) breast_density = 2;
  else if (womenOnly.breastDensity?.includes('3')) breast_density = 3;
  else if (womenOnly.breastDensity?.includes('4')) breast_density = 4;

  let breast_race = 9;
  if (womenOnly.raceEthnicity?.includes('White')) breast_race = 1;
  else if (womenOnly.raceEthnicity?.includes('Asian')) breast_race = 2;
  else if (womenOnly.raceEthnicity?.includes('Black')) breast_race = 3;
  else if (womenOnly.raceEthnicity?.includes('Native')) breast_race = 4;
  else if (womenOnly.raceEthnicity?.includes('Other')) breast_race = 5;

  const breast_is_hispanic = womenOnly.isHispanic === 'Yes' ? 1 : womenOnly.isHispanic === 'No' ? 0 : 9;

  let breast_bmi_category = 9;
  if (lifestyle.overweightStatus === 'Yes') breast_bmi_category = 3;
  else if (lifestyle.overweightStatus === 'No') breast_bmi_category = 1;

  let breast_age_at_first_birth_category = 9;
  if (womenOnly.pregnancyHistory?.includes('Never') || womenOnly.ageAtFirstBirth?.includes('Nulliparous')) {
    breast_age_at_first_birth_category = 2;
  } else if (womenOnly.ageAtFirstBirth?.includes('30+') || womenOnly.ageAtFirstBirth?.includes('Over 30')) {
    breast_age_at_first_birth_category = 1;
  } else if (womenOnly.ageAtFirstBirth?.includes('<30') || womenOnly.pregnancyHistory?.includes('1') || womenOnly.pregnancyHistory?.includes('2') || womenOnly.pregnancyHistory?.includes('3')) {
    breast_age_at_first_birth_category = 0;
  }

  let breast_num_relatives_with_breast_cancer = 0;
  const relStr = String(womenOnly.numRelativesWithBreastCancer || '');
  if (relStr.includes('2') || relStr.includes('2+')) {
    breast_num_relatives_with_breast_cancer = 2;
  } else if (relStr.includes('1')) {
    breast_num_relatives_with_breast_cancer = 1;
  } else if (relStr.includes('0') || relStr.includes('None')) {
    breast_num_relatives_with_breast_cancer = 0;
  } else if (relStr.includes('Unknown') || relStr.includes('Not sure')) {
    breast_num_relatives_with_breast_cancer = 9;
  } else {
    breast_num_relatives_with_breast_cancer = has_family_history_breast_cancer ? 1 : 0;
  }

  let breast_has_prior_breast_procedure = 0;
  const procStr = String(womenOnly.hasPriorBreastProcedure || '');
  if (procStr === 'Yes' || procStr === '1') {
    breast_has_prior_breast_procedure = 1;
  } else if (procStr === 'No' || procStr === '0') {
    breast_has_prior_breast_procedure = 0;
  } else if (procStr.includes('Unknown')) {
    breast_has_prior_breast_procedure = 9;
  } else if (medicalHistory.hasPreviousCancerDiagnosis === 'Yes' || screeningHistory.screeningsDone?.includes('breast_ultrasound')) {
    breast_has_prior_breast_procedure = 1;
  }

  let breast_last_mammogram_result = 9;
  const mamStr = String(womenOnly.lastMammogramResult || '');
  if (mamStr.includes('Negative') || mamStr.includes('Normal')) {
    breast_last_mammogram_result = 0;
  } else if (mamStr.includes('Benign') || mamStr.includes('False positive') || mamStr.includes('False')) {
    breast_last_mammogram_result = 1;
  } else if (mamStr.includes('Unknown') || mamStr.includes('Never')) {
    breast_last_mammogram_result = 9;
  }

  let breast_had_surgical_menopause = 9;
  const menTypeStr = String(womenOnly.hadSurgicalMenopause || '');
  if (menTypeStr === 'Surgical' || menTypeStr === 'Yes' || menTypeStr === '1') {
    breast_had_surgical_menopause = 1;
  } else if (menTypeStr === 'Natural' || menTypeStr === 'No' || menTypeStr === '0') {
    breast_had_surgical_menopause = 0;
  }

  let breast_uses_hormone_therapy = 9;
  const hrtStr = String(womenOnly.hormoneReplacementTherapy || womenOnly.usedHormoneTherapy || '').trim();
  if (hrtStr) {
    if (hrtStr.includes('Currently') || hrtStr.includes('Current') || hrtStr === 'Yes' || hrtStr === '1') {
      breast_uses_hormone_therapy = 1;
    } else if (hrtStr.includes('Never') || hrtStr.includes('Past') || hrtStr === 'No' || hrtStr === '0') {
      breast_uses_hormone_therapy = 0;
    } else {
      breast_uses_hormone_therapy = 9;
    }
  }

  // Oral fields
  const has_mouth_ulcer = Boolean(
    selectedSyms.includes('has_mouth_ulcer_2w') ||
    selectedSyms.includes('has_mouth_ulcer')
  );
  const mouth_ulcer_duration_weeks = has_mouth_ulcer
    ? durationBucketToWeeks(symDurations['has_mouth_ulcer_2w'] || symDurations['has_mouth_ulcer'])
    : 0;
  const has_oral_red_white_patches = selectedSyms.includes('has_oral_red_white_patches');
  const uses_smokeless_tobacco = Boolean(
    lifestyle.usesSmokelessTobacco === true ||
    lifestyle.usesSmokelessTobacco === 'Yes' ||
    lifestyle.tobaccoUse === 'smokeless' ||
    lifestyle.tobaccoUse?.includes('smokeless') ||
    lifestyle.tobaccoUse?.includes('multiple') ||
    (selectedSyms.includes('uses_smokeless_tobacco') && symSeverities['uses_smokeless_tobacco'] !== 'Never')
  );

  // Cervical fields
  const has_abnormal_vaginal_bleeding = Boolean(
    selectedSyms.includes('has_abnormal_vaginal_bleeding') ||
    selectedSyms.includes('has_post_coital_bleeding')
  );
  const has_abnormal_vaginal_discharge = selectedSyms.includes('has_abnormal_vaginal_discharge');
  const has_pelvic_pain = selectedSyms.includes('has_pelvic_pain');
  const is_hpv_positive = Boolean(
    womenOnly.isHpvPositive === true ||
    womenOnly.isHpvPositive === 'Yes' ||
    medicalHistory.medicalConditions?.some((c) => c.toLowerCase().includes('hpv'))
  );
  const is_screening_overdue = Boolean(
    screeningHistory.hasPreviousScreening === 'No' ||
    screeningHistory.hasPreviousScreening === 'No, Never' ||
    screeningHistory.lastCancerScreening === 'More than 3 years ago' ||
    screeningHistory.lastCancerScreening?.includes('More than 3') ||
    womenOnly.isScreeningOverdue === true ||
    womenOnly.isScreeningOverdue === 'Yes'
  );

  let cervical_num_sexual_partners = 1;
  const spStr = String(womenOnly.numSexualPartners || '');
  if (spStr.includes('6')) cervical_num_sexual_partners = 6;
  else if (spStr.includes('4') || spStr.includes('5')) cervical_num_sexual_partners = 4;
  else if (spStr.includes('2') || spStr.includes('3')) cervical_num_sexual_partners = 2;
  else if (spStr.includes('1')) cervical_num_sexual_partners = 1;
  else {
    const parsed = parseInt(spStr, 10);
    if (!isNaN(parsed) && parsed > 0) cervical_num_sexual_partners = parsed;
  }

  let cervical_first_intercourse_age = 17;
  const ageFirstSexStr = String(womenOnly.firstIntercourseAge || '');
  if (ageFirstSexStr.includes('<16') || ageFirstSexStr.includes('Under')) cervical_first_intercourse_age = 15;
  else if (ageFirstSexStr.includes('16') || ageFirstSexStr.includes('17') || ageFirstSexStr.includes('18')) cervical_first_intercourse_age = 17;
  else if (ageFirstSexStr.includes('19') || ageFirstSexStr.includes('20') || ageFirstSexStr.includes('21')) cervical_first_intercourse_age = 20;
  else if (ageFirstSexStr.includes('22')) cervical_first_intercourse_age = 22;
  else {
    const parsed = parseInt(ageFirstSexStr, 10);
    if (!isNaN(parsed) && parsed > 0) cervical_first_intercourse_age = parsed;
  }

  const cervical_num_pregnancies = womenOnly.pregnancyHistory?.includes('3')
    ? 3
    : womenOnly.pregnancyHistory?.includes('1') || womenOnly.pregnancyHistory?.includes('2')
    ? 2
    : 0;

  let cervical_smoking_years = 0;
  const smokeDurStr = String(lifestyle.tobaccoDuration || womenOnly.cervicalSmokingYears || '');
  if (isCurrentSmoker) {
    if (smokeDurStr.includes('10+') || smokeDurStr.includes('More than 10') || smokeDurStr.includes('10 or more')) {
      cervical_smoking_years = 12;
    } else if (smokeDurStr.includes('5 to 10') || smokeDurStr.includes('5–9') || smokeDurStr.includes('5 to 9')) {
      cervical_smoking_years = 7;
    } else if (smokeDurStr.includes('1 to 5') || smokeDurStr.includes('1–4') || smokeDurStr.includes('1 to 4')) {
      cervical_smoking_years = 3;
    } else {
      cervical_smoking_years = 1;
    }
  }

  const cervical_uses_hormonal_contraceptives = Boolean(
    womenOnly.oralContraceptiveUse &&
    (womenOnly.oralContraceptiveUse.includes('Currently') ||
      womenOnly.oralContraceptiveUse.includes('Used in the past') ||
      womenOnly.oralContraceptiveUse === 'Yes')
  );

  let cervical_hormonal_contraceptive_years = 0;
  const ocDurStr = String(womenOnly.oralContraceptiveYears || '');
  if (cervical_uses_hormonal_contraceptives) {
    if (ocDurStr.includes('10+') || ocDurStr.includes('10 or more')) cervical_hormonal_contraceptive_years = 12;
    else if (ocDurStr.includes('5 to 9') || ocDurStr.includes('5–9')) cervical_hormonal_contraceptive_years = 7;
    else if (ocDurStr.includes('1 to 4') || ocDurStr.includes('1–4')) cervical_hormonal_contraceptive_years = 2;
    else cervical_hormonal_contraceptive_years = 0;
  }

  const cervical_has_used_iud = Boolean(
    womenOnly.usedIud === 'Yes' ||
    (womenOnly.usedIud && !womenOnly.usedIud.includes('Never') && womenOnly.usedIud !== 'No')
  );

  let cervical_iud_years = 0;
  const iudDurStr = String(womenOnly.iudYears || '');
  if (cervical_has_used_iud) {
    if (iudDurStr.includes('10+') || iudDurStr.includes('10 or more')) cervical_iud_years = 12;
    else if (iudDurStr.includes('5 to 9') || iudDurStr.includes('5–9')) cervical_iud_years = 7;
    else if (iudDurStr.includes('1 to 4') || iudDurStr.includes('1–4')) cervical_iud_years = 2;
    else cervical_iud_years = 0;
  }

  let cervical_std_count = 0;
  const stdStr = String(womenOnly.stdCount || '');
  if (stdStr.includes('2') || stdStr.includes('2+')) {
    cervical_std_count = 2;
  } else if (stdStr.includes('1')) {
    cervical_std_count = 1;
  } else if (medicalHistory.medicalConditions?.some((c) => c.toLowerCase().includes('hpv') || c.toLowerCase().includes('hepatitis'))) {
    cervical_std_count = 1;
  }
  const cervical_has_std_history = cervical_std_count > 0;

  return {
    age: ageNum,
    gender,
    is_current_smoker: isCurrentSmoker,
    cough_duration_weeks,
    has_family_history_lung_cancer,
    has_occupational_exposure,
    has_coughing_blood,
    has_difficulty_swallowing,
    has_neck_swelling,
    is_alcohol_consuming,
    lung_air_pollution_exposure,
    lung_alcohol_use_severity,
    lung_dust_allergy_severity,
    lung_occupational_hazard_severity,
    lung_genetic_risk,
    lung_chronic_disease_severity,
    lung_diet_balance,
    lung_obesity_level,
    lung_smoking_severity,
    lung_passive_smoking_severity,
    lung_chest_pain_severity,
    lung_coughing_blood_severity,
    lung_fatigue_severity,
    lung_weight_loss_severity,
    lung_shortness_of_breath_severity,
    lung_wheezing_severity,
    lung_swallowing_difficulty_severity,
    lung_finger_clubbing_severity,
    lung_frequent_cold_severity,
    lung_dry_cough_severity,
    lung_snoring_severity,
    has_breast_lump,
    breast_lump_duration_weeks,
    has_nipple_discharge,
    has_breast_skin_changes,
    has_family_history_breast_cancer,
    breast_menopausal_status,
    breast_density,
    breast_race,
    breast_is_hispanic,
    breast_bmi_category,
    breast_age_at_first_birth_category,
    breast_num_relatives_with_breast_cancer,
    breast_has_prior_breast_procedure,
    breast_last_mammogram_result,
    breast_had_surgical_menopause,
    breast_uses_hormone_therapy,
    has_mouth_ulcer,
    mouth_ulcer_duration_weeks,
    has_oral_red_white_patches,
    uses_smokeless_tobacco,
    has_abnormal_vaginal_bleeding,
    has_abnormal_vaginal_discharge,
    has_pelvic_pain,
    is_hpv_positive,
    is_screening_overdue,
    cervical_num_sexual_partners,
    cervical_first_intercourse_age,
    cervical_num_pregnancies,
    cervical_smoking_years,
    cervical_uses_hormonal_contraceptives,
    cervical_hormonal_contraceptive_years,
    cervical_has_used_iud,
    cervical_iud_years,
    cervical_has_std_history,
    cervical_std_count,
  };
}

/**
 * Severity mapping helper matching python:
 * _TIER_SEVERITY = {RiskTier.LOW: 0, RiskTier.MEDIUM: 1, RiskTier.HIGH: 2}
 */
export function mostSevereTier(tier1: 'low' | 'medium' | 'high', tier2: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
  const map = { low: 0, medium: 1, high: 2 };
  return map[tier1] >= map[tier2] ? tier1 : tier2;
}

export const CLINICAL_DISCLAIMER_TEXT =
  'OncoGuards is a cancer risk-awareness and screening-support tool. It does not provide a medical diagnosis. Consult a qualified healthcare professional for medical evaluation.';

