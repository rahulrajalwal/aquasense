# AquaSense AI — Smart Borewell Site Recommendation System

A decision-support web platform that recommends **where to drill a borewell in Pune district, how deep, and with what chance of success** — built on near-surface geophysics and **real published Central Ground Water Board data**.

**Developed by [Rahul Meena](https://github.com/rahulrajalwal).**

**🌐 Live app: [aquasense-self.vercel.app](https://aquasense-self.vercel.app)** — deployed on Vercel, auto-redeploys on every push to `main`.

## What it runs on (real data)

| Source | What we use |
|---|---|
| **CGWB NAQUIM** "Aquifer Mapping and Management of Ground Water Resources, Pune District" | Annexure-I: **146 exploration/observation wells** (coordinates, depths, water levels, aquifer geometry, pump-test yields) — the training dataset and map layer. Table 5.1 aquifer characteristics; Table 8.1 taluka resources (2013). |
| **CGWB (2013)** "Ground Water Information, Pune District" (1810/DBR/2009) | Taluka rainfall normals 2003–2012, exploration ranges, formation-wise dugwell yields, yield-potential classes, drought-prone areas. |
| **GSDA/CGWB (2023)** "Dynamic Groundwater Resources of Maharashtra 2023" (2576/GWR/2024) | Newest verified district status: Pune development 50–70% band, 8 talukas Over-Exploited/Critical/Semi-Critical. Taluka-wise 2023 figures live on [INGRES](https://ingres.iith.ac.in). |
| OpenStreetMap / CARTO | Live basemap tiles. |

These are the **latest publicly available official surveys** for Pune district (verified 2026-07-07); every dataset's survey year, publication date and licence are displayed on the Data Sources page. When online, the app checks a published data manifest and notifies users if a newer dataset version is available, falling back gracefully to the bundled official data offline. The UI is fully responsive (desktop → tablet → phone).

Extraction from the published PDFs was script-parsed and verified row by row (12 rows hand-corrected against the printed tables; source anomalies are flagged in the dataset, not silently fixed — see `src/lib/data/real/wells.ts`).

## The user flow

1. **Location** — taluka + village/plot (or click the exact spot on the wells map).
2. **What you know** — water level in nearby wells, typical bore depths, neighbours' outcomes. All optional; gaps are filled from CGWB records.
3. **Data match** — the platform shows the nearest documented CGWB wells (distance, depth, yield, outcome) and the taluka's tested success rate, then **asks for a VES resistivity sounding** when it would sharpen the answer (uncertain band / sparse coverage). Readings are inverted with a real 1-D Schlumberger engine.
4. **Assessment** — blended probability (**ML model 55% + transparent rules 45%**), water-strike and drilling-depth windows derived from local CGWB logs, yield class, confidence, factor-by-factor explanation, and a cited PDF report.

## The two engines

**Rule engine** — six written-out factors over the CGWB evidence: local well record (30%), aquifer geometry from CGWB logs (25%), water-table depth (15%), rainfall recharge (10%), resource stress / semi-critical status (10%), VES sounding (10%).

**ML model** — logistic regression trained on the **101 pump-tested CGWB wells** (success = yield ≥ 1 lps; 66/35 class split). Validation on 25 held-out wells: **accuracy 80%, ROC AUC 0.92, F1 0.88**. Features are pre-drilling knowables only (taluka layers, water level, aquifer geometry) — no leakage. Learned weights are hydrogeologically sensible: Aquifer-II fracture-zone thickness is the strongest positive, deep pre-monsoon water level the strongest negative. Retrain reproducibly with:

```bash
npx tsc scripts/train-real.ts --outDir <tmp> --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck
node <tmp>/scripts/train-real.js > src/lib/ml/pretrainedReal.ts
```

**VES module (real physics)** — 1-D Schlumberger forward modelling via the Stefanescu recursion with a 201-point Werthmüller–Key–Slob Hankel filter, multi-seed coordinate-descent inversion (`src/lib/physics/`; smoke test in `scripts/ves-smoke.ts`).

## Pages

| Route | What it does |
|---|---|
| `/` | Problem, science, workflow, CTA |
| `/analyze` | The 4-step guided assessment wizard |
| `/map` | All 146 CGWB wells on dark tiles, colored by outcome; click anywhere → "Analyze this exact spot" |
| `/dashboard` | Taluka intelligence: rainfall & development-stage comparisons, depth-vs-yield scatter, full well tables |
| `/ml-lab` | Model transparency: dataset, metrics, learned weights, calibration, in-browser reproducible training, CSV extension |
| `/study-area` | 14 talukas with real CGWB figures; the NAQUIM two-aquifer system; VES interpretation guide |
| `/data-sources` | Dataset registry with citations, vintage, licences |
| `/report` | Cited multi-page PDF of the current assessment (jsPDF, client-side) |
| `/about` | Approach, scientific basis, responsible use |

## Running

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Structure

```
src/
  app/                    pages (App Router)
  components/             wizard steps, charts (ECharts), Leaflet map, VES panel, UI kit
  lib/
    data/real/            wells.ts (146 CGWB wells) · talukas.ts · hydro.ts (aquifers, citations)
    engine/assessReal.ts  evidence gathering + rules + ML blend + explanations
    ml/                   logreg.ts · realFeatures.ts · pretrainedReal.ts (shipped model) · realCsv.ts
    physics/              VES forward model + inversion
    report.ts             cited PDF generator
scripts/                  train-real.ts (model build) · ves-smoke.ts (physics test)
```

## Responsible use

Assessments are decision support from published data (resources 2013, water levels 2017) — **not** a substitute for an on-site geophysical survey or a licensed hydrogeologist. Baramati and Purandhar talukas are semi-critical: pair any new bore there with recharge measures and check groundwater-authority requirements.
