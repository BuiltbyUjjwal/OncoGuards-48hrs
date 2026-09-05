/**
 * Centralized Clinical Screening Guidelines Configuration
 *
 * Single source of truth for screening recommendations, age cutoffs, test modalities,
 * frequencies, and evidence-based guideline references across Breast, Cervical, Lung, and Oral cancers.
 */

export interface CancerScreeningInfo {
  cancerType: 'Breast' | 'Cervical' | 'Lung' | 'Oral';
  displayName: string;
  testName: string;
  testModality: string;
  recommendedAgeRange: string;
  minAge?: number;
  maxAge?: number;
  frequency: string;
  genderSpecific?: 'female' | 'male' | null;
  guidelineSource: string;
  baselineRecommendation: string;
  highRiskRecommendation: string;
  lowRiskRecommendation: string;
  disclaimer: string;
}

export const CLINICAL_DISCLAIMER =
  'OncoGuards is a cancer risk-awareness and screening-support tool. It does not provide a medical diagnosis. Consult a qualified healthcare professional for medical evaluation.';

export const CANCER_SCREENING_CONFIG: Record<'breast' | 'cervical' | 'lung' | 'oral', CancerScreeningInfo> = {
  breast: {
    cancerType: 'Breast',
    displayName: 'Breast Health',
    testName: 'Screening Mammography',
    testModality: 'Digital Bilateral Mammogram / Clinical Breast Examination (CBE)',
    recommendedAgeRange: '40–74 years',
    minAge: 40,
    maxAge: 74,
    frequency: 'Every 1 to 2 years',
    genderSpecific: 'female',
    guidelineSource: 'ICMR / WHO / USPSTF Guidelines',
    baselineRecommendation:
      'Women aged 40 and older should discuss starting regular screening mammograms every 1–2 years with their gynecologist or primary care physician.',
    highRiskRecommendation:
      'Given family history or reported symptoms, early clinical breast examination and personalized surveillance (annual mammogram + supplemental ultrasound/MRI) is strongly advised.',
    lowRiskRecommendation:
      'Practice regular monthly breast self-awareness, attend routine annual wellness checkups, and begin screening mammograms at age 40.',
    disclaimer: CLINICAL_DISCLAIMER,
  },
  cervical: {
    cancerType: 'Cervical',
    displayName: 'Cervical Health',
    testName: 'Pap Smear / High-Risk HPV DNA Test',
    testModality: 'Cervical Cytology (Pap) / Primary High-Risk HPV Test',
    recommendedAgeRange: '21–65 years',
    minAge: 21,
    maxAge: 65,
    frequency: 'Pap test every 3 years or HPV test every 5 years',
    genderSpecific: 'female',
    guidelineSource: 'WHO / ICMR / ASCO Guidelines',
    baselineRecommendation:
      'Women aged 21–65 are advised to undergo routine cervical cytology (Pap smear) every 3 years or high-risk HPV testing every 5 years.',
    highRiskRecommendation:
      'With documented HPV history, overdue screening, or atypical bleeding, immediate colposcopy or updated co-testing (Pap + HPV) is clinically recommended.',
    lowRiskRecommendation:
      'Continue standard cervical cancer screening intervals (every 3 years for Pap or 5 years for HPV) between ages 21 and 65.',
    disclaimer: CLINICAL_DISCLAIMER,
  },
  lung: {
    cancerType: 'Lung',
    displayName: 'Lung Health',
    testName: 'Low-Dose Computed Tomography (LDCT)',
    testModality: 'Non-contrast Chest Low-Dose CT',
    recommendedAgeRange: '50–80 years (smokers / ex-smokers)',
    minAge: 50,
    maxAge: 80,
    frequency: 'Annual LDCT Scan',
    genderSpecific: null,
    guidelineSource: 'USPSTF / NCCN Guidelines',
    baselineRecommendation:
      'Adults aged 50–80 with a 20+ pack-year smoking history (current or quit within past 15 years) should undergo annual Low-Dose CT screening.',
    highRiskRecommendation:
      'Given tobacco exposure, occupational inhalation risk, or persistent thoracic symptoms, prompt clinical evaluation and discussion of annual LDCT chest imaging is strongly recommended.',
    lowRiskRecommendation:
      'Maintain smoke-free habits, minimize exposure to secondhand smoke, and promptly report any persistent cough or respiratory changes.',
    disclaimer: CLINICAL_DISCLAIMER,
  },
  oral: {
    cancerType: 'Oral',
    displayName: 'Oral & Oropharyngeal Health',
    testName: 'Comprehensive Oral Visual & Mucosal Examination',
    testModality: 'Clinical Inspection and Palpation of Oral Cavity, Tongue & Cervical Lymph Nodes',
    recommendedAgeRange: 'All adults, especially age 18+ with tobacco or alcohol history',
    frequency: 'Annual clinical exam (or every 6 months for active users)',
    genderSpecific: null,
    guidelineSource: 'ICMR / Dental Council of India Clinical Protocol',
    baselineRecommendation:
      'Individuals using combustible tobacco, smokeless tobacco (gutkha, khaini, betel quid), or regular alcohol should undergo periodic oral mucosal examination by a dentist or ENT specialist.',
    highRiskRecommendation:
      'With active smokeless/combustible tobacco habits or persistent sores/patches, immediate clinical mucosal examination with biopsy of any lesion unhealed after 2 weeks is essential.',
    lowRiskRecommendation:
      'Maintain regular dental hygiene, routine 6–12 month dental exams, and inspect your oral cavity for any unhealed sores or white/red patches.',
    disclaimer: CLINICAL_DISCLAIMER,
  },
};

export interface ScreeningAlertItem {
  id: string;
  cancerType: 'Breast' | 'Cervical' | 'Lung' | 'Oral';
  title: string;
  recommendation: string;
  guidelineSource: string;
  fullText: string;
  titleKey?: string;
  recommendationKey?: string;
  guidelineSourceKey?: string;
  cancerTypeKey?: string;
}

/**
 * Returns active screening alerts tailored to the user profile without calculating any local risk scores.
 */
export const DISCLAIMER_SUFFIX = `(${CLINICAL_DISCLAIMER})`;

/**
 * Returns active screening alerts tailored to the user profile without calculating any local risk scores.
 */
export function getApplicableScreeningAlerts(user: {
  age?: number | string;
  gender?: string;
  biological_sex?: string;
  isSmoker?: boolean;
  usesTobacco?: boolean;
  drinksAlcohol?: boolean;
}): ScreeningAlertItem[] {
  const numericAge = typeof user.age === 'string' ? parseInt(user.age, 10) || undefined : user.age;
  const sex = (user.biological_sex || user.gender || '').toLowerCase();
  const isFemale = sex === 'female';

  const alerts: ScreeningAlertItem[] = [];

  // Breast Screening Alert (Female only, age 40+)
  if (isFemale && (!numericAge || numericAge >= 40)) {
    const info = CANCER_SCREENING_CONFIG.breast;
    alerts.push({
      id: 'breast-mammogram',
      cancerType: 'Breast',
      title: `${info.displayName} Screening (${info.testName})`,
      recommendation: info.baselineRecommendation,
      guidelineSource: info.guidelineSource,
      fullText: `${info.baselineRecommendation} — ${info.guidelineSource}. ${CLINICAL_DISCLAIMER}`,
      titleKey: 'screening.breast.alertTitle',
      recommendationKey: 'screening.breast.baselineRecommendation',
      guidelineSourceKey: 'screening.breast.guidelineSource',
      cancerTypeKey: 'screening.breast.displayName',
    });
  }

  // Cervical Screening Alert (Female only, age 21–65)
  if (isFemale && (!numericAge || (numericAge >= 21 && numericAge <= 65))) {
    const info = CANCER_SCREENING_CONFIG.cervical;
    alerts.push({
      id: 'cervical-pap-hpv',
      cancerType: 'Cervical',
      title: `${info.displayName} Screening (${info.testName})`,
      recommendation: info.baselineRecommendation,
      guidelineSource: info.guidelineSource,
      fullText: `${info.baselineRecommendation} — ${info.guidelineSource}. ${CLINICAL_DISCLAIMER}`,
      titleKey: 'screening.cervical.alertTitle',
      recommendationKey: 'screening.cervical.baselineRecommendation',
      guidelineSourceKey: 'screening.cervical.guidelineSource',
      cancerTypeKey: 'screening.cervical.displayName',
    });
  }

  // Lung Screening Alert (Age 50–80 with tobacco use)
  if ((user.isSmoker || user.usesTobacco) && (!numericAge || (numericAge >= 50 && numericAge <= 80))) {
    const info = CANCER_SCREENING_CONFIG.lung;
    alerts.push({
      id: 'lung-ldct',
      cancerType: 'Lung',
      title: `${info.displayName} Screening (${info.testName})`,
      recommendation: info.baselineRecommendation,
      guidelineSource: info.guidelineSource,
      fullText: `${info.baselineRecommendation} — ${info.guidelineSource}. ${CLINICAL_DISCLAIMER}`,
      titleKey: 'screening.lung.alertTitle',
      recommendationKey: 'screening.lung.baselineRecommendation',
      guidelineSourceKey: 'screening.lung.guidelineSource',
      cancerTypeKey: 'screening.lung.displayName',
    });
  }

  // Oral Screening Alert (Any tobacco or regular alcohol use)
  if (user.usesTobacco || user.isSmoker || user.drinksAlcohol) {
    const info = CANCER_SCREENING_CONFIG.oral;
    alerts.push({
      id: 'oral-mucosa-check',
      cancerType: 'Oral',
      title: `${info.displayName} Examination (${info.testName})`,
      recommendation: info.baselineRecommendation,
      guidelineSource: info.guidelineSource,
      fullText: `${info.baselineRecommendation} — ${info.guidelineSource}. ${CLINICAL_DISCLAIMER}`,
      titleKey: 'screening.oral.alertTitle',
      recommendationKey: 'screening.oral.baselineRecommendation',
      guidelineSourceKey: 'screening.oral.guidelineSource',
      cancerTypeKey: 'screening.oral.displayName',
    });
  }

  return alerts;
}

/**
 * Returns the centralized recommendation translation key for a given cancer type and risk tier.
 */
export function getScreeningRecommendationKey(
  cancerKey: 'breast' | 'cervical' | 'lung' | 'oral',
  riskTier?: string
): string {
  const tier = (riskTier || '').toLowerCase();
  if (tier.includes('high')) {
    return `screening.${cancerKey}.highRiskRecommendation`;
  }
  if (tier.includes('mod')) {
    return `screening.${cancerKey}.baselineRecommendation`;
  }
  return `screening.${cancerKey}.lowRiskRecommendation`;
}

/**
 * Returns the centralized recommendation text for a given cancer type and risk tier.
 */
export function getScreeningRecommendationText(
  cancerKey: 'breast' | 'cervical' | 'lung' | 'oral',
  riskTier?: string
): string {
  const config = CANCER_SCREENING_CONFIG[cancerKey];
  if (!config) return '';

  const tier = (riskTier || '').toLowerCase();
  if (tier.includes('high')) {
    return config.highRiskRecommendation;
  }
  if (tier.includes('mod')) {
    return config.baselineRecommendation;
  }
  return config.lowRiskRecommendation;
}

/**
 * Helper overload for full context recommendation lookup
 */
export function getScreeningRecommendation(
  cancerKey: 'breast' | 'cervical' | 'lung' | 'oral',
  _age?: number,
  _sex?: 'male' | 'female',
  riskTier?: string,
  _factors?: Record<string, any>
): string {
  return getScreeningRecommendationText(cancerKey, riskTier);
}


