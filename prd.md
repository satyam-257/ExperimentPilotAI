# ExperimentPilot: Product Requirements Document (PRD)

**Project Name:** ExperimentPilot  
**Tagline:** Plan. Compare. Understand. Improve.  
**Version:** 1.0.0-MVP  
**Status:** Approved  
**Author:** Antigravity AI & Devpost Learn Protocol  

---

## 1. Product Overview & Goals

ExperimentPilot is a modern, model-agnostic experimentation workspace and model-behavior analysis platform. It empowers machine learning engineers to plan controlled experiments, compare models and aggregation mechanisms side-by-side, inspect individual prediction failures at both scan and slice levels, and generate evidence-grounded hypotheses for iterative improvement.

### Core Goals
1. **Model-Agnostic Experimentation:** Provide a unified interface for recording, importing, and comparing any ML model architecture (e.g., CoAtNet Consensus, ConvNeXt-V2 Pool, DINOv2 ViT, Optimal Slice Pool, or custom ensembles).
2. **Behavioral Visibility:** Move beyond aggregate scalar metrics by providing sample-level and sub-sample (multi-slice volumetric) prediction exploration with agreement/disagreement analysis.
3. **Evidence-Grounded Insights:** Synthesize experimental differences into concrete, testable hypotheses—powered by configurable LLMs or an automated deterministic diagnostic engine when offline.
4. **Professional Scientific UI:** Implement a state-of-the-art dark navy scientific SaaS design matching the provided reference mockup, featuring refined card hierarchies, pill badges, metrics sparklines, and interactive diagnostic alerts.

---

## 2. Visual & Design System Requirements

The user interface strictly adheres to the visual language of the provided reference mockup:
- **Color Palette:**
  - Deep Navy Canvas: `#080d1a` / `#0b1329`
  - Elevated Card Background: `#101c38` / `#132247`
  - Subtle Borders & Separators: `#1e305b` / `#233766`
  - Accents: Electric Violet (`#8b5cf6`), Cyan (`#06b6d4`), Emerald / Mint (`#10b981`), Warning Coral (`#f43f5e`), Amber Warning (`#f59e0b`)
- **Typography:** Modern clean sans-serif (Inter / System font stack) with crisp numerical tabular alignments.
- **Component Styling:**
  - Rounded pill badges for metadata (e.g., commit hash, algorithm, hyperparameters).
  - Compact, legible loss curves and mini sparklines.
  - Interactive confusion matrix cells with floating warning callouts (e.g., *"Warning: The false positive rate is higher than your threshold"*).
  - Clean icon rail on the far left with intuitive active states.
  - Sub-navigation drawer / timeline for "Experiment Flow" and hypothesis tracking.
  - Action pills (e.g., *"Create Hypothesis"* with tag icon).

---

## 3. Detailed Functional Requirements

### Section A: Overview Dashboard
1. **Summary Statistics:**
   - Total recorded experiments count.
   - Best validated experiment badge with primary metric selector (e.g., Accuracy, Macro-F1, AUROC, Loss).
   - Recent activity feed with timestamp, author/branch, and key outcome.
   - Aggregate model performance distribution charts.
2. **Quick Actions:**
   - Primary CTA: "New Experiment" modal.
   - Secondary CTA: "Compare Models" and "Launch Behavior Explorer".
   - Synthetic Demo Quick-Load button (loads CoAtNet Consensus vs ConvNeXt-V2 Pool multi-slice CT benchmark).

### Section B: Experiment Manager
1. **Experiment Creation & Ingestion:**
   - Fields: Name, Task Type (`classification`, `regression`, `multi_slice_classification`), Model Family, Architecture / Variant, Preprocessing Pipeline, Pooling / Aggregation Method, Dataset Identifier, Split Info, Hyperparameters (arbitrary JSON/key-value preserved), Notes, Evaluation Protocol.
   - Ingestion: Manual input form or Structured JSON (versioned v1.0) / CSV import with instant schema validation, file size limit (5MB), row limit (10,000 samples), and missing-field diagnostics.
2. **Run Facts & Metadata View (Mirroring UI Mockup):**
   - Three-tab header: `[Run Facts]` | `[Demo Space]` | `[Analysis]`.
   - Synthetic Demo indicator badge (`[SYNTHETIC FIXTURE]`) versus imported user experiment.
   - **General Metadata Card:** Owner, Git Branch, Commit Hash, Creation Date, Task Type.
   - **Model Metadata Card:** Algorithm / Family, Architecture, Hyperparameter pill badges (learning rate, batch size, epochs, dropout, etc., with arbitrary unknown keys preserved).
   - **Data Metadata Card:** Dataset Name, Preprocessing recipe, Size, Observation count, Sample link.
   - **Metrics Card:**
     - Best loss with percentage delta vs prior run, loss curve sparkline.
     - Distinguishes imported metrics from independently calculated metrics (ECE, accuracy, per-class F1, regression metrics).
     - Explainability / Slice importance bars.
     - Confusion Matrix with active warning badges.
3. **Experiment Record Management:**
   - Search, filter by tags or task type, update notes, export experiment JSON, and delete experiment records.

### Section C: Model Comparison
1. **Dynamic Side-by-Side Comparison:**
   - Select any two compatible experiments for pairwise comparison.
   - Support arbitrary model architectures without hardcoding.
2. **Metrics & Delta Evaluation:**
   - Accuracy, Macro-F1, Precision, Recall, Loss, Inference Latency (ms/sample).
   - Color-coded delta indicators (green for statistically meaningful gains, red for regressions).
3. **Protocol Compatibility Guardrail:**
   - Automated check verifying matching dataset names, test splits, and metric definitions.
   - Visual warning banner if protocols diverge (e.g., *"Warning: Comparing 5-fold CV with holdout test split"*).
4. **Visual Comparison Tools:**
   - Side-by-side Confusion Matrices with true vs predicted counts and normalized rates.
   - Confidence distribution histograms (comparing overconfident vs well-calibrated regimes).
   - Hyperparameter & configuration diff table highlighting changed variables.

### Section D: Model Behavior Explorer (Signature Feature)
1. **Sample & Case Browser:**
   - Table and card view of evaluation samples with Ground Truth Label, Model A Prediction, Model B Prediction, and Confidence scores.
2. **Interactive Agreement / Disagreement Segmentation:**
   - Quick filters: `[All Samples]` | `[Mutual Agreement (Correct)]` | `[Disagreement]` | `[Both Incorrect]` | `[Model A Only Correct]` | `[Model B Only Correct]`.
   - Error classification: False Positives (FP) vs False Negatives (FN).
3. **Multi-Slice Volumetric CT Inspector:**
   - Motivating use case demonstration: Intracranial Hemorrhage detection across 16–24 axial CT slices.
   - Interactive slice carousel/scrubber showing slice indices, focal hemorrhage probability curve across slices, and how aggregation (Consensus voting vs. Average/Max Pooling) produced the final scan-level call.
   - Demonstrates why CoAtNet Consensus might miss subtle focal bleeds (requires quorum) while ConvNeXt-V2 Pool detects them, or vice-versa where pooling is swayed by noisy outlier slices.
4. **Confidence vs. Correctness Scatter / Distribution:**
   - Visualizes high-confidence failures (silent errors) and low-confidence correct guesses.

### Section E: AI Experiment Insights & Hypothesis System
1. **Dual-Mode Intelligence Engine:**
   - **Mode 1 (LLM-Powered):** Configurable OpenAI-compatible / Gemini-compatible API integration. Authentication via server-side environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`) or ephemeral session input. Analyzes metric deltas, confusion matrix shifts, and disagreement statistics into structured scientific narratives.
   - **Mode 2 (Deterministic ML Diagnostic Engine):** 100% offline rule-based analytical engine. Computes error rate differences, confidence entropy, class-imbalance impacts, calibration error (ECE), and focal sensitivity without external network calls.
   - **Reliability & Safety:** Graceful fallback to deterministic engine on timeout, rate limit, or invalid response. Strict prohibition against claiming causation from observational data alone and against generating clinical medical diagnoses.
2. **Taxonomy of Structured Findings:**
   - *Measured Observations:* Directly computed statistical deltas and facts.
   - *Rule-Derived Findings:* Analytical deductions (e.g., trade-off between false alarms and missed detections).
   - *Hypotheses:* Plausible explanations for observed behavioral divergence.
   - *Recommendations:* Concrete, evidence-grounded next-step experimental proposals linked to specific observed failures.
3. **Hypothesis Management ("Create Hypothesis"):**
   - Clickable action from insights to convert recommendations into structured Hypothesis cards.
   - Track hypothesis rationale, status (`Draft`, `In Progress`, `Validated`, `Rejected`), and link to subsequent experiments.

---

## 4. Non-Functional Requirements

1. **Performance:** Sub-second client-side UI transitions and table filtering on 500+ sample evaluation sets.
2. **Persistence:** Zero data loss on browser refresh using SQLite on backend and redundant local caching.
3. **Reliability:** Graceful error handling for missing slices, unrecorded metrics, or invalid JSON uploads.
4. **Code Quality:** Fully typed TypeScript frontend, strict Pydantic models on FastAPI backend, modular directory architecture.
5. **Privacy:** No external data transmission unless the user explicitly enters an LLM API key. Demo data clearly flagged as synthetic.
