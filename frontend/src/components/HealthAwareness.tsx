import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  AlertTriangle,
  Globe2,
  Wine,
  Users,
  Calendar,
  Syringe,
  ShieldAlert,
  Stethoscope,
  Heart,
  Factory,
  Activity,
  Scan,
  Ban,
  Sparkles,
  SmilePlus,
  Eye,
  FlaskConical,
  BookOpen,
  Shield,
  Lightbulb,
  Check,
  Search,
  Apple,
  Footprints,
  Baby,
  HeartHandshake,
  ShieldCheck,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { RibbonIcon } from "./RibbonIcon";
import "../styles/HealthAwareness.css";

export type CancerKey = "breast" | "cervical" | "lung" | "oral";

interface StatItem {
  icon: LucideIcon;
  value: string;
  title: string;
  subtitle: string;
  source: string;
}

interface PreventionTip {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PathwayStep {
  stepNumber: number;
  icon: LucideIcon;
  title: string;
}

interface GlobalImpactStat {
  icon: LucideIcon;
  text: string;
}

interface TrustedSource {
  orgName: string;
  factSheetTitle: string;
  urlName: string;
  url: string;
  badgeType: "who" | "cancerindia" | "ncg" | "cdc" | "iarc";
}

interface CancerModalData {
  label: string;
  ribbonPrimary: string;
  ribbonSecondary?: string;
  colorKey: "pink" | "teal" | "sky" | "purple";
  title: string;
  subtitle: string;
  highlightText: string;
  highlightSuffix: string;
  awarenessScore: number;
  checklist: { text: string; done: boolean }[];
  stats: [StatItem, StatItem];
  didYouKnow: {
    points: string[];
    source: string;
  };
  globalImpact: {
    paragraph: string;
    stats: GlobalImpactStat[];
  };
  pathway: {
    title: string;
    tagline: string;
    steps: PathwayStep[];
  };
  preventionTips: PreventionTip[];
  warningSigns: {
    points: string[];
    calloutTitle: string;
    calloutText: string;
  };
  sources: TrustedSource[];
}

const cancerAwarenessData: Record<CancerKey, CancerModalData> = {
  breast: {
    label: "Breast Cancer",
    ribbonPrimary: "#ec4899",
    colorKey: "pink",
    title: "Breast Cancer",
    subtitle: "The most common cancer among women worldwide. Early detection can save lives.",
    highlightText: "Early detection",
    highlightSuffix: "can increase survival rates significantly.",
    awarenessScore: 72,
    checklist: [
      { text: "Know the risk factors", done: true },
      { text: "Practice prevention", done: true },
      { text: "Recognize warning signs", done: true },
      { text: "Get regular screening", done: false },
    ],
    stats: [
      {
        icon: Users,
        value: "2.4M+",
        title: "New cases in 2024",
        subtitle: "Globally in women",
        source: "Source: WHO, 2024",
      },
      {
        icon: Heart,
        value: "694K+",
        title: "Deaths in 2024",
        subtitle: "Globally in women",
        source: "Source: WHO, 2024",
      },
    ],
    didYouKnow: {
      points: [
        "Around 2.4 million women were diagnosed with breast cancer globally in 2024.",
        "Approximately 80% of breast cancers occur in women without specific risk factors other than sex and age.",
      ],
      source: "Source: WHO Fact Sheet, 2024",
    },
    globalImpact: {
      paragraph:
        "Breast cancer affects women in every country, regardless of economy or development level. But with early detection and better care, more women are surviving and thriving.",
      stats: [
        {
          icon: Users,
          text: "1 in 7 women may develop breast cancer in their lifetime.",
        },
        {
          icon: Activity,
          text: "Early detection can increase survival rates by up to 90%.",
        },
        {
          icon: ShieldCheck,
          text: "Screening & timely treatment can save countless lives every year.",
        },
      ],
    },
    pathway: {
      title: "The early detection pathway",
      tagline: "Early action leads to better outcomes.",
      steps: [
        { stepNumber: 1, icon: Eye, title: "Know the signs" },
        { stepNumber: 2, icon: Stethoscope, title: "Get checked" },
        { stepNumber: 3, icon: FlaskConical, title: "Diagnosis & evaluation" },
        { stepNumber: 4, icon: Heart, title: "Timely treatment" },
      ],
    },
    preventionTips: [
      {
        icon: Apple,
        title: "Maintain a healthy weight",
        description: "Being active and eating balanced meals can lower your lifetime risk.",
      },
      {
        icon: Footprints,
        title: "Stay active",
        description: "Aim for 30 minutes of moderate exercise most days of the week.",
      },
      {
        icon: Wine,
        title: "Avoid tobacco & limit alcohol",
        description: "Tobacco and alcohol measurably increase breast cancer risk.",
      },
      {
        icon: Baby,
        title: "Breastfeed if possible",
        description: "Breastfeeding, when possible, is linked to lower lifetime risk.",
      },
      {
        icon: Calendar,
        title: "Go for regular screening",
        description: "Mammograms detect cancer early when it is most treatable.",
      },
      {
        icon: HeartHandshake,
        title: "Know your family history",
        description: "Talk to your doctor if breast cancer runs in your family; ask about genetics.",
      },
    ],
    warningSigns: {
      points: [
        "A new lump or thickened area in the breast or underarm",
        "Changes in breast size, shape, or skin texture (dimpling, puckering)",
        "Nipple changes — inversion, scaling, or unexpected discharge",
        "Persistent pain in one specific area of the breast",
      ],
      calloutTitle: "When in doubt, get checked.",
      calloutText: "Early detection saves lives.",
    },
    sources: [
      {
        orgName: "World Health Organization",
        factSheetTitle: "Breast Cancer Fact Sheet",
        urlName: "who.int",
        url: "https://www.who.int/news-room/fact-sheets/detail/breast-cancer",
        badgeType: "who",
      },
      {
        orgName: "Cancer India (ICMR-NICPR)",
        factSheetTitle: "Breast Cancer Overview & Guidelines",
        urlName: "cancerindia.org.in",
        url: "https://cancerindia.org.in/",
        badgeType: "cancerindia",
      },
      {
        orgName: "National Cancer Grid",
        factSheetTitle: "Evidence-Based Management Guidelines",
        urlName: "ncgindia.org",
        url: "https://www.ncgindia.org/",
        badgeType: "ncg",
      },
    ],
  },

  cervical: {
    label: "Cervical Cancer",
    ribbonPrimary: "#0d9488",
    ribbonSecondary: "#ffffff",
    colorKey: "teal",
    title: "Cervical Cancer",
    subtitle: "One of the most preventable and curable cancers through HPV vaccination and regular screening.",
    highlightText: "HPV vaccination",
    highlightSuffix: "and regular screening prevent up to 95% of cervical cancers.",
    awarenessScore: 85,
    checklist: [
      { text: "HPV vaccination status checked", done: true },
      { text: "Understand routine Pap intervals", done: true },
      { text: "Know early warning symptoms", done: true },
      { text: "Schedule timely screening test", done: true },
    ],
    stats: [
      {
        icon: Users,
        value: "604K+",
        title: "New cases in 2024",
        subtitle: "Globally in women",
        source: "Source: WHO, 2024",
      },
      {
        icon: Heart,
        value: "95%",
        title: "Linked to HPV",
        subtitle: "Highly vaccine-preventable",
        source: "Source: WHO, 2024",
      },
    ],
    didYouKnow: {
      points: [
        "Cervical cancer is the first cancer in history targeted by the WHO for global elimination as a public health problem.",
        "A single dose of HPV vaccine is now recognized as highly protective for ages 9–20, expanding global accessibility.",
      ],
      source: "Source: WHO Fact Sheet, 2024",
    },
    globalImpact: {
      paragraph:
        "Cervical cancer is the 4th most common cancer in women globally. Around 94% of deaths occur in low- and middle-income countries, reflecting gaps in vaccination, screening, and treatment access.",
      stats: [
        {
          icon: Syringe,
          text: "1 dose of HPV vaccine gives strong, lasting protection for ages 9–20.",
        },
        {
          icon: ShieldCheck,
          text: "Routine screening identifies pre-cancerous lesions years before malignancy.",
        },
        {
          icon: Activity,
          text: "Over 90% of early-stage cervical cases achieve complete cure.",
        },
      ],
    },
    pathway: {
      title: "The early detection pathway",
      tagline: "Proactive screening prevents invasive disease.",
      steps: [
        { stepNumber: 1, icon: Eye, title: "Know the signs" },
        { stepNumber: 2, icon: Stethoscope, title: "Get checked" },
        { stepNumber: 3, icon: FlaskConical, title: "Diagnosis & evaluation" },
        { stepNumber: 4, icon: Heart, title: "Timely treatment" },
      ],
    },
    preventionTips: [
      {
        icon: Syringe,
        title: "Get vaccinated for HPV",
        description: "HPV vaccination for youth (ages 9–14) is highly effective before exposure.",
      },
      {
        icon: ShieldAlert,
        title: "Single-dose effectiveness",
        description: "One dose of HPV vaccine provides strong, lasting protection for ages 9–20.",
      },
      {
        icon: Stethoscope,
        title: "Regular Pap / HPV screening",
        description: "Get regular age-appropriate screening starting at age 21.",
      },
      {
        icon: ShieldCheck,
        title: "Practice safer sex",
        description: "Barrier protection reduces HPV and STI transmission risk.",
      },
      {
        icon: Ban,
        title: "Avoid tobacco smoke",
        description: "Smoking impairs local cervical immunity, doubling HPV persistence risk.",
      },
      {
        icon: Calendar,
        title: "Follow up on abnormal tests",
        description: "Don't skip evaluation or colposcopy after an abnormal Pap/HPV result.",
      },
    ],
    warningSigns: {
      points: [
        "Abnormal vaginal bleeding — between periods, after sex, or post-menopause",
        "Unusual persistent watery, pink-tinged, or foul-smelling vaginal discharge",
        "Persistent pelvic pain or lower back discomfort unrelated to your cycle",
        "Pain or discomfort during intimacy",
      ],
      calloutTitle: "When in doubt, get checked.",
      calloutText: "Early detection saves lives.",
    },
    sources: [
      {
        orgName: "World Health Organization",
        factSheetTitle: "Cervical Cancer Elimination",
        urlName: "who.int",
        url: "https://www.who.int/news-room/fact-sheets/detail/cervical-cancer",
        badgeType: "who",
      },
      {
        orgName: "Cancer India (ICMR-NICPR)",
        factSheetTitle: "Cervical Cancer Screening in India",
        urlName: "cancerindia.org.in",
        url: "https://cancerindia.org.in/",
        badgeType: "cancerindia",
      },
      {
        orgName: "National Cancer Grid",
        factSheetTitle: "Clinical Practice Guidelines",
        urlName: "ncgindia.org",
        url: "https://www.ncgindia.org/",
        badgeType: "ncg",
      },
    ],
  },

  lung: {
    label: "Lung Cancer",
    ribbonPrimary: "#f8fafc",
    colorKey: "sky",
    title: "Lung Cancer",
    subtitle: "The leading cause of cancer deaths worldwide. Quitting smoking and early low-dose CT scans save lives.",
    highlightText: "Quitting smoking",
    highlightSuffix: "at any age immediately lowers risk and restores lung cilia function.",
    awarenessScore: 68,
    checklist: [
      { text: "Assess personal tobacco exposure", done: true },
      { text: "Test living spaces for radon gas", done: true },
      { text: "Recognize persistent respiratory signs", done: true },
      { text: "Check Low-Dose CT eligibility", done: false },
    ],
    stats: [
      {
        icon: Users,
        value: "80–90%",
        title: "Tobacco-linked deaths",
        subtitle: "Main preventable cause",
        source: "Source: CDC, 2024",
      },
      {
        icon: Heart,
        value: "15–30×",
        title: "Higher risk in smokers",
        subtitle: "Relative to non-smokers",
        source: "Source: CDC / WHO, 2024",
      },
    ],
    didYouKnow: {
      points: [
        "Tobacco smoke contains over 7,000 chemicals, with at least 70 recognized human carcinogens.",
        "Within 1 to 9 months of quitting, lung cilia recover normal mucus clearance, reducing infection risk and coughing.",
      ],
      source: "Source: CDC Lung Cancer Awareness, 2024",
    },
    globalImpact: {
      paragraph:
        "Tobacco smoke is the leading cause of lung cancer worldwide, but radon gas exposure is the leading cause among people who have never smoked. Quitting at any age measurably lowers risk.",
      stats: [
        {
          icon: Ban,
          text: "80–90% of lung cancer deaths are linked to combustible tobacco smoke.",
        },
        {
          icon: Activity,
          text: "Within 1–9 months of quitting, lung cilia recover normal mucus clearance.",
        },
        {
          icon: Scan,
          text: "Annual Low-Dose CT (LDCT) can reduce mortality by up to 20% in high-risk groups.",
        },
      ],
    },
    pathway: {
      title: "The early detection pathway",
      tagline: "Early scans catch solitary pulmonary nodules early.",
      steps: [
        { stepNumber: 1, icon: Eye, title: "Know the signs" },
        { stepNumber: 2, icon: Stethoscope, title: "Get checked" },
        { stepNumber: 3, icon: FlaskConical, title: "Diagnosis & evaluation" },
        { stepNumber: 4, icon: Heart, title: "Timely treatment" },
      ],
    },
    preventionTips: [
      {
        icon: Ban,
        title: "Quit smoking & tobacco",
        description: "Quitting smoking at any age significantly lowers oncologic risk over time.",
      },
      {
        icon: Wind,
        title: "Avoid secondhand smoke",
        description: "Keep domestic spaces, vehicles, and shared areas strictly smoke-free.",
      },
      {
        icon: ShieldAlert,
        title: "Test your home for radon",
        description: "Radon is odorless and invisible; affordable home test kits detect it easily.",
      },
      {
        icon: Factory,
        title: "Workplace hazard safety",
        description: "Limit exposure to occupational dust, asbestos, silica, and industrial fumes.",
      },
      {
        icon: Activity,
        title: "Avoid light or social smoking",
        description: "Even smoking a few cigarettes a day or occasionally still increases risk.",
      },
      {
        icon: Scan,
        title: "Annual Low-Dose CT scan",
        description: "Eligible adults (50–80 with 20+ pack-year history) should discuss annual CT scans.",
      },
    ],
    warningSigns: {
      points: [
        "A persistent cough lasting more than 3 weeks or worsening",
        "Coughing up blood or rust-colored sputum — seek prompt evaluation",
        "Unexplained breathlessness, wheezing, or chest pain during daily activity",
        "Unexplained weight loss and recurring respiratory infections",
      ],
      calloutTitle: "When in doubt, get checked.",
      calloutText: "Early detection saves lives.",
    },
    sources: [
      {
        orgName: "World Health Organization",
        factSheetTitle: "Cancer & Tobacco Control",
        urlName: "who.int",
        url: "https://www.who.int/news-room/fact-sheets/detail/cancer",
        badgeType: "who",
      },
      {
        orgName: "Cancer India (ICMR-NICPR)",
        factSheetTitle: "Tobacco & Cancer Statistics India",
        urlName: "cancerindia.org.in",
        url: "https://cancerindia.org.in/",
        badgeType: "cancerindia",
      },
      {
        orgName: "National Cancer Grid",
        factSheetTitle: "Thoracic Oncology Practice Guidelines",
        urlName: "ncgindia.org",
        url: "https://www.ncgindia.org/",
        badgeType: "ncg",
      },
    ],
  },

  oral: {
    label: "Oral Cancer",
    ribbonPrimary: "#881337",
    ribbonSecondary: "#fef3c7",
    colorKey: "purple",
    title: "Oral & Head/Neck Cancer",
    subtitle: "Highly detectable through routine 2-minute visual dental checks and avoiding areca nut & tobacco.",
    highlightText: "Stopping areca nut & tobacco",
    highlightSuffix: "use reduces oral cancer risk by up to 50% within years.",
    awarenessScore: 78,
    checklist: [
      { text: "Know smokeless tobacco risks (gutka/paan)", done: true },
      { text: "Perform regular mouth self-checks", done: true },
      { text: "Understand the 2-week healing rule", done: true },
      { text: "Schedule 6-month dental exam", done: true },
    ],
    stats: [
      {
        icon: Users,
        value: "377K+",
        title: "New cases per year",
        subtitle: "Occur worldwide annually",
        source: "Source: WHO/IARC, 2024",
      },
      {
        icon: Heart,
        value: "40×",
        title: "Multiplied risk factor",
        subtitle: "When smoking, drinking & chewing combine",
        source: "Source: IARC, 2024",
      },
    ],
    didYouKnow: {
      points: [
        "Combining alcohol with tobacco multiplies oral cancer risk up to 40 times due to alcohol facilitating mucosal carcinogen absorption.",
        "Over 80% of oral cavity lesions can be identified during a simple, painless 2-minute visual check by a dentist.",
      ],
      source: "Source: WHO/IARC Handbook Vol. 19, 2024",
    },
    globalImpact: {
      paragraph:
        "Oral cancer is among the most common cancers in South and South-East Asia, driven largely by smokeless tobacco (gutka, khaini, paan) and areca (betel) nut use rather than smoking alone.",
      stats: [
        {
          icon: Ban,
          text: "40× higher risk when heavy tobacco and alcohol use combine.",
        },
        {
          icon: Activity,
          text: "Stopping areca nut & tobacco use drops lesion risk by 50% within years.",
        },
        {
          icon: Eye,
          text: "Over 80% of oral lesions are visually detectable in early pre-cancerous stages.",
        },
      ],
    },
    pathway: {
      title: "The early detection pathway",
      tagline: "Visual checks catch mucosal changes early.",
      steps: [
        { stepNumber: 1, icon: Eye, title: "Know the signs" },
        { stepNumber: 2, icon: Stethoscope, title: "Get checked" },
        { stepNumber: 3, icon: FlaskConical, title: "Diagnosis & evaluation" },
        { stepNumber: 4, icon: Heart, title: "Timely treatment" },
      ],
    },
    preventionTips: [
      {
        icon: Ban,
        title: "Avoid all tobacco forms",
        description: "Avoid tobacco in all forms — smoked cigarettes and smokeless (gutka, khaini, paan).",
      },
      {
        icon: Ban,
        title: "Eliminate areca (betel) nut",
        description: "Avoiding areca/betel nut products meaningfully lowers oral cancer risk.",
      },
      {
        icon: Wine,
        title: "Limit alcohol consumption",
        description: "Combined with tobacco, alcohol multiplies risk rather than simply adding up.",
      },
      {
        icon: Sparkles,
        title: "Maintain good oral hygiene",
        description: "Maintain good oral hygiene and get regular 6-month dental check-ups.",
      },
      {
        icon: SmilePlus,
        title: "Ensure well-fitting dentures",
        description: "Ensure dental appliances fit properly — chronic friction contributes to lesions.",
      },
      {
        icon: Stethoscope,
        title: "The 2-week clinical rule",
        description: "Get any mouth sore, red/white patch, or lump checked if it lasts 2+ weeks.",
      },
    ],
    warningSigns: {
      points: [
        "A mouth ulcer, sore, or crack that hasn't healed in 2+ weeks",
        "Persistent velvety white (leukoplakia) or red (erythroplakia) patches on tongue/gums",
        "A lump in the mouth, jaw, tongue, or neck, or difficulty swallowing",
        "A hoarse voice or sore throat lasting 3+ weeks",
      ],
      calloutTitle: "When in doubt, get checked.",
      calloutText: "Early detection saves lives.",
    },
    sources: [
      {
        orgName: "World Health Organization",
        factSheetTitle: "Oral Health Fact Sheet",
        urlName: "who.int",
        url: "https://www.who.int/news-room/fact-sheets/detail/oral-health",
        badgeType: "who",
      },
      {
        orgName: "Cancer India (ICMR-NICPR)",
        factSheetTitle: "Oral Cancer Prevention & Screening India",
        urlName: "cancerindia.org.in",
        url: "https://cancerindia.org.in/",
        badgeType: "cancerindia",
      },
      {
        orgName: "National Cancer Grid",
        factSheetTitle: "Head & Neck Cancer Clinical Guidelines",
        urlName: "ncgindia.org",
        url: "https://www.ncgindia.org/",
        badgeType: "ncg",
      },
    ],
  },
};

const themeStyles: Record<
  "pink" | "teal" | "sky" | "purple",
  {
    heroGradient: string;
    heroBorder: string;
    primaryHex: string;
    activeBorder: string;
    badgeBg: string;
    circleStroke: string;
  }
> = {
  pink: {
    heroGradient: "linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #fff0f5 100%)",
    heroBorder: "#fbcfe8",
    primaryHex: "#e11d48",
    activeBorder: "#f472b6",
    badgeBg: "#fce7f3",
    circleStroke: "#f472b6",
  },
  teal: {
    heroGradient: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #e6fffa 100%)",
    heroBorder: "#99f6e4",
    primaryHex: "#0d9488",
    activeBorder: "#2dd4bf",
    badgeBg: "#ccfbf1",
    circleStroke: "#14b8a6",
  },
  sky: {
    heroGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #eff6ff 100%)",
    heroBorder: "#bae6fd",
    primaryHex: "#0284c7",
    activeBorder: "#38bdf8",
    badgeBg: "#e0f2fe",
    circleStroke: "#38bdf8",
  },
  purple: {
    heroGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f5f3ff 100%)",
    heroBorder: "#e9d5ff",
    primaryHex: "#9333ea",
    activeBorder: "#c084fc",
    badgeBg: "#f3e8ff",
    circleStroke: "#a855f7",
  },
};

/**
 * Metric Progress Ring Component
 */
function MetricRing({
  percentage,
  strokeColor,
}: {
  percentage: number;
  strokeColor: string;
}) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 88,
        height: 88,
        flexShrink: 0,
      }}
    >
      <svg
        height={88}
        width={88}
        style={{
          transform: "rotate(-90deg)",
          overflow: "visible",
          width: 88,
          height: 88,
        }}
      >
        <circle
          stroke="#f1f5f9"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={44}
          cy={44}
        />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={44}
          cy={44}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: strokeColor,
            fontFamily: "var(--font-family-primary, 'Plus Jakarta Sans', sans-serif)",
            lineHeight: 1,
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/**
 * "Did You Know?" Card Subcomponent
 */
function DidYouKnowCard({
  points,
  source,
  primaryColor,
  badgeBg,
}: {
  points: string[];
  source: string;
  primaryColor: string;
  badgeBg: string;
}) {
  return (
    <div className="ha-did-you-know-card">
      <div>
        <div className="ha-dyk-header">
          <div
            className="ha-dyk-icon-circle"
            style={{
              backgroundColor: badgeBg,
              color: primaryColor,
            }}
          >
            <Lightbulb size={17} strokeWidth={2.2} />
          </div>
          <h4 className="ha-dyk-title" style={{ color: primaryColor }}>
            Did you know?
          </h4>
        </div>

        <ul className="ha-dyk-list">
          {points.map((pt, i) => (
            <li key={i} className="ha-dyk-item">
              <span
                className="ha-dyk-bullet"
                style={{ backgroundColor: primaryColor }}
              />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="ha-dyk-footer">{source}</p>
    </div>
  );
}

/**
 * Detection Pathway Subcomponent
 */
function DetectionPathway({
  title,
  tagline,
  steps,
  circleStroke,
  badgeBg,
  primaryColor,
}: {
  title: string;
  tagline: string;
  steps: PathwayStep[];
  circleStroke: string;
  badgeBg: string;
  primaryColor: string;
}) {
  return (
    <div className="ha-pathway-card">
      <div>
        <div className="ha-card-heading-group">
          <h4 className="ha-card-heading">{title}</h4>
        </div>

        <div className="ha-pathway-steps">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <div key={idx} className="ha-pathway-step">
                {!isLast && <div className="ha-pathway-line" />}

                <div
                  className="ha-pathway-icon-circle"
                  style={{
                    borderColor: circleStroke,
                    backgroundColor: isLast ? badgeBg : "#ffffff",
                    color: primaryColor,
                  }}
                >
                  <StepIcon size={18} strokeWidth={2.2} />
                </div>

                <div>
                  <span className="ha-pathway-num">Step {step.stepNumber}</span>
                  <p className="ha-pathway-name">{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="ha-pathway-tagline">{tagline}</p>
    </div>
  );
}

/**
 * Reusable Source Card Subcomponent
 */
function SourceCard({ source }: { source: TrustedSource }) {
  const getBadge = (type: "who" | "cancerindia" | "ncg" | "cdc" | "iarc") => {
    if (type === "who") {
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            flexShrink: 0,
          }}
        >
          <Globe2 size={20} className="stroke-[1.8]" />
        </div>
      );
    }
    if (type === "cancerindia") {
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(234, 88, 12, 0.08)",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#ea580c", lineHeight: 1.1 }}>CI</span>
          <span style={{ fontSize: "7px", color: "#16a34a", fontWeight: 700, letterSpacing: "0.02em" }}>INDIA</span>
        </div>
      );
    }
    if (type === "ncg") {
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: "#042f2e",
            border: "1px solid #115e59",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "10px",
            lineHeight: 1.1,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(13, 148, 136, 0.15)",
          }}
        >
          <span style={{ letterSpacing: "0.05em", color: "#2dd4bf", fontSize: "10px", fontWeight: 800 }}>NCG</span>
          <span style={{ fontSize: "7px", color: "#ccfbf1", fontWeight: 600 }}>INDIA</span>
        </div>
      );
    }
    if (type === "cdc") {
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          CDC
        </div>
      );
    }
    return (
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          backgroundColor: "#0f172a",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "9px",
          lineHeight: 1.1,
          flexShrink: 0,
        }}
      >
        <span>IARC</span>
        <span style={{ fontSize: "7px", color: "#93c5fd", fontWeight: 400 }}>WHO</span>
      </div>
    );
  };

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ha-source-card"
    >
      <div className="ha-source-left">
        {getBadge(source.badgeType)}
        <div>
          <p className="ha-source-org">{source.orgName}</p>
          <p className="ha-source-name">{source.factSheetTitle}</p>
          <span className="ha-source-url">{source.urlName}</span>
        </div>
      </div>
      <ExternalLink size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
    </a>
  );
}

interface HealthAwarenessProps {
  initialCancerKey?: CancerKey;
  onNavigateToDashboard?: () => void;
}

export const HealthAwareness: React.FC<HealthAwarenessProps> = ({
  initialCancerKey = "breast",
  onNavigateToDashboard,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CancerKey>(initialCancerKey);
  const data = cancerAwarenessData[activeTab];
  const theme = themeStyles[data.colorKey];

  return (
    <div className="health-awareness-root">
      {/* 1. TOP HEADER SECTION */}
      <header className="ha-top-header">
        <div className="ha-brand-group">
          <div className="ha-brand-logo-box">
            <img
              src="/logo-icon.png"
              alt="OncoGuards AI Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
            />
          </div>
          <div className="ha-brand-info">
            <div className="ha-brand-title-row">
              <h1 className="ha-brand-title">
                OncoGuards <span>AI</span>
              </h1>
              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="ha-back-btn"
                >
                  {t('nav.backToDashboard', '← Back to Dashboard')}
                </button>
              )}
            </div>
            <p className="ha-brand-sub">{t('awareness.brandSub', 'AI for Early Awareness, Better Tomorrow')}</p>
          </div>
        </div>

        <div className="ha-header-pill">
          <Lightbulb size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
          <span>{t('awareness.headerPill', 'Knowledge today, protection tomorrow.')}</span>
        </div>
      </header>

      {/* 2. MAIN PAGE TITLE */}
      <div className="ha-page-title-wrap">
        <h2 className="ha-page-title">
          <span>{t('awareness.title', 'Cancer Awareness')}</span>
        </h2>
        <p className="ha-page-subtitle">
          {t('awareness.subtitle', 'Understand the risks. Know the signs. Take action early.')}
        </p>
      </div>

      {/* 3. FOUR CANCER TABS (Breast / Cervical / Lung / Oral) */}
      <div className="ha-tabs-container">
        <div role="tablist" aria-label="Cancer Modalities" className="ha-tabs-list">
          {(Object.keys(cancerAwarenessData) as CancerKey[]).map((key) => {
            const item = cancerAwarenessData[key];
            const isActive = activeTab === key;
            const itemTheme = themeStyles[item.colorKey];

            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(key)}
                className={`ha-tab-btn ${isActive ? "is-active" : ""}`}
                style={{
                  borderColor: isActive ? itemTheme.activeBorder : undefined,
                }}
              >
                {isActive && (
                  <span
                    className="ha-tab-indicator"
                    style={{ backgroundColor: itemTheme.primaryHex }}
                  />
                )}
                <RibbonIcon
                  primaryColor={isActive ? item.ribbonPrimary : (item.ribbonPrimary === '#f8fafc' ? '#cbd5e1' : item.ribbonPrimary)}
                  secondaryColor={isActive ? item.ribbonSecondary : (item.ribbonSecondary ? '#cbd5e1' : undefined)}
                  size={20}
                  style={{
                    opacity: isActive ? 1 : 0.65,
                    filter: !isActive ? 'grayscale(0.3)' : undefined,
                  }}
                  ariaLabel={item.label}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="ha-tabs-fade-edge" />
      </div>

      {/* 4. MAIN TAB CONTENT */}
      <div key={activeTab} className="ha-tab-content-enter">
        {/* ===================== HERO CARD ===================== */}
        <div
          className="ha-hero-card"
          style={{
            background: theme.heroGradient,
            borderColor: theme.heroBorder,
          }}
        >
          {/* Bounded Decorative Background SVG */}
          <svg
            className="ha-hero-svg-bg"
            viewBox="0 0 200 200"
            fill="none"
            style={{
              position: "absolute",
              right: -20,
              bottom: -20,
              width: 220,
              height: 220,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <circle cx="100" cy="100" r="45" stroke={theme.circleStroke} strokeWidth="3" />
            <circle
              cx="100"
              cy="100"
              r="75"
              stroke={theme.circleStroke}
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <circle cx="100" cy="100" r="105" stroke={theme.circleStroke} strokeWidth="1.5" />
          </svg>

          {/* Hero Left: Vector Badge */}
          <div className="ha-hero-left">
            <div className="ha-badge-circle-outer">
              <div
                className="ha-orbit-ring"
                style={{ borderColor: theme.circleStroke }}
              />
              <div className="ha-badge-circle-inner">
                <RibbonIcon
                  primaryColor={data.ribbonPrimary}
                  secondaryColor={data.ribbonSecondary}
                  size={46}
                  ariaLabel={`${data.label} Awareness Ribbon`}
                />
              </div>
            </div>
          </div>

          {/* Hero Center: Title & Description */}
          <div className="ha-hero-center">
            <h3 className="ha-hero-title" style={{ color: theme.primaryHex }}>
              {data.title}
            </h3>
            <p className="ha-hero-sub">{data.subtitle}</p>

            <div className="ha-hero-highlight-pill">
              <span
                className="ha-highlight-bold"
                style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.primaryHex,
                }}
              >
                {data.highlightText}
              </span>
              <span>{data.highlightSuffix}</span>
            </div>
          </div>

          {/* Hero Right: Progress Ring + Checklist */}
          <div className="ha-hero-right">
            <div className="ha-progress-wrap">
              <MetricRing
                percentage={data.awarenessScore}
                strokeColor={theme.primaryHex}
              />
              <p className="ha-progress-label">{t('awareness.progressLabel', 'Awareness Progress')}</p>
              <p className="ha-progress-sub">{t('awareness.progressSub', "You're doing great!")}</p>
            </div>

            <div className="ha-checklist">
              {data.checklist.map((item, idx) => (
                <div key={idx} className="ha-check-item">
                  <span>{item.text}</span>
                  {item.done ? (
                    <span className="ha-check-icon-done">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="ha-check-icon-pending"
                      style={{ borderColor: theme.primaryHex }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================== ROW 2: STATS + DID YOU KNOW ===================== */}
        <div className="ha-grid-2col">
          {/* Two Stat Highlight Cards */}
          <div className="ha-stats-col">
            {data.stats.map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div key={i} className="ha-stat-card">
                  <div className="ha-stat-top">
                    <div
                      className="ha-stat-icon-badge"
                      style={{
                        backgroundColor: theme.badgeBg,
                        color: theme.primaryHex,
                      }}
                    >
                      <StatIcon size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p
                        className="ha-stat-number"
                        style={{ color: theme.primaryHex }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="ha-stat-title">{stat.title}</p>
                    <p className="ha-stat-sub">{stat.subtitle}</p>
                    <p className="ha-stat-footer">{stat.source}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "Did you know?" Card */}
          <DidYouKnowCard
            points={data.didYouKnow.points}
            source={data.didYouKnow.source}
            primaryColor={theme.primaryHex}
            badgeBg={theme.badgeBg}
          />
        </div>

        {/* ===================== ROW 3: GLOBAL IMPACT + EARLY DETECTION PATHWAY ===================== */}
        <div className="ha-grid-2col">
          {/* Global Impact Card */}
          <div className="ha-impact-card">
            <div>
              <div className="ha-card-heading-group">
                <Globe2 size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                <h4 className="ha-card-heading">{t('awareness.globalImpact', 'Global impact')}</h4>
              </div>

              <p className="ha-impact-text">{data.globalImpact.paragraph}</p>
            </div>

            <div className="ha-impact-stats-list">
              {data.globalImpact.stats.map((item, i) => {
                const ImpactIcon = item.icon;
                return (
                  <div key={i} className="ha-impact-stat-item">
                    <div className="ha-impact-stat-icon">
                      <ImpactIcon size={15} />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Early Detection Pathway Card */}
          <DetectionPathway
            title={data.pathway.title}
            tagline={data.pathway.tagline}
            steps={data.pathway.steps}
            circleStroke={theme.circleStroke}
            badgeBg={theme.badgeBg}
            primaryColor={theme.primaryHex}
          />
        </div>

        {/* ===================== SECTION: KEY PREVENTION TIPS ===================== */}
        <div className="ha-section-card">
          <div className="ha-section-header">
            <ShieldCheck size={19} style={{ color: theme.primaryHex }} />
            <h4 className="ha-section-title">{t('awareness.keyPreventionTips', 'Key prevention tips')}</h4>
          </div>

          <div className="ha-tips-grid">
            {data.preventionTips.map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div key={i} className="ha-tip-card">
                  <div
                    className="ha-tip-icon-circle"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.primaryHex,
                    }}
                  >
                    <TipIcon size={20} strokeWidth={2} />
                  </div>

                  <div>
                    <h5 className="ha-tip-title" style={{ color: theme.primaryHex }}>
                      {tip.title}
                    </h5>
                    <p className="ha-tip-desc">{tip.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== SECTION: WARNING SIGNS ===================== */}
        <div className="ha-warning-card">
          <div className="ha-warning-left">
            <div className="ha-warning-header">
              <div className="ha-warning-icon-box">
                <AlertTriangle size={17} strokeWidth={2.4} />
              </div>
              <h4 className="ha-warning-title">
                {t('awareness.warningSignsTitle', 'Warning signs: Get checked if you notice')}
              </h4>
            </div>

            <div className="ha-warning-grid">
              {data.warningSigns.points.map((pt, i) => (
                <div key={i} className="ha-warning-item">
                  <span className="ha-warning-dot" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ha-warning-callout">
            <div className="ha-callout-icon">
              <Stethoscope size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="ha-callout-title">
                {data.warningSigns.calloutTitle}
              </p>
              <p className="ha-callout-sub">
                {data.warningSigns.calloutText}
              </p>
            </div>
          </div>
        </div>

        {/* ===================== SECTION: TRUSTED SOURCES ===================== */}
        <div className="ha-section-card">
          <div className="ha-section-header">
            <BookOpen size={18} style={{ color: "#2563eb" }} />
            <h4 className="ha-section-title">{t('awareness.trustedSources', 'Trusted sources')}</h4>
          </div>

          <div className="ha-sources-grid">
            {data.sources.map((src, i) => (
              <SourceCard key={i} source={src} />
            ))}
          </div>
        </div>

        {/* ===================== SECTION: DISCLAIMER ===================== */}
        <div className="ha-disclaimer-card">
          <div className="ha-disclaimer-left">
            <div className="ha-disclaimer-icon-circle">
              <Shield size={16} strokeWidth={2.2} />
            </div>
            <div>
              <p className="ha-disclaimer-title">{t('dashboard.clinicalDisclaimerTitle', 'Disclaimer')}</p>
              <p className="ha-disclaimer-text">
                {t('detailedReport.disclaimerBody', 'This information is for educational purposes only and not a substitute for professional medical advice. Always consult a qualified healthcare provider for medical concerns.')}
              </p>
            </div>
          </div>

          <div className="ha-disclaimer-illustration">
            <HeartHandshake size={26} className="stroke-[1.8]" />
          </div>
        </div>

        {/* ===================== BOTTOM VALUE STRIP ===================== */}
        <div className="ha-bottom-strip">
          <div className="ha-bottom-pillar">
            <Lightbulb size={16} style={{ color: "#ec4899" }} />
            <span>{t('awareness.awarenessIsPower', 'Awareness Is Power')}</span>
          </div>

          <div className="ha-bottom-pillar">
            <ShieldCheck size={16} style={{ color: "#0d9488" }} />
            <span>{t('awareness.preventionIsPossible', 'Prevention Is Possible')}</span>
          </div>

          <div className="ha-bottom-pillar">
            <Search size={16} style={{ color: "#0284c7" }} />
            <span>{t('awareness.detectionSavesLives', 'Detection Saves Lives')}</span>
          </div>

          <div className="ha-bottom-pillar">
            <Users size={16} style={{ color: "#9333ea" }} />
            <span>{t('awareness.togetherWeCan', 'Together We Can')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAwareness;
