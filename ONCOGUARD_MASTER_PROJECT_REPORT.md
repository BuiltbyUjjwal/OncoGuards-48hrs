# ONCOGUARD: EXPLAINABLE AI-POWERED EARLY CANCER RISK ESCALATION PLATFORM
## Comprehensive Master Technical & Strategic Project Report
**Document Status:** Master Architecture & Engineering Blueprint (Version 6.0 - Definitive Edition)  
**Target Beneficiaries:** Public Healthcare Infrastructure, Low-Resource Communities, Primary Healthcare Workers (ASHA/ANM), and Common Citizens  
**Core Mission:** Democratizing Early Cancer Risk Stratification — 100% Free, Explainable, and Clinically Grounded for Every Citizen  

---

## TABLE OF CONTENTS
1. [Executive Summary & Humanitarian Vision](#1-executive-summary--humanitarian-vision)
2. [Problem Statement & Public Health Landscape](#2-problem-statement--public-health-landscape)
3. [System Architecture & 3-Layer Hybrid AI Engine](#3-system-architecture--3-layer-hybrid-ai-engine)
4. [Cancer Screening Domains & Implementation Status](#4-cancer-screening-domains--implementation-status)
5. [Layer-by-Layer Technical Specification](#5-layer-by-layer-technical-specification)
   - 5.1 [Layer 1: Deterministic Clinical Rule Engine](#51-layer-1-deterministic-clinical-rule-engine)
   - 5.2 [Layer 2: Explainable Machine Learning (XGBoost + SHAP)](#52-layer-2-explainable-machine-learning-xgboost--shap)
   - 5.3 [Layer 3: Grounded Clinical Guidance (RAG + LLM)](#53-layer-3-grounded-clinical-guidance-rag--llm)
6. [Data Pipeline, Schemas, & Single-Call Multi-Cancer Dispatcher](#6-data-pipeline-schemas--single-call-multi-cancer-dispatcher)
7. [Current Implementation vs. Production Roadmap](#7-current-implementation-vs-production-roadmap)
8. [Modularity & Extensibility Framework](#8-modularity--extensibility-framework)
9. [Scalability Architecture: From Free-Tier MVP to National Infrastructure](#9-scalability-architecture-from-free-tier-mvp-to-national-infrastructure)
10. [Medical Safety, Ethical AI, and Regulatory Compliance](#10-medical-safety-ethical-ai-and-regulatory-compliance)
11. [Strategic Challenges, Risks, and Mitigations](#11-strategic-challenges-risks-and-mitigations)
12. [Government & NGO Integration Strategy (ABHA, ICMR, ASHA)](#12-government--ngo-integration-strategy-abha-icmr-asha)
13. [Conclusion & Project Outlook](#13-conclusion--project-outlook)
14. [Appendix: API Contracts & Clinical Evaluation Artifacts](#14-appendix-api-contracts--clinical-evaluation-artifacts)

---

## 1. EXECUTIVE SUMMARY & HUMANITARIAN VISION

Cancer is rapidly emerging as one of the leading causes of premature mortality and catastrophic healthcare expenditure across low- and middle-income countries, particularly in India. In majority of rural and peri-urban demographics, cancer is diagnosed only at Stage III or IV—not because therapeutic interventions are completely unavailable, but because early symptoms are misunderstood, ignored, or detected too late for curative care.

**OncoGuard** is an explainable, multi-layer artificial intelligence platform designed for **early cancer risk stratification, escalation, and guided preventive navigation**. Unlike generic symptom checkers or black-box health apps, OncoGuard implements a deterministic and clinically anchored architecture combining:
1. **ICMR/WHO-calibrated Rule-Based Logic** for reliable baseline screening.
2. **Explainable Machine Learning (XGBoost + SHAP)** providing transparent, mathematical feature attribution for individualized risk factors.
3. **Retrieval-Augmented Generation (RAG)** grounded in 26+ verified oncology protocols to deliver hallucination-free, patient-centric next steps.

### Humanitarian Mission: 100% Free Public Health Tool
Our founding ethos is absolute accessibility: **OncoGuard is engineered to remain permanently free for every common citizen.** 

Currently operating on open-source libraries, free-tier cloud orchestration, and optimized local fallback heuristics, the platform is designed to scale into a sovereign public healthcare utility upon securing institutional grants, NGO partnerships, or Ministry of Health (MoHFW) funding.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ONCOGUARD CORE VALUES                                │
├─────────────────────────┬───────────────────────────────┬────────────────────────┤
│     UNIVERSAL ACCESS    │      EXPLAINABLE & AUDITABLE  │   CLINICALLY GROUNDED  │
│  Free for every citizen │  No black-box predictions;    │  Strictly non-         │
│  across low-end phones, │  SHAP feature attribution for │  diagnostic; grounded  │
│  offline PWAs, & ASHA   │  clinicians and patients      │  in ICMR/WHO protocols │
└─────────────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## 2. PROBLEM STATEMENT & PUBLIC HEALTH LANDSCAPE

### 2.1 The Epidemiological Crisis
- **Incidence vs. Late Detection:** India reports over 14.6 lakh (1.46 million) new cancer diagnoses annually. Tragically, over **60% to 70%** present at locally advanced or metastatic stages (Stages III/IV), drastically dropping 5-year survival rates and escalating treatment costs by 300–500%.
- **High-Incidence Anatomy:** Four anatomical sites account for the overwhelming majority of preventable and screenable cancer mortality in India:
  1. **Oral Cavity:** Driven by smokeless tobacco, gutka, khaini, and areca nut chewing (leading malignancy in Indian men).
  2. **Lung:** Driven by smoking, biomas/chulha fuel smoke in rural households, and extreme ambient air pollution.
  3. **Breast:** Leading malignancy in Indian women, suffering from late diagnosis due to societal taboos and lack of self-examination awareness.
  4. **Cervix:** Highly preventable via HPV vaccination and routine screening, yet a leading killer among rural women due to screening deserts.

```
      INDIAN CANCER PRESENTATION PARADOX
┌──────────────────────────────────────────────────┐
│ STAGE I & II (Early Detection)                   │  ~30% Diagnosed  ──► 80-90% Survival
├──────────────────────────────────────────────────┤
│ STAGE III & IV (Delayed Escalation)              │  ~70% Diagnosed  ──► 15-30% Survival
└──────────────────────────────────────────────────┘
```

### 2.2 Systemic Failures of Existing Solutions
- **General Health Loggers:** Merely record symptoms without clinical duration weighting or cancer-specific escalation thresholds.
- **Black-Box AI Models:** Deep learning systems that output probabilistic risk without explainability, inducing anxiety or false security while alienating medical doctors who cannot audit the rationale.
- **LLM Hallucinations:** Direct LLM chatbots frequently hallucinate clinical advice, generate alarmist diagnoses, or lack localized screening pathways (e.g., advising expensive PET-CTs instead of Primary Health Center referrals).
- **Urban & Resource Bias:** Digital health tools require high-speed 4G/5G, modern iOS/Android flagships, and high English literacy, effectively excluding 700+ million rural citizens.

---

## 3. SYSTEM ARCHITECTURE & 3-LAYER HYBRID AI ENGINE

OncoGuard solves the safety-vs-capability dilemma by enforcing a strict **3-Layer Hybrid AI Architecture**. Every user assessment flows sequentially through deterministic rules, interpretable machine learning, and protocol-grounded natural language synthesis.

```
                         PATIENT INPUT (Single Unified Profile)
                      (Age, Gender, Symptoms, Durations, Habits)
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                     LAYER 1: CLINICAL RULE ENGINE                         │
   │   - ICMR / WHO CAUTION Protocol Weights & Time-Decay Functions            │
   │   - Duration-Weighted Multipliers (>1wk, >3wk, >6wk persistence)          │
   │   - Output: Weighted Score (0-100), Baseline Tier (Low/Medium/High)       │
   │   - Anatomy/Gender Applicability Gate (e.g., Cervical male bypass)       │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                 LAYER 2: EXPLAINABLE MACHINE LEARNING                     │
   │   - Model Registry (Pluggable XGBoost Classifiers)                        │
   │   - Lung: 3-Class Multiclass (multi:softprob) on Ordinal Feature Vector   │
   │   - Cervical: Binary Classifier on UCI Clinical & STD Parameters          │
   │   - Breast: Weighted Binary Classifier on 2.39M BCSC Screening Records   │
   │   - SHAP TreeExplainer: Mathematical feature contributions (top factors)  │
   │   - Clinically Defensible Feature Filtering (suppresses confounders)      │
   │   - Graceful Fallback for missing models (e.g., Oral dataset slot)        │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │             LAYER 1 & LAYER 2 SAFETY CONCILIATION ENGINE                  │
   │   - most_severe_tier(L1_tier, L2_tier) -> Conservative Bias               │
   │   - Ensures high clinical suspicion is never masked by ML probabilities   │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │              LAYER 3: GROUNDED RAG + LLM GUIDANCE LAYER                   │
   │   - FAISS In-Memory Vector Store (26 Tagged ICMR/WHO Protocol Chunks)     │
   │   - Semantic Embedding Search (sentence-transformers/all-MiniLM-L6-v2)    │
   │   - Pre-filtered by Target Cancer Type & Severity Tier                    │
   │   - Guardrailed LLM Synthesis (OpenRouter / Anthropic Claude / Fallback) │
   │   - Output: Plain-Language Guidance, Referral Urgency, Action Checklist   │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
               UNIFIED 4-CANCER STRUCTURED RESPONSE (JSON / UI Cards)
```

---

## 4. CANCER SCREENING DOMAINS & IMPLEMENTATION STATUS

OncoGuard executes risk assessments across the four critical cancer types in a **single synchronous request**. The table below documents the verified implementation state across all layers:

| Cancer Domain | Layer 1: Rule Engine | Layer 2: Explainable ML | Layer 3: RAG Guidance | Current System Status |
| :--- | :--- | :--- | :--- | :--- |
| **Lung Cancer** | ✅ Implemented (Age, Cough duration, Hemoptysis, Smoking, Chulha/Air exposure) | ✅ Implemented (3-class XGBoost model; 23 ordinal features; SHAP attribution) | ✅ Implemented (Cancer-type-aware protocol retrieval) | **Complete End-to-End** |
| **Breast Cancer** | ✅ Implemented (Age bands, Lumps, Nipple discharge, Dimpling, Family history) | ✅ Implemented (BCSC trained on 2.39M screening records; Female-only gate) | ✅ Implemented (Dedicated clinical mammography protocols) | **Complete End-to-End** |
| **Cervical Cancer**| ✅ Implemented (WHO age curve, Post-coital bleeding, HPV, Screening interval) | ✅ Implemented (UCI Clinical Risk model; SMOTENC balanced; Binary XGBoost) | ✅ Implemented (Pap/HPV testing & District referral pathways) | **Complete End-to-End** |
| **Oral Cancer** | ✅ Implemented (Smokeless tobacco, Gutka, Non-healing ulcer duration, Leukoplakia) | 🔮 **Planned / Scaffolded** (Registry slot reserved; graceful fallback active) | ✅ Implemented (Layer 1-guided ICMR protocol synthesis) | **Hybrid Active (L1+L3)** |

---

## 5. LAYER-BY-LAYER TECHNICAL SPECIFICATION

### 5.1 Layer 1: Deterministic Clinical Rule Engine
- **Module:** `backend/brain/rule_engine.py`
- **Clinical Foundation:** Modeled upon the ICMR National Cancer Control Programme and WHO early warning sign frameworks (CAUTION).
- **Core Principles:**
  1. **Auditability:** Deterministic math ensures identical inputs produce identical scores, enabling clinical auditability.
  2. **Temporal Duration Multipliers:** Symptoms persisting past physiological healing windows receive exponential weight via `_duration_weight()`:
     - Duration $< 1$ week: Base score (acute/reactive marker).
     - Duration $1 - 3$ weeks: Moderate risk multiplier.
     - Duration $> 3$ weeks: Critical escalation threshold (red-flag marker).
     - Duration $> 6$ weeks: Severe chronic flag.

```
       DURATION WEIGHTING CURVE (_duration_weight helper)
  Points
    ▲
 30 ┼─────────────────────────────────────────────● (>6 Weeks)
 20 ┼───────────────────────────────● (>3 Weeks)
 10 ┼────────────────● (≥1 Week)
  5 ┼──● (Acute / Unknown)
    └─────┴──────────┴──────────────┴─────────────┴────────►
       0 wks       1 wk           3 wks         6 wks    Time
```

#### Rule Weight Breakdown by Cancer Type

##### 1. Lung Cancer Scoring Table
- Persistent cough (>3 weeks): $+25$ points
- Hemoptysis (coughing blood): $+30$ points (Immediate Red Flag)
- Active tobacco smoking (duration & pack years): $+15$ to $+25$ points
- Age gradient ($\ge 60$: $+20$, $50-59$: $+15$, $40-49$: $+10$)
- Occupational/Chulha smoke exposure: $+10$ points
- Unexplained weight loss / Dyspnea: $+10$ points

##### 2. Breast Cancer Scoring Table
- Palpable breast lump (>3 weeks): $+20$ to $+30$ points
- Nipple retraction / Unusual bloody discharge: $+15$ points
- Skin dimpling ("peau d'orange"): $+15$ points
- Family history (first-degree relative): $+15$ points
- Age gradient ($\ge 60$: $+20$, $50-59$: $+15$, $40-49$: $+10$, $30-39$: $+5$)

##### 3. Oral Cancer Scoring Table
- Smokeless tobacco / Gutka / Paan / Areca nut use: $+25$ points (Decisive Indian demographic risk)
- Non-healing oral ulcer (>3 weeks): $+20$ to $+25$ points
- Red/White oral mucosal patches (Erythroplakia / Leukoplakia): $+20$ points
- Difficulty swallowing / Trismus (restricted mouth opening): $+10$ points
- Synergistic alcohol consumption: $+10$ points

##### 4. Cervical Cancer Scoring Table & Anatomy Gating
- Abnormal / Post-coital vaginal bleeding: $+25$ points (Decisive WHO red flag)
- Chronic foul-smelling discharge / Pelvic pain: $+10$ to $+15$ points
- Known HPV-positive status: $+20$ points
- Screening overdue (>3-5 years since last Pap/VIA): $+15$ points
- **Structured Anatomy Guard:** If `gender != Gender.FEMALE`, Layer 1 immediately returns `applicable = False`, score $= 0$, and tier $= \text{LOW}$, cleanly short-circuiting downstream computation.

---

### 5.2 Layer 2: Explainable Machine Learning (XGBoost + SHAP)
- **Module:** `backend/brain/ml_layer.py`
- **Architectural Pattern:** Model Registry Pattern (`_MODEL_REGISTRY: dict[CancerType, str]`). Adding a new cancer model requires zero changes to API routes or core orchestrators.

```
       MODEL REGISTRY PLUG-IN ARCHITECTURE
  _MODEL_REGISTRY = {
      CancerType.LUNG:     "lung_xgb_model.json",     # Multi-class (Low/Med/High)
      CancerType.CERVICAL: "cervical_xgb_model.json", # Binary Logistic + SMOTENC
      CancerType.BREAST:   "breast_xgb_model.json",   # BCSC Mammogram Weighted
      # CancerType.ORAL:   "oral_xgb_model.json"      # Reserved Slot
  }
```

#### Dataset Curation & Training Methodologies

##### A. Lung Cancer Model (Cancer Patients & Air Pollution Benchmark)
- **Dataset:** 1,000 real-world observational profiles across 23 ordinal (1–9) exposure and symptom attributes.
- **Algorithm:** XGBoost 3-class classifier (`objective="multi:softprob"`, `num_class=3`).
- **Class Encoding Alignment:** Strictly preserved `Low → 0`, `Medium → 1`, `High → 2` aligned with `_MULTICLASS_TIER_ORDER`.
- **Clinically Defensible Filtering:** Raw models often capture spurious statistical artifacts in small datasets (e.g., diet or allergies showing artificial correlations). OncoGuard implements `LUNG_CLINICALLY_DEFENSIBLE`, explicitly pruning non-actionable confounders from the patient-facing SHAP report:
  - *Retained:* Age, Smoking, Passive Smoke, Air Pollution, Occupational Hazards, Chronic Lung Disease, Chest Pain, Hemoptysis, Dyspnea, Weight Loss, Finger Clubbing.
  - *Suppressed:* Gender, Obesity, Balanced Diet artifacts, Non-specific colds.

##### B. Cervical Cancer Model (UCI Machine Learning Repository)
- **Dataset:** 858 clinical patient records with biopsy and cytology confirmations (cleaned to 835 non-duplicate rows).
- **Leakage Prevention:** Diagnostic outcome columns (`Dx:Cancer`, `Dx:CIN`, `Dx:HPV`, `Hinselmann`, `Schiller`) were strictly stripped to guarantee inference runs purely on predictive risk factors.
- **Imbalance Handling:** Pre-processed with `SMOTENC` (Synthetic Minority Over-sampling for Nominal and Continuous features) on the training set to resolve the 6.4% baseline positive skew without creating impossible categorical fractions.
- **Tone-Sensitive Feature Selection:** Excluded sensitive fields (such as lifetime sexual partner counts) from user-facing SHAP text to avoid user alienation while retaining high predictive fidelity.

##### C. Breast Cancer Model (BCSC Surveillance Consortium)
- **Dataset:** 2,392,998 real-world screening mammography records pre-aggregated into 280,660 risk combinations.
- **Handling Massive Scale & Imbalance:** Handled via `scale_pos_weight` reweighting rather than synthetic oversampling, accurately learning the low positive base rate (~0.49%).
- **Weighted Covariance:** Uses frequency-weighted covariance matrices (`sample_weight`) across BCSC 5-year age groups (35–84).
- **Gender Gating:** Models are validated exclusively on female biological screening data. Male profiles bypass ML inference with structured `model_available = False` and rely safely on Layer 1 + Layer 3.

#### SHAP Explainability Engine
OncoGuard computes exact Shapley values using `shap.TreeExplainer`. For every assessment, the system produces:
1. **Top Contributing Risk Factors:** Symptoms and exposures that pushed the score upward.
2. **Protective Factors:** Mitigating lifestyle factors (e.g., non-smoker status, regular screening) that lowered the score.
3. **Defensive Matrix Handling:** Supports 3D arrays $(N_{\text{samples}}, N_{\text{features}}, N_{\text{classes}})$, 2D binary matrices, and older array formats interchangeably.

```
       SAMPLE SHAP DECOMPOSITION (Lung Cancer Assessment)
  Base Value (Population Mean) ──────────────────────────► 0.18
   + Persistent Cough (>3 weeks)   [+0.35]  ▲
   + Active Tobacco Smoking        [+0.22]  ▲
   + Age (54 Years)                [+0.12]  ▲
   - No Family History of Cancer   [-0.08]  ▼
   - High Physical Activity        [-0.07]  ▼
  ─────────────────────────────────────────────────────────────
  FINAL PREDICTED RISK PROBABILITY ──────────────────────► 0.72 (HIGH TIER)
```

---

### 5.3 Layer 3: Grounded Clinical Guidance (RAG + LLM)
- **Module:** `backend/brain/rag_llm_layer.py`
- **Knowledge Base:** `backend/brain/protocol_chunks.py` (26 specialized clinical protocol chunks categorized by `["lung"]`, `["breast"]`, `["oral"]`, `["cervical"]`, and `["general"]`).
- **Vector Database:** In-Memory FAISS (Facebook AI Similarity Search) index utilizing `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense semantic vectors.

#### Cancer-Type-Aware Retrieval Pipeline
1. **Targeted Query Formulation:** Queries are dynamically prefixed (`"{cancer_type} cancer: {factors}"`) to prevent semantic bleed across anatomical domains.
2. **Over-Fetch & Tag Filtering:** FAISS over-fetches $k \times 4$ candidate protocol chunks and filters them against the target cancer tag and distance threshold ($d < 1.0$).
3. **Structured Context Injection:** Retrieved ICMR guidelines, referral urgency timelines, and facility recommendations are injected into the prompt context.
4. **Resilient LLM Invocation:**
   - **Production Engine:** Anthropic Claude 3.5 / OpenRouter API endpoints with zero-temperature constraint for medical consistency.
   - **Lazy Client Initialization:** Solves startup crashes when API keys are uninitialized.
   - **Deterministic Fallback Engine:** If offline or API credits expire, parameterized fallback templates generate immediate, cancer-type-accurate, tier-specific clinical instructions.

```
                  RAG GROUNDING & GUARDRAIL WORKFLOW
 ┌──────────────────────┐      ┌─────────────────────────────────────────┐
 │ Patient Risk Profile │ ───► │ all-MiniLM-L6-v2 Semantic Embedder      │
 └──────────────────────┘      └────────────────────┬────────────────────┘
                                                    │ 384-d Vector
                                                    ▼
 ┌──────────────────────┐      ┌─────────────────────────────────────────┐
 │ 26 ICMR Guideline    │ ───► │ FAISS Vector Search (k=4 overfetch)    │
 │ Protocol Chunks      │      │ + Domain Filter (e.g. tag == "breast")  │
 └──────────────────────┘      └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │ Guardrailed Prompt Synthesis            │
                               │ - "Do NOT diagnose"                     │
                               │ - "Mandate physician consultation"      │
                               │ - "Cite retrieved ICMR referral steps"  │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │ Claude API / Parameterized Fallback     │
                               │ Plain-Language Actionable Guidance      │
                               └─────────────────────────────────────────┘
```

---

## 6. DATA PIPELINE, SCHEMAS, & SINGLE-CALL MULTI-CANCER DISPATCHER

### 6.1 Unified Patient Profile Schema
- **Module:** `backend/schemas.py`
- Rather than forcing patients to complete four disjointed forms, OncoGuard accepts a unified `PatientInput` schema. Only `age` and `gender` are mandatory; all ~65 other fields possess clinically sound defaults (e.g., standard ordinal severity $= 1$, BCSC unknown $= 9$, cervical counts $= 0$).

### 6.2 Multi-Cancer Execution Flow
A single `POST /api/v1/assessment` call orchestrates the full pipeline across all 4 targets:

```python
# Execution Dispatcher Logic (backend/main.py)
for cancer_type in CancerType:
    # 1. Evaluate Rule Engine
    rule_res = score_cancer_risk(cancer_type, patient_profile)
    
    if not rule_res.applicable:
        results[cancer_type.value] = {
            "overall_tier": "not_applicable",
            "layer1": rule_res.dict(),
            "layer2": None,
            "layer3": None
        }
        continue
        
    # 2. Evaluate ML Layer (with graceful fallback if model missing)
    ml_res = predict_ml_risk(cancer_type, patient_profile, rule_res)
    
    # 3. Conciliate Tiers (Over-referral safety bias)
    final_tier = most_severe_tier(rule_res.tier, ml_res.tier)
    
    # 4. Synthesize RAG-Grounded Guidance
    guidance_res = generate_guidance(cancer_type, final_tier, ml_res.top_factors)
    
    results[cancer_type.value] = {
        "overall_tier": final_tier.value,
        "layer1": rule_res.dict(),
        "layer2": ml_res.dict(),
        "layer3": guidance_res.dict()
    }
```

---

## 7. CURRENT IMPLEMENTATION VS. PRODUCTION ROADMAP

To maintain complete engineering transparency, the table below outlines what is actively working in the current repository codebase versus the target architecture when funded:

```
┌────────────────────────┬───────────────────────────────┬─────────────────────────────────┐
│ COMPONENT              │ CURRENT WORKING CODEBASE      │ FUNDED PRODUCTION TARGET        │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Rule Engine (L1)       │ 4 Cancers, in-memory Python   │ Config-driven JSON/YAML rules,  │
│                        │ evaluation in rule_engine.py  │ continuous ICMR rule updater    │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Machine Learning (L2)  │ XGBoost for Lung, Breast,     │ 4 Cancers + ONNX Edge Runtime,  │
│                        │ Cervical; SHAP TreeExplainer  │ Quantized local mobile models   │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Knowledge Base (L3)    │ 26 Tagged chunks in memory;   │ 500+ Chunks; Qdrant/Milvus;     │
│                        │ FAISS CPU vector index        │ Auto-synced with PubMed/ICMR    │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ LLM Generation         │ OpenRouter / Fallback engine; │ Fine-tuned Open LLMs (Llama 3-  │
│                        │ English guidance              │ Med) + Bhashini (12 Languages)  │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Persistence & Tracking │ Stateless single API cycle    │ PostgreSQL + TimescaleDB for    │
│                        │ (no active database)          │ 21-day longitudinal tracking    │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Hospital Navigation    │ Parameterized recommendations │ Real-time GPS + OpenStreetMap + │
│                        │ in protocol chunks            │ Ayushman Bharat Empanelled DB   │
├────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Client Deployment      │ React 18 SPA (Vite/Tailwind)  │ Offline-First PWA + ASHA Mobile │
│                        │ communicating with FastAPI    │ App with SQLite sync engine     │
└────────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 8. MODULARITY & EXTENSIBILITY FRAMEWORK

OncoGuard is architected to scale effortlessly to additional cancer types (e.g., Colorectal, Prostate, Head & Neck) with zero core refactoring:

```
                ADDING A NEW CANCER TYPE (3-Step Plug-in)
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Add Clinical Rule Function in brain/rule_engine.py             │
│         Define symptom weights, duration multipliers, and triggers     │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 2: Drop Trained Model into backend/models/ & Register in ml_layer │
│         Add CancerType entry in _MODEL_REGISTRY & patient_to_row map   │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 3: Tag Clinical Protocols in brain/protocol_chunks.py             │
│         Add ICMR guidelines with cancer_types=["new_cancer"]           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 9. SCALABILITY ARCHITECTURE: FROM FREE-TIER MVP TO NATIONAL INFRASTRUCTURE

To fulfill our mission of providing a **100% free, national-scale service for hundreds of millions of citizens**, OncoGuard features a clear infrastructure evolution roadmap:

```
                  SOVEREIGN PUBLIC HEALTH SCALING TOPOLOGY
                                    
                       [CITIZENS & ASHA WORKERS]
                  (2G/3G/4G Mobile, Offline PWA, Web)
                                   │
                                   ▼
                  [Cloudflare Global CDN & Edge WAF]
                    (DDoS Shield, Edge Rate Limiting)
                                   │
                                   ▼
             [Ingress Load Balancer (NGINX / HAProxy)]
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│ FastAPI Stateless Pods (API)  │ ◄─────────► │ Celery / Kafka Async Workers  │
│ - Rule Engine Evaluation      │             │ - Longitudinal Batch Scans    │
│ - ONNX In-Memory ML Inference │             │ - 21-Day Escalation Watchers  │
│ - Local Vector Search (FAISS) │             │ - SMS/WhatsApp Alert Triggers │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│ Redis Cluster Caching         │             │ PostgreSQL Cluster            │
│ - Session Tokens & Rate Limits│             │ - Master-Replica Architecture │
│ - Protocol Embedding Cache    │             │ - Encrypted Longitudinal Logs │
└───────────────────────────────┘             └───────────────────────────────┘
```

### 9.1 Edge & Offline-First Computation (Ultra-Low Cost)
1. **WebAssembly / ONNX Runtime:** Exporting trained XGBoost models to ONNX enables 100% local inference directly inside the user's browser or mobile device, reducing server computation costs to ₹0 per assessment.
2. **Offline-First PWA (Service Workers):** ASHA health workers in remote villages without active cellular coverage can record screening assessments locally. The application stores evaluations in IndexedDB and automatically synchronizes when 2G/3G connectivity is re-established.

### 9.2 High-Throughput Cloud Orchestration (Funded Horizon)
- **Containerized Microservices:** Docker + Kubernetes (K8s) deployment with Horizontal Pod Autoscaling (HPA) responding to traffic spikes during regional screening drives.
- **Asynchronous Task Architecture:** Offloading heavy RAG embeddings and longitudinal history comparisons to Celery workers backed by Redis/RabbitMQ, keeping synchronous API response times under 150ms.
- **Data Partitioning & Replication:** PostgreSQL with read-replicas and user-hash partitioning, ensuring compliance with Indian data sovereignty laws (Digital Personal Data Protection Act - DPDPA).

---

## 10. MEDICAL SAFETY, ETHICAL AI, AND REGULATORY COMPLIANCE

### 10.1 Absolute Non-Diagnostic Positioning
OncoGuard is legally and functionally a **Risk Stratification & Decision-Support System**, not a diagnostic device.
- **No Diagnostic Statements:** The system prompt explicitly forbids phrasing such as *"You have cancer"* or *"Diagnosis confirmed."*
- **Actionable Escalation:** Every outcome translates to clinical navigation instructions (e.g., *"Schedule clinical breast examination within 14 days"*).

### 10.2 The Over-Referral Safety Bias (`most_severe_tier`)
In preventive oncology, a **false negative** is catastrophic, while a **false positive** results in a safe, non-invasive confirmatory screening. 
OncoGuard hardcodes a conservative reconciliation policy:
$$\text{Final Tier} = \max(\text{Layer 1 Tier}, \text{Layer 2 Tier})$$
If a patient exhibits classic clinical red flags (e.g., 6-week hemoptysis) but the statistical ML model yields a low probability due to missing demographic fields, **Layer 1 immediately overrides Layer 2**, guaranteeing the patient is escalated to urgent care.

```
                   SAFETY CONCILIATION MATRIX
              ┌─────────────────┬─────────────────┬─────────────────┐
              │ Layer 1: LOW    │ Layer 1: MEDIUM │ Layer 1: HIGH   │
 ┌────────────┼─────────────────┼─────────────────┼─────────────────┤
 │ L2: LOW    │   LOW (Routine) │ MEDIUM (3-6 mo) │ HIGH (Urgent)   │
 ├────────────┼─────────────────┼─────────────────┼─────────────────┤
 │ L2: MEDIUM │ MEDIUM (3-6 mo) │ MEDIUM (3-6 mo) │ HIGH (Urgent)   │
 ├────────────┼─────────────────┼─────────────────┼─────────────────┤
 │ L2: HIGH   │   HIGH (Urgent) │  HIGH (Urgent)  │ HIGH (Urgent)   │
 └────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 11. STRATEGIC CHALLENGES, RISKS, AND MITIGATIONS

```
┌───────────────────────────────┬───────────────────────────────────┬──────────────────────────────────────┐
│ CHALLENGE / RISK              │ PUBLIC HEALTH IMPACT              │ ONCOGUARD MITIGATION STRATEGY        │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────┤
│ 1. Public Dataset Bias        │ Benchmark datasets contain        │ Clinically defensible SHAP filtering │
│    & Confounders              │ synthetic artifacts (e.g. diet)   │ suppresses non-causal features       │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────┤
│ 2. Healthcare Mistrust &      │ Users ignore digital escalations  │ Transparent SHAP explanations +      │
│    Screening Hesitancy        │ or fear cancer stigma             │ ASHA community worker involvement    │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────┤
│ 3. LLM Hallucinations         │ Providing ungrounded medical      │ Zero-temperature RAG tied to ICMR    │
│                               │ recommendations                   │ chunks; hardcoded fallback safety    │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────┤
│ 4. Rural Linguistic Diversity │ English-only platforms exclude    │ Integration with Bhashini AI;        │
│                               │ 80%+ of Indian population         │ Voice-first regional language UI     │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────┤
│ 5. Data Privacy & Sovereign   │ Leakage of sensitive health       │ DPDPA-compliant localized storage;   │
│    Compliance                 │ diagnostic history                │ AES-256 at rest; zero data selling   │
└───────────────────────────────┴───────────────────────────────────┴──────────────────────────────────────┘
```

---

## 12. GOVERNMENT & NGO INTEGRATION STRATEGY (ABHA, ICMR, ASHA)

To maintain OncoGuard as a permanently free public service, the platform is designed for seamless integration into national health digital pipelines:

```
                      NATIONAL DIGITAL HEALTH INTEGRATION
                                       
                      ┌─────────────────────────────────┐
                      │    ONCOGUARD RISK PLATFORM      │
                      └────────────────┬────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌────────────────────────┐   ┌────────────────────┐   ┌────────────────────────┐
│ AYUSHMAN BHARAT (ABHA) │   │ ASHA / ANM WORKERS │   │ DISTRICT ONCOLOGY      │
│ Link risk summary into │   │ Tablet screening   │   │ Auto-referral to ICMR- │
│ National Health Record │   │ app for door-to-   │   │ empanelled tertiary    │
│ (ABDM compliant)       │   │ door rural surveys │   │ cancer centers (TMH)   │
└────────────────────────┘   └────────────────────┘   └────────────────────────┘
```

1. **Ayushman Bharat Digital Mission (ABDM):** Patients can link their 14-digit ABHA ID to attach encrypted risk stratification reports directly to their longitudinal digital health locker.
2. **ASHA/ANM Rural Deployment:** Equipping community health workers with the OncoGuard offline tablet app enables community screening during village health days.
3. **Tertiary Care Referral Pathways:** Integrating automated appointment booking with regional cancer centres (e.g., Tata Memorial Hospital network, AIIMS, and State Cancer Institutes).

---

## 13. CONCLUSION & PROJECT OUTLOOK

OncoGuard represents a transformative leap in preventive oncology technology. By bridging the gap between ignored early symptoms and delayed clinical presentations, OncoGuard transforms complex clinical guidelines into an **accessible, explainable, and protective early warning system**.

The system has proven that high-grade explainability (SHAP), rigorous clinical grounding (ICMR RAG), and multi-cancer predictive pipelines can coexist in a lightweight, high-performance architecture. With future backing from public health institutions, NGOs, and government bodies, OncoGuard stands ready to scale nationwide—fulfilling its core mission of **saving lives through early cancer risk detection, freely available to every human being.**

---

## 14. APPENDIX: API CONTRACTS & CLINICAL EVALUATION ARTIFACTS

### Appendix A: Unified Multi-Cancer API Contract (`POST /api/v1/assessment`)

#### Sample Request Payload (Female Patient Profile)
```json
{
  "age": 52,
  "gender": "female",
  "smoker": true,
  "smoker_years": 20,
  "cough_duration_weeks": 4.0,
  "hemoptysis": false,
  "chest_pain": true,
  "breast_lump": true,
  "breast_lump_duration_weeks": 3.5,
  "breast_skin_changes": true,
  "cervical_hpv_positive": false,
  "cervical_abnormal_bleeding": false,
  "oral_ulcer_duration_weeks": 0.0,
  "oral_gutka_or_paan": false
}
```

#### Sample Response Payload (Multi-Cancer Synchronous Output)
```json
{
  "lung": {
    "overall_tier": "high",
    "layer1": {
      "score": 65,
      "tier": "medium",
      "triggered_factors": ["persistent_cough_3wks", "smoker_active", "age_50_plus"],
      "applicable": true
    },
    "layer2": {
      "probability": 0.74,
      "tier": "high",
      "top_factors": ["DRY_COUGH", "SMOKING", "AGE"],
      "protective_factors": ["NO_CHRONIC_LUNG_DISEASE"],
      "model_available": true
    },
    "layer3": {
      "guidance_text": "Your reported persistent cough exceeding 3 weeks combined with a 20-year smoking history indicates an elevated risk tier. According to ICMR guidelines, a diagnostic chest X-ray is strongly advised within 14 days.",
      "recommended_actions": [
        "Consult a pulmonologist or visit your District Hospital",
        "Obtain a Low-Dose Computed Tomography (LDCT) or Chest X-Ray",
        "Enroll in a structured tobacco cessation counseling program"
      ],
      "retrieved_sources": ["ICMR National Cancer Control Programme - Lung Cancer Guidelines"],
      "timeline_urgency": "Schedule within 7-14 days"
    }
  },
  "breast": {
    "overall_tier": "high",
    "layer1": {
      "score": 70,
      "tier": "high",
      "triggered_factors": ["breast_lump_persistent", "skin_nipple_changes", "age_50_plus"],
      "applicable": true
    },
    "layer2": {
      "probability": 0.048,
      "tier": "medium",
      "top_factors": ["AGEGRP", "BRSTPROC"],
      "protective_factors": [],
      "model_available": true
    },
    "layer3": {
      "guidance_text": "The presence of a palpable breast lump lasting over 3 weeks accompanied by skin changes warrants prompt clinical evaluation.",
      "recommended_actions": [
        "Consult a breast specialist or general surgeon",
        "Schedule a diagnostic bilateral mammogram and ultrasound"
      ],
      "retrieved_sources": ["WHO Early Detection & Screening Guidelines for Breast Cancer"],
      "timeline_urgency": "Immediate medical consultation recommended"
    }
  },
  "oral": {
    "overall_tier": "low",
    "layer1": {
      "score": 10,
      "tier": "low",
      "triggered_factors": ["age_50_plus"],
      "applicable": true
    },
    "layer2": {
      "probability": null,
      "tier": "low",
      "top_factors": [],
      "protective_factors": [],
      "model_available": false
    },
    "layer3": {
      "guidance_text": "Your oral health indicators currently reflect low risk. Continue routine oral hygiene and avoid tobacco consumption.",
      "recommended_actions": ["Maintain regular annual dental check-ups"],
      "retrieved_sources": ["ICMR Oral Cancer Prevention Advisory"],
      "timeline_urgency": "Routine annual screening"
    }
  },
  "cervical": {
    "overall_tier": "low",
    "layer1": {
      "score": 10,
      "tier": "low",
      "triggered_factors": ["age_50_plus"],
      "applicable": true
    },
    "layer2": {
      "probability": 0.015,
      "tier": "low",
      "top_factors": ["AGE"],
      "protective_factors": [],
      "model_available": true
    },
    "layer3": {
      "guidance_text": "No acute cervical warning signs reported. Adhere to periodic WHO routine screening intervals.",
      "recommended_actions": ["Schedule routine Pap smear / HPV testing as per age guidelines"],
      "retrieved_sources": ["WHO Guidelines for Screening and Treatment of Cervical Pre-cancer Lesions"],
      "timeline_urgency": "Routine screening schedule"
    }
  }
}
```

---

*Report authored for OncoGuard Development & Public Health Initiative.*  
*Document reference: `ONCOGUARD-MASTER-TR-V6.0`*
