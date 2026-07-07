# AquaSense AI — Technical Documentation

**AI-Powered Smart Borewell Site Recommendation System · Pune District, Maharashtra**
Course project, EH 611 — Near Surface Geophysics

---

## 1. System overview

AquaSense AI is a client-side decision-support web application that estimates the probability of a successful borewell at a user-specified site in Pune district, recommends a drilling-depth window and expected yield class, and explains every output. It combines three evidence engines over a single real dataset:

```
                          ┌──────────────────────────────┐
                          │   REAL DATA LAYER (CGWB)      │
                          │  146 exploration wells        │
                          │  14 taluka layers             │
                          │  2-aquifer characteristics    │
                          └──────┬───────────┬───────────┘
                                 │           │
        user inputs              ▼           ▼
  ┌───────────────┐      ┌────────────┐  ┌──────────────┐     ┌──────────────┐
  │ location      │      │ EVIDENCE    │  │ ML MODEL      │     │ VES PHYSICS   │
  │ water level   ├─────▶│ GATHERER    │─▶│ logistic      │     │ 1-D forward + │
  │ bore depths   │      │ nearest     │  │ regression    │     │ inversion     │◀── user's
  │ outcomes      │      │ wells,      │  │ (101 wells)   │     │ (Schlumberger)│    ρa readings
  │ (VES readings)│      │ medians     │  └──────┬───────┘     └──────┬───────┘
  └───────────────┘      └─────┬──────┘          │                    │
                               ▼                 ▼                    ▼
                        ┌─────────────────────────────────────────────────┐
                        │ ASSESSMENT  = 0.55 × ML + 0.45 × rule engine     │
                        │ probability · depth window · yield · confidence  │
                        │ factor breakdown · ML contributions · Q&A        │
                        └─────────────────────────────────────────────────┘
```

Everything runs in the browser (Next.js static prerender + client components); there is no backend. The trained model ships with the app as generated TypeScript.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Leaflet (react-leaflet) · Apache ECharts · Framer Motion · jsPDF.

---

## 2. Data layer (`src/lib/data/real/`)

### 2.1 Sources & provenance

| File | Contents | Source |
|---|---|---|
| `wells.ts` | 146 `CgwbWell` records: taluka, village, EW/OW type, lon/lat, drilled depth, casing, pre/post-monsoon SWL, pump-test discharge, Aquifer-I bottom, Aquifer-II depth & thickness, zone text | CGWB **NAQUIM** "Aquifer Mapping and Management of Ground Water Resources, Pune District", Annexure-I |
| `talukas.ts` | 14 `TalukaInfo` records: decadal rainfall (2003–12), stage of GW development % + category (2013), yield-potential class, drought-prone flag, exploration SWL/discharge ranges, HQ map anchors | CGWB (2013) Tables 2/3/8 + NAQUIM Table 8.1 |
| `hydro.ts` | Aquifer-I/II characteristics (depth, SWL, yield, transmissivity, storativity), dugwell yields by formation/elevation, district overview, full citations | NAQUIM Table 5.1, CGWB (2013) Table-4 |

### 2.2 Extraction pipeline

The published PDFs were text-extracted (pdfplumber), then Annexure-I was parsed with a structural parser that (a) treats the **first physical line** of each record as the authoritative numeric tail (continuation lines are zone-text wraps), (b) splits merged coordinate tokens (`73.78354 18.19463` printed as one token), and (c) validates each row against physical ranges (depths ≤ 202 m, AQ-I 5–31 m, thickness 0.4–12.5 m, …). Twelve rows that failed validation were hand-corrected against the printed table; the patches are recorded in the extraction script.

**Source anomalies are flagged, never silently fixed:**
- 3 wells have no printed coordinates; 3 more have coordinates inconsistent with their stated taluka (e.g. a Purandhar well printed at latitude 19.12°). All six keep their hydrogeological data (used in training) but are omitted from the map, each with a `note`.
- The discharge column header prints m³/hr in NAQUIM but the identical values appear as **lps** in the 2013 district report (e.g. Lavale 30.6). Values are treated as lps and, for modelling, as a relative yield index; the ambiguity is documented in `wells.ts`.
- One well (Khireshwar, Akole taluka) lies across the Ahmadnagar border; it is retained as a border-area data point and grouped with adjacent Ambegaon.

### 2.3 Outcome definition

`wellOutcome(w) = 1` if pump-test discharge ≥ **1.0 lps** (`SUCCESS_YIELD_LPS`), `0` if below (including "Traces"/"meager" ≈ 0.05, "<0.14" ≈ 0.1), `null` if never pump-tested. Result: **101 labelled wells — 66 success / 35 poor-dry**; 45 unlabelled wells still contribute geometry (water levels, aquifer depths) to local medians.

---

## 3. Evidence gathering (`src/lib/engine/assessReal.ts` — `gatherEvidence`)

For a `SiteInput` (taluka + optional coordinates + optional user knowledge):

1. **Nearest wells** — if coordinates given, the 5 nearest located wells (equirectangular distance; adequate at district scale).
2. **Local medians** — pre-monsoon SWL, Aquifer-I bottom, Aquifer-II depth & thickness, computed from (in priority order): wells within 15 km (needs ≥ 2) → taluka wells → all wells; district fallbacks are hard-coded medians.
3. **Taluka record** — pump-tested count and success rate.
4. **Coverage grade** — `good` (nearest well ≤ 10 km AND ≥ 5 tested wells in taluka), `moderate` (≥ 3 tested), else `sparse`. Coverage feeds confidence and the VES prompt.

---

## 4. Rule engine (transparent factors)

Weighted 0–100 scores; the weighted sum is the rule probability (clamped 5–95):

| Factor | Weight | Evidence |
|---|---|---|
| CGWB & local well record | 30% | Taluka success rate blended (55/45) with the 3 nearest tested wells; adjusted by the user's reported neighbourhood outcomes |
| Aquifer geometry | 25% | Median Aquifer-II zone thickness from CGWB logs (≥6 m → 88, ≥3 m → 70, ≥1.5 m → 52, else 30) |
| Water-table depth | 15% | User value if given, else local median; `100 − (SWL−4)×3.2` |
| Rainfall recharge | 10% | Taluka normal; deliberately non-monotonic (very high ghat rainfall scores lower — thin hill aquifers shed it as runoff, which the CGWB record confirms) |
| GW development stress | 10% | Stage %: ≥95 → 22, ≥85 → 42, ≥60 → 62, else 85; semi-critical talukas trigger explicit cautions |
| VES sounding | 10% | If provided: resistivity window scoring (20–45 Ω·m saturated weathered basalt → ~80; 12–80 Ω·m → ~58; outside → 30; ± thickness adjustment). If absent: neutral 50 + prompt |

**Drilling guidance** is derived from local CGWB logs, not the score: water strike ≈ [min(0.8 × SWL, 0.6 × AQ-I), AQ-I median]; recommended depth from the median Aquifer-II depth of *successful* local wells, extended by 2 × zone thickness + 10 m, rounded to 5 m, capped at 200 m, and forced ≥ strike + 10 m. Yield class comes from the local successful-well yield distribution.

**Confidence** (25–90%): base 52 + coverage bonus (+15/+8) + tested-well count (+5) + VES provided (+9) + ML/rules agreement within 15 pts (+6, else −4) + user water table (+3).

---

## 5. ML model (`src/lib/ml/`)

### 5.1 Features (`realFeatures.ts`) — pre-drilling knowables only

1. log(taluka rainfall) · 2. stage of development % · 3. yield-potential ordinal (0–3) · 4. drought-prone flag · 5. pre-monsoon SWL (m) · 6. Aquifer-I bottom (m) · 7. Aquifer-II depth (m) · 8. Aquifer-II thickness (m) · 9. seasonal WL recovery (pre − post; imputed 0.45 × pre when post missing).

The same `featurizeReal()` runs at training and prediction time; no pump-test information enters the features.

### 5.2 Algorithm (`logreg.ts`)

Dependency-free logistic regression: z-score standardization (train-split statistics), full-batch gradient descent (800 epochs, lr 0.35 with 1/(1+ep/300) decay, L2 = 0.03), 75/25 split with seeded shuffle (mulberry32, seed 11) → **fully reproducible**: retraining regenerates byte-identical weights (verified in `scripts/verify-data.ts`).

Metrics: accuracy, rank-based ROC AUC with tie handling, precision/recall/F1, confusion matrix, 5-bin calibration. Explanations: exact logit decomposition — `logit = bias + Σ wᵢ·zᵢ` — surfaced per-feature in the UI and PDF (verified exact to 1e-9).

### 5.3 Model card (shipped `pretrainedReal.ts`)

| Property | Value |
|---|---|
| Training data | 101 pump-tested CGWB wells (76 train / 25 validation) |
| Class balance | 65% success / 35% poor-dry |
| Validation | **accuracy 80%, ROC AUC 0.921, precision 78%, recall 100%, F1 0.88** |
| Confusion (val, θ=0.5) | TP 18 · FP 5 · TN 2 · FN 0 |
| Strongest weights | Aquifer-II thickness **+1.13** · pre-monsoon SWL **−0.81** · WL recovery −0.22 |
| Known bias | Over-predicts success at θ=0.5 on the small validation split (FP=5, TN=2); the app therefore reports calibrated probability, never a binary verdict, and blends with the rule engine |

Regenerate after changing features/hyper-parameters:

```bash
npx tsc scripts/train-real.ts --outDir <tmp> --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck
node <tmp>/scripts/train-real.js > src/lib/ml/pretrainedReal.ts
```

`realCsv.ts` lets users extend the training set in the ML Lab (schema documented in-app); session models never replace the shipped model.

### 5.4 Blend

`probability = clamp(0.55 × ML + 0.45 × rules, 5, 95)`. The ML weight is slightly higher because it is calibrated on outcomes; the rule engine contributes evidence the model cannot see (nearest-well specifics, user-reported outcomes, VES).

---

## 6. VES physics (`src/lib/physics/`)

- **Forward model** (`ves.ts`): 1-D Schlumberger apparent resistivity via the Stefanescu recursion for the layered-earth kernel T(λ), evaluated with the 201-point Werthmüller–Key–Slob (2018) Hankel filter. Validated against exact image-series solutions (rel. error ~1e-12) in the companion geosim project.
- **Inversion** (`invert.ts`): multi-seed coordinate descent in log-parameter space minimizing RMS log-residual, with AIC-style layer-count penalty; seeds include a Deccan-basalt archetype column and the classic H/A/K/Q families. Runs synchronously in ~100–300 ms.
- **Interpretation** (`engine/recommend.ts` + `VesPanel`): the fitted layer whose resistivity falls in the site's aquifer window is flagged; its (ρ, thickness, top depth) feed the assessment's VES factor. Smoke test: `scripts/ves-smoke.ts`.

---

## 7. Application structure

```
src/
  app/
    page.tsx            Home
    analyze/page.tsx    4-step wizard (Location → What you know → Data match → Assessment)
    map/page.tsx        CGWB wells map (Leaflet, ssr:false)
    dashboard/page.tsx  taluka intelligence
    ml-lab/page.tsx     model transparency + reproducible training + CSV extension
    study-area/…        14 talukas, aquifer system, VES guide
    data-sources/…      dataset registry + citations
    report/page.tsx     PDF generation entry
    about/page.tsx
  components/
    AppState.tsx        last SiteInput persisted to localStorage (aquasense.site.v3)
    VesPanel.tsx        readings table + inversion + aquifer callback
    MapView.tsx         Leaflet layer (wells colored by outcome, click-to-assess)
    Chart.tsx           minimal ECharts wrapper (init/setOption/ResizeObserver)
    chartDefs.ts        all chart option builders
    ui.tsx              Reveal/StatCard/Badge/PageHeader…
  lib/
    data/real/          wells.ts · talukas.ts · hydro.ts
    data/datasets.ts    registry for the Data Sources page
    data/sites.ts       geological archetype columns (VES seeding/interpretation)
    engine/assessReal.ts  evidence + rules + blend + explanations
    engine/{matcher,recommend}.ts  VES-side assessment (archetype-based)
    ml/                 logreg.ts · realFeatures.ts · pretrainedReal.ts (generated) · realCsv.ts
    physics/            ves.ts · invert.ts · data/hankel.ts (filter coefficients)
    report.ts           jsPDF report builder
scripts/
  train-real.ts         builds the shipped model (deterministic)
  verify-data.ts        30-check verification suite (dataset, model, 28 assessments)
  ves-smoke.ts          physics pipeline test
```

**State flow:** the wizard writes the completed `SiteInput` to `AppState` (localStorage); Dashboard and Report re-run `assessSite(input)` from it (assessment is deterministic, so nothing else needs persisting).

---

## 8. Build, run, test

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build (all routes prerendered)
```

Tests (compile-and-run pattern, no test framework dependency):

```bash
npx tsc scripts/verify-data.ts --outDir %TMP%\vfy --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck && node %TMP%\vfy\scripts\verify-data.js
```

`verify-data.ts` asserts: dataset counts (146/101/66), physical ranges, 8 spot-checks against the printed source, taluka layer integrity, model shape/AUC/reproducibility/decomposition-exactness, and structural validity of 28 assessments (14 talukas × ±VES).

**Windows note:** a running dev server locks `.next`; if a production build hits `EPERM …\.next\trace`, stop the dev server (kill the port-3000 process), delete `.next`, and build in the same command chain.

---

## 9. Known limitations & engineering caveats

1. **Data vintage** — resources assessed 2013, water levels 2017, exploration to 2018. Levels have likely evolved; the UI and PDF state this everywhere.
2. **Sample size** — 101 labelled wells is small; validation metrics carry wide confidence intervals, and per-taluka calibration is coarse where few wells exist (e.g. Velhe: 6 wells). Coverage grading and confidence capping reflect this.
3. **Success threshold** — 1 lps is a domestic/irrigation-boundary convention; a different threshold would shift the class balance (sensitivity unexplored).
4. **Spatial granularity** — taluka layers + nearest-well medians; no continuous interpolation (kriging) or lineament/geomorphology layers yet.
5. **VES demo readings** — the "example sounding" is synthetic (archetype forward model + noise) and labelled as such; real readings are the intended input.
6. **Discharge unit ambiguity** — see §2.2; immaterial for classification, material if absolute yields are quoted.
