# OncoGuard

**AI-assisted early cancer risk screening — not diagnosis.**

OncoGuard takes a patient's demographics, lifestyle, and symptoms and runs them through a
3-layer hybrid AI pipeline to produce an explainable risk tier and grounded next-step
guidance for **lung, breast, and cervical cancer**, with oral cancer scaffolded in and
ready for a fourth model.

> ⚠️ **OncoGuard does not diagnose cancer and is not a substitute for a medical
> professional.** Every output is advisory. All risk tiers, ML probabilities, and
> LLM-generated guidance exist to encourage timely screening — never to replace it.

---

## Table of Contents

- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Frontend Overview](#frontend-overview)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Cancer Type Coverage](#cancer-type-coverage)
- [Current Scope & Known Limitations](#current-scope--known-limitations)
- [Roadmap](#roadmap)
- [Clinical Grounding](#clinical-grounding)

---

## Architecture

OncoGuard's backend runs every submitted patient profile through three layers, in order,
for **each** cancer type in a single request.

**Layer 1 — Rule Engine** (`brain/rule_engine.py`): Deterministic, CAUTION-style weighted
scoring per cancer type. No ML, no network calls — pure Python logic. Always runs.
Output: score (0–100), tier (low/medium/high), triggered_factors.

**Layer 2 — ML Layer** (`brain/ml_layer.py`): XGBoost classifier + SHAP TreeExplainer,
one trained model per cancer type (via a model registry). Falls back to a graceful
"no model yet" placeholder for cancer types without a trained model.
Output: probability, tier, top_factors, protective_factors.

**Layer 3 — RAG + LLM** (`brain/rag_llm_layer.py`): Embeds Layer 1 + Layer 2 output
(all-MiniLM-L6-v2), retrieves the most relevant clinical protocol chunks via FAISS, and
generates patient-facing guidance through an LLM — grounded in what was retrieved, not
the model's raw knowledge.
Output: guidance_text, recommended_actions, retrieved_sources, timeline_urgency.

**Why layered like this, specifically:** the rule engine is a safety net that always
produces a result even if the ML model or the LLM API is unavailable. Layer 2 adds
probabilistic, explainable nuance on top. Layer 3 never speaks from its own medical
"knowledge" — it's constrained to the ICMR/WHO-derived protocol chunks retrieved by
FAISS, which is what keeps it from hallucinating medical advice.

**Safe-default tier resolution:** when Layer 1 and Layer 2 disagree on a patient's risk
tier, the API does **not** average or default to Layer 2 — `schemas.most_severe_tier()`
always takes the *more severe* of the two, and Layer 3's guidance is generated against
that resolved tier. This exists specifically to prevent a dangerous tier-downgrade (e.g.
the rule engine flagging HIGH risk but the ML model — trained on a different, imperfect
dataset — scoring MEDIUM, and the system showing the less urgent result to the patient).

### A separate, unrelated AI feature: the Frontend "AI Assistant" chat

Worth knowing before a judge asks about it: `frontend/src/AIAssistantPage.tsx` is a
**second, independent chat feature** that calls Groq/Gemini directly from the browser.
It is not part of the 3-layer pipeline above, is not grounded by the FAISS/ICMR
retrieval step, and is a separate architectural decision from Layer 3. See
[Current Scope & Known Limitations](#current-scope--known-limitations).

---

## Repository Structure

```
OncoGuards-48hrs/
├── backend/
│   ├── brain/
│   │   ├── rule_engine.py        # Layer 1 — all 4 cancer types, one file
│   │   ├── ml_layer.py           # Layer 2 — XGBoost + SHAP, model registry + allowlist
│   │   ├── rag_llm_layer.py      # Layer 3 — FAISS retrieval + OpenRouter LLM guidance
│   │   ├── protocol_chunks.py    # Layer 3's clinical knowledge base (26 chunks, tagged by cancer type)
│   │   ├── chat_layer.py         # AI Assistant backend layer (Groq/Gemini routing)
│   │   ├── db.py                 # SQLite database helpers (assessment persistence)
│   │   └── oncoguard.db          # SQLite database file (gitignored in prod)
│   ├── datasets/                 # training data — gitignored, not committed
│   ├── models/                   # trained XGBoost models (lung, breast, cervical)
│   ├── notebooks/                # one training notebook per cancer type
│   ├── main.py                   # FastAPI app — /api/v1/assessment + additional endpoints
│   ├── schemas.py                # PatientProfile, Gender/RiskTier/CancerType enums, most_severe_tier()
│   ├── test_suite.py             # Backend test suite
│   └── requirements.txt
│
├── env.example                   # Root-level env template (backend vars)
│
└── frontend/
    ├── src/
    │   ├── assets/               # MedicalIcons.tsx (SVG icon components),
    │   │                         # HealthcareIllustration.tsx (hero illustration)
    │   ├── components/           # Reusable UI — Sidebar, MobileBottomNav, RiskGaugeSemiCircle,
    │   │                         # ScreeningAlertBanner, AssessmentSidePanel, LoginForm,
    │   │                         # SignUpForm, BrandLogo, BreastSelfExamModal, HealthAwareness,
    │   │                         # PasswordStrengthIndicator, TrustPoints, RibbonIcon
    │   ├── context/              # AssessmentContext (Firestore persistence + local state),
    │   │                         # AuthContext (Firebase Auth), LanguageContext, ThemeContext
    │   ├── config/
    │   │   ├── api.ts            # API_BASE_URL constant (reads VITE_API_BASE_URL env var)
    │   │   ├── firebase.ts       # Firebase project config
    │   │   └── screeningGuidelines.ts  # CANCER_SCREENING_CONFIG, alert helpers, disclaimers
    │   ├── i18n/                 # i18next setup + en / hi locale files
    │   ├── styles/               # One CSS file per page + shared variables.css
    │   ├── types/                # assessment.ts — CancerResultItem, RiskTier, AssessmentState
    │   │
    │   │   ── Auth & Account ──
    │   ├── LoginPage.tsx                      # Firebase email/password login
    │   ├── SignUpPage.tsx                     # New account registration
    │   ├── ForgotPasswordPage.tsx             # Password reset via Firebase
    │   │
    │   │   ── Core App ──
    │   ├── DashboardPage.tsx                  # Main hub — risk summary, quick actions, alerts
    │   ├── ProfilePage.tsx                    # User profile & assessment history
    │   ├── SettingsPage.tsx                   # App preferences, language, theme, notifications
    │   ├── PlaceholderPage.tsx                # Generic placeholder for in-progress routes
    │   │
    │   │   ── Multi-step Health Profile Assessment ──
    │   ├── RiskAssessmentIntroPage.tsx        # Assessment entry point & section overview
    │   ├── BasicInfoSectionPage.tsx           # Step 1: Age, sex, height/weight, location
    │   ├── LifestyleSectionPage.tsx           # Step 2: Smoking, alcohol, diet, exercise, occupation
    │   ├── MedicalHistorySectionPage.tsx      # Step 3: Family history, prior conditions, medications
    │   ├── WomenOnlySectionPage.tsx           # Step 4 (female only): Reproductive & hormonal history
    │   ├── ScreeningHistorySectionPage.tsx    # Step 5 (female) / Step 4 (male): Prior screening dates
    │   ├── SymptomsSectionPage.tsx            # Step 6: Current symptoms (duration, severity, type)
    │   ├── ReviewAnswersPage.tsx              # Full profile review before submission
    │   ├── SubmitAnalyzePage.tsx              # Multi-stage animated submission → backend API call
    │   │
    │   │   ── Results & Reports ──
    │   ├── ResultsPage.tsx                    # Risk results with semi-circular gauge per cancer type
    │   ├── DetailedReportPage.tsx             # Full explainable report (Layer 1+2+3 breakdown)
    │   ├── ExplanationRecommendationsPage.tsx # Why this risk tier + what to do next
    │   ├── ReportsDashboardPage.tsx           # Saved reports history (Firestore-backed)
    │   │
    │   │   ── Health & Awareness ──
    │   ├── AlertsPage.tsx                     # Personalized screening alerts & overdue reminders
    │   ├── DailySymptomHistoryPage.tsx        # Symptom timeline tracker & daily log history
    │   ├── CancerAwarenessPage.tsx            # Cancer awareness & health guidelines hub
    │   ├── AIAssistantPage.tsx                # Standalone Groq/Gemini chat (separate from pipeline)
    │   │
    │   ├── App.tsx               # Root router — 22 named hash routes, auth guards, PWA prompt
    │   └── main.tsx
    ├── index.html
    ├── public/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

---

## Tech Stack

**Backend** — FastAPI · XGBoost · SHAP (TreeExplainer) · SMOTENC (imbalanced-learn) ·
sentence-transformers (`all-MiniLM-L6-v2`) · FAISS · OpenRouter (OpenAI-compatible client)

**Frontend** — React 18 · TypeScript · Vite · `vite-plugin-pwa` (offline/installable) ·
Firebase (Auth + Firestore + Storage) · i18next (English/Hindi) · `html2pdf.js` ·
`localforage`

---

## Frontend Overview

The frontend is a fully hash-routed single-page application (no React Router dependency)
with 22 named routes managed in `App.tsx`. The assessment flow is split into distinct
section pages, with gender-adaptive branching: female users get the `WomenOnlySectionPage`
step; male users skip it and flow directly from `MedicalHistorySectionPage` to
`ScreeningHistorySectionPage`.

### Assessment Flow (in order)

| Step | Hash Route | Page |
|:---:|---|---|
| — | `#health-profile` | `RiskAssessmentIntroPage` — overview & section guide |
| 1 | `#assessment-step1` | `BasicInfoSectionPage` — age, sex, height/weight, location |
| 2 | `#assessment-step2` | `LifestyleSectionPage` — smoking, alcohol, diet, exercise, occupation |
| 3 | `#assessment-step3` | `MedicalHistorySectionPage` — family history, conditions, medications |
| 4 | `#assessment-step4` | `WomenOnlySectionPage` — **female only**: reproductive & hormonal history |
| 5 | `#assessment-step-screening` | `ScreeningHistorySectionPage` — prior screening dates |
| 6 | `#assessment-symptoms` | `SymptomsSectionPage` — current symptoms, duration, severity |
| — | `#health-profile-review` | `ReviewAnswersPage` — full answer review before submit |
| — | `#assessment-analyzing` | `SubmitAnalyzePage` — animated 4-stage UI + `POST /api/v1/assessment` |
| — | `#assessment-results` | `ResultsPage` — semi-circular risk gauge per cancer type |
| — | `#assessment-report` | `DetailedReportPage` — Layer 1 + 2 + 3 full breakdown |
| — | `#assessment-explanation` | `ExplanationRecommendationsPage` — why + next steps |

### Other Application Screens

| Hash Route | Page | Purpose |
|---|---|---|
| `#dashboard` | `DashboardPage` | Main hub — risk summary, alerts, quick actions |
| `#profile` | `ProfilePage` | User profile & historical assessments |
| `#reports` | `ReportsDashboardPage` | Saved assessment reports (Firestore-backed) |
| `#alerts` | `AlertsPage` | Personalized overdue screening reminders |
| `#symptoms` | `DailySymptomHistoryPage` | Daily symptom log & timeline tracker |
| `#cancer-awareness` | `CancerAwarenessPage` | Cancer awareness content & guidelines |
| `#settings` | `SettingsPage` | Language, theme, notification preferences |
| `#ai-assistant` | `AIAssistantPage` | Standalone Groq/Gemini chat (not pipeline-grounded) |

### Key Frontend Design Decisions

- **Hash-based routing** — No React Router. All 22 routes are mapped via
  `window.location.hash` in `App.tsx`; back/forward navigation works via a
  `hashchange` listener.
- **AssessmentContext** — Global context holds the entire multi-step assessment state in
  memory and persists it to Firestore per authenticated user. `getBackendPayload()`
  serializes the full state into the exact shape `POST /api/v1/assessment` expects.
- **API config centralized** — `src/config/api.ts` exports `API_BASE_URL`
  (reads `VITE_API_BASE_URL`, falls back to `http://127.0.0.1:8000`). Previously the
  API URL was hardcoded inline in `SubmitAnalyzePage.tsx`.
- **Screening guidelines centralized** — `src/config/screeningGuidelines.ts` is the
  single source of truth for `CANCER_SCREENING_CONFIG`, alert generation logic, and the
  `CLINICAL_DISCLAIMER` string used across `AlertsPage`, `ResultsPage`,
  `ExplanationRecommendationsPage`, and `SubmitAnalyzePage`.
- **PWA support** — `vite-plugin-pwa` provides offline capability. An in-app install
  banner is managed directly in `App.tsx` using the `beforeinstallprompt` event.
- **i18n** — English and Hindi locale files in `src/i18n/locales/`. All user-facing
  strings go through `useTranslation()`.

---

## Getting Started

### Prerequisites

- Python 3.10+ (Dockerfile targets 3.14-slim; anything 3.10+ works locally)
- Node.js 18+
- An [OpenRouter](https://openrouter.ai/keys) API key if you want **live** LLM output
  (optional — see below)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../env.example .env           # env.example lives at the repo root
uvicorn main:app --reload
```

The API comes up at `http://127.0.0.1:8000`, with interactive Swagger docs at
`http://127.0.0.1:8000/docs`.

> **Note:** `requirements.txt` is a full `pip freeze`, so it includes notebook/dev
> dependencies (`jupyter`, `ipykernel`, `torch` via `sentence-transformers`) on top of
> what `main.py` needs at runtime. Expect the install to take a few minutes on a clean
> machine — worth doing once, well before the demo, not live on stage.

**Backend environment variables** (copy from root `env.example` → `backend/.env`):

| Variable | Required? | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Only if `USE_LIVE_LLM=true` | Auth for Layer 3's LLM calls |
| `USE_LIVE_LLM` | No (defaults `false`) | `false` = Layer 3 uses safe hardcoded fallback guidance text, no network call, no key needed. `true` = live LLM generation via OpenRouter. Flip this on deliberately for a demo, not by default, to avoid burning free-tier quota during dev. |

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> **Note:** There is no `.env.example` in the `frontend/` directory. Create a `.env.local`
> file manually and add the variables you need from the table below.

Runs at `http://localhost:3000` (set in `vite.config.ts` — not Vite's usual 5173; the
backend's CORS `allow_origins` list in `main.py` is already configured for both, so
either works).

**Frontend environment variables** (create `frontend/.env.local` manually):

| Variable | Required? | Used by | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | Recommended | `src/config/api.ts` → `SubmitAnalyzePage.tsx` | Backend URL. Defaults to `http://127.0.0.1:8000` if unset — fine for local dev, **must** be set once the backend is deployed anywhere else. |
| `VITE_GEMINI_API_KEY` / `VITE_GEMINI_API_KEY_1` | Optional | `AIAssistantPage.tsx` | Powers the standalone AI Assistant chat via Gemini. Independent of the backend's Layer 3. |
| `VITE_GEMINI_API_KEY_2` / `VITE_GEMINI_API_KEY_3` | Optional | `AIAssistantPage.tsx` | Despite the shared "GEMINI" naming, these are checked against a `gsk_` prefix and sent to Groq's API as fallback keys — naming is misleading, worth a rename. |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Unused** | — | Listed in `.env.example`, but the app authenticates via Firebase (`src/config/firebase.ts`), not Clerk. Safe to leave blank or delete. |

Firebase itself needs **no** environment variable — its config object is currently
hardcoded directly in `src/config/firebase.ts`.

---

## API Reference

### `POST /api/v1/assessment`

Accepts one shared patient profile (age, gender, plus whichever lifestyle/symptom
fields are relevant — see `PatientInput` in `main.py` for the full field list) and
returns a risk report for **all four** cancer types in one response, keyed by cancer
type. Cancer types that don't apply to the patient (e.g. cervical for a male patient)
are returned with `overall_tier: "not_applicable"` instead of being omitted.

<details>
<summary>Example response shape (abridged, one cancer type)</summary>

```json
{
  "lung": {
    "overall_tier": "high",
    "layer1": {
      "score": 75,
      "tier": "high",
      "triggered_factors": ["persistent_cough_gt_3_weeks", "current_smoker", "age_50_60"],
      "applicable": true
    },
    "layer2": {
      "probability": 0.72,
      "tier": "high",
      "top_factors": ["current_smoker", "age", "coughing_blood_severity"],
      "protective_factors": ["no_family_history"],
      "model_available": true
    },
    "layer3": {
      "guidance_text": "...",
      "recommended_actions": ["Schedule a chest X-ray within 7-14 days", "..."],
      "retrieved_sources": ["Persistent cough duration threshold", "..."],
      "timeline_urgency": "Immediate"
    }
  },
  "cervical": {
    "overall_tier": "not_applicable",
    "layer1": { "score": 0, "tier": "low", "triggered_factors": [], "applicable": false },
    "layer2": null,
    "layer3": null
  }
}
```

</details>

---

## Cancer Type Coverage

| Cancer type | Layer 1 (rule engine) | Layer 2 (ML model) | Status |
|---|:---:|:---:|---|
| Lung | ✅ | ✅ trained (`lung_xgb_model.json`) | Demo-ready |
| Breast | ✅ | ✅ trained (`breast_xgb_model.json`) | Demo-ready |
| Cervical | ✅ | ✅ trained (`cervical_xgb_model.json`) | Demo-ready |
| Oral | ✅ | ⏳ placeholder (`model_available=False`) | Rule-engine + Layer 3 only |

Oral cancer isn't broken — it's a deliberate, documented placeholder. `ml_layer.py`'s
`_MODEL_REGISTRY` has a commented-out line ready to uncomment the moment a suitable
training dataset and notebook exist for it; until then, `predict_ml_risk()` returns a
graceful `model_available=False` result instead of crashing, and Layer 1 + Layer 3 keep
working normally for oral cancer in the meantime.

---

## Current Scope & Known Limitations

Stated plainly, for the team and for judges:

- **Stateless by design (for now).** There's no database — each `/api/v1/assessment`
  call is independent. Nothing about a patient's history, no longitudinal tracking,
  no persistence between visits.
- **No backend authentication.** The single API endpoint is unauthenticated. Frontend
  auth (Firebase) is a separate concern and doesn't currently gate the API.
- **Two independent LLM paths exist.** Layer 3 (backend, OpenRouter, FAISS-grounded)
  powers the risk report. The Frontend's `AIAssistantPage.tsx` chat is a **separate**
  integration calling Groq/Gemini directly from the browser, ungrounded by the ICMR
  protocol base. If asked "is all AI guidance grounded?", the accurate answer is: the
  risk assessment is; the free-form assistant chat isn't (yet).
- **Client-exposed API keys.** Any `VITE_`-prefixed variable — including the Groq/Gemini
  keys above — gets bundled into the shipped JS and is visible to anyone inspecting the
  site, by design in Vite (this isn't a bug in your code, it's how `VITE_*` env vars
  always work). Fine for a hackathon demo key with a free tier; don't reuse a
  higher-privilege key here later without a backend proxy in front of it.
- **`USE_LIVE_LLM` defaults to `false`.** Without it, Layer 3 returns solid but static
  fallback guidance text rather than a live LLM generation — intentional, so a dead
  API key or exhausted quota never breaks the demo.

---

## Roadmap

- Oral cancer ML model (dataset search ongoing)
- Chat endpoint on the backend, so the Frontend's AI Assistant can eventually run
  through the same RAG-grounded pipeline as the risk report
- Persistent storage + longitudinal symptom tracking
- Regional language support beyond English/Hindi

---

## Clinical Grounding

Layer 1's weighting and Layer 3's `protocol_chunks.py` knowledge base are derived from
ICMR (Indian Council of Medical Research) and WHO cancer screening guidance. Training
data: a Cancer Patients & Air Pollution dataset (lung), the BCSC Risk Estimation Dataset
(breast), and the UCI Cervical Cancer Risk Factors dataset (cervical).

---

*Built for a 48-hour hackathon (September 3–5, 2026). Every risk score, tier, and piece
of guidance in this system is advisory and must be reviewed by a qualified healthcare
professional before any clinical decision is made.*
