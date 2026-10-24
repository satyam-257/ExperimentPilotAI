# ExperimentPilot: Scope & Project Boundaries

**Tagline:** Plan. Compare. Understand. Improve.  
**Version:** 1.0.0-MVP  
**Document Status:** Approved Scope Document  
**Date:** October 2026  

---

## 1. Executive Summary

ExperimentPilot is a general-purpose, model-agnostic machine learning experimentation and model-behavior analysis platform. Designed for ML practitioners, applied researchers, and data scientists, ExperimentPilot bridges the gap between raw metric tables and granular model behavior.

Rather than treating models as black-box scorecards, ExperimentPilot enables practitioners to:
1. **Track and Organize:** Record arbitrary model architectures, hyperparameter sets, data pre-processing pipelines, and aggregation methods.
2. **Compare Fairly:** Perform rigorous side-by-side evaluations across metrics, configurations, and calibration curves while enforcing evaluation protocol compatibility.
3. **Explore Behavior:** Inspect sample-level and sub-sample (e.g., multi-slice volumetric, multi-view, or temporal) predictions, isolating instances of agreement, disagreement, false positives, and false negatives.
4. **Derive Actionable Insights:** Generate evidence-grounded hypotheses for follow-up experiments using either an external LLM (OpenAI/Gemini-compatible) or an embedded deterministic ML diagnostic engine.

---

## 2. Core Problem Statement

Modern machine learning development often relies on aggregate scalar metrics (e.g., test accuracy or macro-F1) that conceal critical failure modes. In complex real-world workflows—such as multi-slice medical imaging where slice-level features are aggregated into a scan-level diagnosis—two models with identical overall accuracy may fail in drastically different ways (e.g., consensus voting failing on subtle single-slice focal lesions versus average pooling diluting high-confidence localized signals).

Existing ML experiment trackers log hyperparameters and scalar metrics well, but lack interactive, case-level behavioral inspection and automated, evidence-grounded hypothesis generation. ExperimentPilot solves this disparity.

---

## 3. Product Boundaries & Agnosticism Principle

### In-Scope (Agreed MVP Scope)
- **General-Purpose, Model-Agnostic Core:** Completely decoupled from specific architectures or domains. Accommodates arbitrary task types (classification, regression, hierarchical/multi-slice vision, tabular, NLP) and model families. CoAtNet, ConvNeXt-V2, and multi-slice CT analysis serve as illustrative demonstration fixtures only.
- **Extensible Configuration Engine:** Arbitrary hyperparameter schemas, preprocessing flags, pooling strategies, and dataset identifiers. Unknown keys are preserved rather than discarded.
- **Protocol Compatibility Guardrails:** Prevents misleading comparisons between runs evaluated on mismatched datasets, splits, or incompatible metric definitions with clear warnings.
- **Side-by-Side Model Comparison:** Dynamic metric diffs (distinguishing imported metrics from independently calculated metrics), configuration deltas, confusion matrices, and confidence calibration curves (ECE).
- **Signature Model Behavior Explorer:**
  - Case-level true vs. predicted label inspections and regression residuals.
  - Sliced/hierarchical sub-component visualization (demonstrated via multi-slice volumetric CT scans with 16–24 slices per study when slice data exists).
  - Filterable Agreement vs. Disagreement matrices.
  - False positive and false negative error isolation.
  - Confidence versus correctness calibration inspection.
- **Evidence-Grounded AI Insights & Hypothesis Tracker:**
  - Dual-mode architecture: Provider-independent LLM analysis (OpenAI / Gemini-compatible APIs) with environment variable authentication, plus an offline, high-precision deterministic rule-based ML analysis fallback.
  - Clear taxonomy of findings: measured observations, rule-derived findings, hypotheses, and recommendations linked to supporting evidence.
  - Structured error diagnosis, controlled follow-up suggestions, and "Create Hypothesis" workflow.
- **Demonstration Fixtures:** Realistic synthetic benchmark fixtures comparing CoAtNet Consensus and ConvNeXt-V2 Pool on a multi-slice Intracranial Hemorrhage detection task, clearly marked with `[SYNTHETIC FIXTURE]` badges.
- **Data Portability:** Validated CSV and versioned JSON (v1.0) import and export for external experiment results, with strict file size and row limits.

### Out-of-Scope (Non-Goals for MVP)
- Direct on-platform training/fine-tuning execution (ExperimentPilot is an experiment analysis and tracking system, not a model trainer or cloud orchestrator).
- Real Protected Health Information (PHI) or live clinical PACS integration (synthetic / de-identified datasets only).
- Hardcoding architecture-specific UI widgets tailored exclusively to CoAtNet or ConvNeXt-V2.
- Fabricating metrics, predictions, or model execution results.
- Automated clinical diagnoses or medical conclusions.

---

## 4. User Personas

1. **Applied ML Researcher:** Needs to understand whether a new pooling mechanism (e.g., Consensus voting vs. Softmax pooling) actually resolves edge-case predictions or introduces spurious false positives.
2. **Medical Imaging / Vision Engineer:** Works with volumetric CT/MRI studies and needs to see slice-level prediction breakdowns for individual patient scans to assess focal sensitivity.
3. **Data Science Team Lead:** Needs structured, evidence-backed hypotheses for sprint planning instead of ad-hoc hyperparameter guessing.

---

## 5. MVP Verification Milestones

1. **Milestone 1:** Architecture & Planning Setup (Documents: `scope.md`, `prd.md`, `spec.md`).
2. **Milestone 2:** Backend API & SQLite Persistence Engine (CRUD, comparisons, behavior extraction, deterministic ML analyzer).
3. **Milestone 3:** UI Shell & Design System (Dark navy aesthetic matching reference image, responsive layout, sidebar rail).
4. **Milestone 4:** Experiment Manager & Overview (Run facts, metadata pill cards, metrics sparklines, JSON/CSV import/export).
5. **Milestone 5:** Model Comparison View (Side-by-side metric diffs, confusion matrices with interactive alert callouts, configuration diffing).
6. **Milestone 6:** Model Behavior Explorer (Slice-by-slice viewer, agreement/disagreement filter, FP/FN drilldown, confidence calibration).
7. **Milestone 7:** AI Experiment Insights & Hypothesis System (Provider-independent LLM + deterministic fallback, hypothesis tracker).
8. **Milestone 8:** End-to-End Workflow Verification, Browser Validation, and Public Documentation.

---

## 6. Security, Privacy & Integrity Standards

- Zero hardcoded API keys or environment secrets in client bundles or public commits.
- Strict isolation and visible labeling of synthetic demonstration data (`[SYNTHETIC FIXTURE]`).
- Graceful error recovery on malformed or incomplete uploaded datasets with informative user feedback.
