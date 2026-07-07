# AquaSense AI — User Manual

**Check your borewell site before you spend a rupee on drilling.**

AquaSense AI estimates the chance of striking usable groundwater at your site in **Pune district**, tells you **how deep** to drill and **what yield** to expect, and explains every number — using real Central Ground Water Board (CGWB) data from 146 documented exploration wells.

> ⚠ AquaSense is decision support. It does **not** replace an on-site geophysical survey or a licensed
> hydrogeologist. Always confirm before drilling.

---

## 1. Getting started

Open the app (locally: `npm run dev` → http://localhost:3000). The top navigation has eight pages:

| Page | Use it to… |
|---|---|
| **Home** | Understand the problem and how the platform works |
| **Study Area** | See all 14 talukas with their real rainfall, groundwater stress and well counts |
| **Map** | Browse the 146 CGWB wells and pick your exact spot |
| **Analyze** | Run the guided site assessment (the core workflow) |
| **Dashboard** | Compare talukas and inspect every documented well |
| **ML Lab** | Look inside the prediction model (and retrain it yourself) |
| **Data Sources** | Read exactly which datasets power the tool, with citations |
| **Report** | Download your assessment as a PDF |

---

## 2. Running a site assessment (Analyze)

The assessment is a 4-step wizard. You can finish it in under a minute with just a taluka name — every extra detail you add sharpens the answer.

### Step 1 — Location
- **Taluka** (required): pick from the 14 Pune-district talukas.
- **Village / plot name**: type freely, or pick one of the documented CGWB villages suggested as you type.
- **Latitude / longitude** (optional but powerful): with coordinates, the platform matches your site against the *nearest individual wells* instead of taluka averages.
  💡 Easiest way: open the **Map**, click your plot, then click **“Analyze this exact spot”** — the coordinates are filled for you.

### Step 2 — What you know (all optional)
- **Depth to water in nearby wells (m)** — the summer (pre-monsoon) level is most useful.
- **Typical bore depth nearby (m)**.
- **How are the bores around you doing?** — Most work / Mixed / Many failed / Don't know.

Anything you skip is filled from CGWB records for your taluka.

### Step 3 — Data match (and the resistivity question)
The platform now shows what it found:
- A **coverage badge** (good / moderate / sparse) — how well the CGWB record covers your spot.
- The **nearest CGWB wells** with their real drilled depths, water levels and pump-test yields.
- Your taluka's **success rate** among pump-tested wells.

Then it asks one more question: **do you have a VES resistivity sounding?**

- **If yes** — enter your Schlumberger readings (AB/2 spacing vs apparent resistivity ρa, at least 5 rows) and press **Invert sounding**. The engine fits a layered model, draws the curve, and highlights the interpreted aquifer. That layer feeds directly into your result.
- **If not sure what this is** — press *“No survey yet? Load an example sounding”* to see how it works (the example is clearly labelled as a demonstration).
- **If no** — just press **Analyze without VES**. The VES factor stays neutral and the tool tells you commissioning one is the single biggest upgrade to the assessment.

### Step 4 — Assessment
Your result, top to bottom:

- **Verdict banner** — ✓ Favourable (≥65%), ◐ Marginal (45–64%), ✗ Unfavourable (<45%), with a plain-language recommendation.
- **Groundwater probability gauge** — the headline number, with the two engines shown separately (ML model and rule engine). When they agree, trust it more; the confidence score already accounts for this.
- **Confidence gauge** — driven by data coverage, how much you provided, and engine agreement.
- **Key cards** — expected water strike depth, recommended drilling window, expected yield class (with litres/hour), and your taluka's groundwater-development status.
- **Factor breakdown** — every rule-engine factor with its weight, score and the evidence behind it.
- **ML panel** — why the model said its number: signed per-feature contributions (green raises, red lowers).
- **Explanation panel** — click each question ("Why this depth?", "What do nearby CGWB wells show?"…) for a full answer citing the actual wells.
- **Before you drill** — the concrete action list (VES at the plot, authority checks, recharge measures).

Press **“↻ Assess another site”** to start over — or continue to the Report or Dashboard, which follow your assessment automatically.

---

## 3. Reading the Map

- **Green markers** — CGWB wells that pump-tested at ≥1 litre/second (success).
- **Red markers** — tested poor or dry.
- **Grey markers** — drilled but never pump-tested.
- Bigger circles are exploratory wells (EW); smaller are observation wells (OW).
- **Click any well** for its full record: drilled depth, water levels, yield, aquifer depths — plus an *“Analyze near this well”* shortcut.
- **Click anywhere on the map** to drop a pin and assess that exact spot.
- The search box filters by village or taluka name.

---

## 4. Dashboard

Pick a taluka to see: its rainfall vs all others, groundwater-development stage (the amber bars near 90–95% are the stressed ones), a depth-vs-yield scatter of its CGWB wells, your current site's factor breakdown, and the complete well table. District context (total resources, semi-critical talukas) sits alongside.

---

## 5. ML Lab (for the curious and the sceptical)

This page exists so you never have to take the model on faith:
- **Production model card** — what it was trained on and its validation scores (accuracy 80%, AUC 0.92 on held-out wells).
- **The actual dataset** — every pump-tested well, plus the depth-vs-yield scatter that shows why prediction is genuinely hard.
- **Learned weights** — what pushes predictions up (aquifer-zone thickness) and down (deep water table).
- **Reproduce production training** — retrains in your browser in under a second and matches the shipped model exactly.
- **Add well records (CSV)** — extend the dataset with your own drilled-well outcomes (template provided) and see how the metrics move. Session experiments never change the production model.

---

## 6. The PDF report

On the **Report** page press **Download PDF report**. The document contains your inputs, full source citations, the nearest-well evidence table, the aquifer setting, results with the probability bar, factor and ML-contribution tables, the complete interpretation Q&A, the action list, and the disclaimer. Give it to your drilling contractor or hydrogeologist — everything they need to verify the reasoning is in it.

If you haven't run an assessment yet, the report falls back to taluka-level defaults and says so.

---

## 7. FAQ

**How accurate is this?**
The ML model scores 80% accuracy / 0.92 AUC on held-out CGWB wells, and the rule engine is built from the same official record. But the training set is 101 wells and the data vintage is 2013–2018 — treat the output as a strong prior, not a guarantee. That's why the confidence score and the VES recommendation exist.

**Why does it keep asking about VES / resistivity?**
A Vertical Electrical Sounding is the one measurement made at *your exact plot*. Saturated weathered basalt shows a distinct 20–45 Ω·m signature; finding (or not finding) it moves the assessment more than any other single input. A sounding typically costs a small fraction of a failed borewell.

**My taluka says “Semi-Critical”. Can I still drill?**
Baramati and Purandhar were assessed at ~95% groundwater development — CGWB recommends recharge measures before further development, and approvals may be required. The tool flags this in your verdict and action list; check with GSDA/CGWA.

**Can it assess places outside Pune district?**
Not yet. The dataset, taluka layers and trained model are Pune-specific. The architecture accepts new districts as a data task (see the ML Lab CSV schema and Data Sources page).

**Where do the numbers come from?**
Two published CGWB studies — the 2013 district report and the NAQUIM aquifer-mapping report. Full citations are on the **Data Sources** page and inside every PDF report.

**Does my data leave my computer?**
No. Everything — including model training in the ML Lab — runs in your browser. Only map tiles are fetched from the internet.

---

## 8. Responsible use

Groundwater is a shared, stressed resource. Whatever the verdict: commission a VES/ERT survey before drilling, register your bore, comply with groundwater-authority rules, and build a recharge pit alongside — it pays back in dry years.
