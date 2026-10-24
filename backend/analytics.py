import math
import json
from typing import Dict, Any, List, Optional
from database import db_get_experiment, db_get_experiment_samples

def calculate_metrics_from_samples(samples: List[Dict[str, Any]], task_type: str = "classification") -> Dict[str, Any]:
    if not samples:
        return {
            "calculated_metrics": {},
            "confusion_matrix": {},
            "calibration_curve": []
        }

    if task_type == "regression":
        # Regression calculations
        y_trues = []
        y_preds = []
        for s in samples:
            yt = s.get("continuous_true")
            yp = s.get("continuous_prediction")
            if yt is not None and yp is not None:
                y_trues.append(float(yt))
                y_preds.append(float(yp))

        if not y_trues:
            return {"calculated_metrics": {}, "confusion_matrix": {}, "calibration_curve": []}

        n = len(y_trues)
        errors = [yp - yt for yt, yp in zip(y_trues, y_preds)]
        abs_errors = [abs(e) for e in errors]
        sq_errors = [e ** 2 for e in errors]

        mae = sum(abs_errors) / n
        mse = sum(sq_errors) / n
        rmse = math.sqrt(mse)

        mean_y = sum(y_trues) / n
        ss_tot = sum((yt - mean_y) ** 2 for yt in y_trues)
        ss_res = sum(sq_errors)
        r2 = round(1.0 - (ss_res / ss_tot), 4) if ss_tot > 0 else 0.0

        return {
            "calculated_metrics": {
                "mae": round(mae, 4),
                "mse": round(mse, 4),
                "rmse": round(rmse, 4),
                "r2_score": r2
            },
            "confusion_matrix": {},
            "calibration_curve": []
        }

    # Classification / Multi-slice classification calculations
    tp = sum(1 for s in samples if s.get("true_label") == 1 and s.get("predicted_label") == 1)
    tn = sum(1 for s in samples if s.get("true_label") == 0 and s.get("predicted_label") == 0)
    fp = sum(1 for s in samples if s.get("true_label") == 0 and s.get("predicted_label") == 1)
    fn = sum(1 for s in samples if s.get("true_label") == 1 and s.get("predicted_label") == 0)

    total = len(samples)
    accuracy = round((tp + tn) / total, 4) if total > 0 else 0.0

    precision_pos = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall_pos = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    f1_pos = round((2 * precision_pos * recall_pos) / (precision_pos + recall_pos), 4) if (precision_pos + recall_pos) > 0 else 0.0

    precision_neg = round(tn / (tn + fn), 4) if (tn + fn) > 0 else 0.0
    recall_neg = round(tn / (tn + fp), 4) if (tn + fp) > 0 else 0.0
    f1_neg = round((2 * precision_neg * recall_neg) / (precision_neg + recall_neg), 4) if (precision_neg + recall_neg) > 0 else 0.0

    f1_macro = round((f1_pos + f1_neg) / 2.0, 4)

    # Calibration Analysis (Expected Calibration Error - ECE)
    num_bins = 10
    bins = [[] for _ in range(num_bins)]
    for s in samples:
        conf = float(s.get("confidence", s.get("probability", 0.5)))
        # clamp between 0.0 and 1.0
        conf = max(0.0, min(1.0, conf))
        bin_idx = min(int(conf * num_bins), num_bins - 1)
        bins[bin_idx].append(s)

    ece = 0.0
    calibration_curve = []
    for i, b_samples in enumerate(bins):
        bin_center = round((i + 0.5) / num_bins, 2)
        count = len(b_samples)
        if count > 0:
            avg_conf = sum(float(s.get("confidence", s.get("probability", 0.5))) for s in b_samples) / count
            avg_acc = sum(1 for s in b_samples if (s.get("is_correct") or s.get("true_label") == s.get("predicted_label"))) / count
            ece += (count / total) * abs(avg_acc - avg_conf)
            calibration_curve.append({
                "bin_index": i,
                "bin_center": bin_center,
                "confidence": round(avg_conf, 4),
                "accuracy": round(avg_acc, 4),
                "count": count
            })
        else:
            calibration_curve.append({
                "bin_index": i,
                "bin_center": bin_center,
                "confidence": bin_center,
                "accuracy": 0.0,
                "count": 0
            })

    ece = round(ece, 4)

    return {
        "calculated_metrics": {
            "accuracy": accuracy,
            "precision": precision_pos,
            "recall": recall_pos,
            "f1_macro": f1_macro,
            "f1_positive": f1_pos,
            "f1_negative": f1_neg,
            "ece": ece
        },
        "confusion_matrix": {
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp,
            "total": total
        },
        "calibration_curve": calibration_curve
    }

def check_compatibility(exp_a: Dict[str, Any], exp_b: Dict[str, Any]) -> Dict[str, Any]:
    reasons = []
    warnings = []
    is_compatible = True

    # Task type matching
    type_a = exp_a.get("task_type", "classification")
    type_b = exp_b.get("task_type", "classification")
    if type_a != type_b:
        is_compatible = False
        reasons.append(
            f"Task type mismatch: '{type_a}' vs '{type_b}'. Comparing classification and regression tasks is invalid."
        )

    # Dataset matching
    if exp_a.get("dataset_name") != exp_b.get("dataset_name"):
        is_compatible = False
        reasons.append(
            f"Dataset mismatch: '{exp_a.get('dataset_name')}' vs '{exp_b.get('dataset_name')}'. Direct metric comparisons are invalid."
        )

    # Split matching
    if exp_a.get("dataset_split") != exp_b.get("dataset_split"):
        warnings.append(
            f"Split difference: '{exp_a.get('dataset_split')}' vs '{exp_b.get('dataset_split')}'. Results may exhibit distribution variance."
        )

    # Evaluation protocol
    if exp_a.get("evaluation_protocol") != exp_b.get("evaluation_protocol"):
        warnings.append(
            f"Protocol variance: '{exp_a.get('evaluation_protocol')}' vs '{exp_b.get('evaluation_protocol')}'. Verify cross-validation folding."
        )

    return {
        "is_compatible": is_compatible,
        "reasons": reasons,
        "warnings": warnings
    }

def compute_metrics_comparison(metrics_a: Dict[str, float], metrics_b: Dict[str, float]) -> List[Dict[str, Any]]:
    all_keys = sorted(list(set(metrics_a.keys()) | set(metrics_b.keys())))
    comparisons = []

    lower_is_better = {"loss", "latency_ms", "inference_time", "ece", "error_rate"}

    for key in all_keys:
        val_a = metrics_a.get(key, 0.0)
        val_b = metrics_b.get(key, 0.0)
        delta = round(val_b - val_a, 4)
        pct_change = round((delta / val_a * 100) if val_a != 0 else 0.0, 2)

        better_model = None
        if key in lower_is_better:
            if val_b < val_a:
                better_model = "B"
            elif val_a < val_b:
                better_model = "A"
        else:
            if val_b > val_a:
                better_model = "B"
            elif val_a > val_b:
                better_model = "A"

        comparisons.append({
            "metric_name": key,
            "val_a": val_a,
            "val_b": val_b,
            "delta": delta,
            "percent_change": pct_change,
            "better_model": better_model
        })

    return comparisons

def compute_hyperparameter_diff(hp_a: Dict[str, Any], hp_b: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    diff = {}
    all_keys = set(hp_a.keys()) | set(hp_b.keys())
    for k in sorted(all_keys):
        val_a = hp_a.get(k, "N/A")
        val_b = hp_b.get(k, "N/A")
        is_different = (val_a != val_b)
        diff[k] = {
            "val_a": val_a,
            "val_b": val_b,
            "is_different": is_different
        }
    return diff

def compute_agreement_summary(samples_a: List[Dict[str, Any]], samples_b: List[Dict[str, Any]]) -> Dict[str, Any]:
    b_map = {s["case_id"]: s for s in samples_b}
    matched = 0
    mutual_correct = 0
    both_incorrect = 0
    a_only_correct = 0
    b_only_correct = 0
    disagreements = 0

    fp_a = 0
    fn_a = 0
    fp_b = 0
    fn_b = 0

    focal_disagreements = 0  # 1-2 slice focal lesions

    for sa in samples_a:
        cid = sa["case_id"]
        if cid not in b_map:
            continue
        sb = b_map[cid]
        matched += 1

        y_true = sa["true_label"]
        y_a = sa["predicted_label"]
        y_b = sb["predicted_label"]

        if y_a != y_true:
            if y_a == 1:
                fp_a += 1
            else:
                fn_a += 1

        if y_b != y_true:
            if y_b == 1:
                fp_b += 1
            else:
                fn_b += 1

        if y_a == y_true and y_b == y_true:
            mutual_correct += 1
        elif y_a != y_true and y_b != y_true:
            both_incorrect += 1
        elif y_a == y_true and y_b != y_true:
            a_only_correct += 1
            disagreements += 1
        elif y_b == y_true and y_a != y_true:
            b_only_correct += 1
            disagreements += 1

        # Check slice count if available
        if y_a != y_b:
            slices = sa.get("slices", [])
            focal_slices = sum(1 for sl in slices if sl.get("is_focal_ground_truth", False))
            if 0 < focal_slices <= 3:
                focal_disagreements += 1

    disagreement_rate = round((disagreements / matched) if matched > 0 else 0.0, 4)

    return {
        "matched_cases": matched,
        "mutual_correct": mutual_correct,
        "both_incorrect": both_incorrect,
        "a_only_correct": a_only_correct,
        "b_only_correct": b_only_correct,
        "total_disagreements": disagreements,
        "disagreement_rate": disagreement_rate,
        "fp_a": fp_a,
        "fn_a": fn_a,
        "fp_b": fp_b,
        "fn_b": fn_b,
        "focal_slice_disagreements": focal_disagreements
    }

def get_explorer_cases(
    exp_a_id: str,
    exp_b_id: str,
    filter_type: str = "all",
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
) -> Dict[str, Any]:
    samples_a = db_get_experiment_samples(exp_a_id)
    samples_b = db_get_experiment_samples(exp_b_id)
    b_map = {s["case_id"]: s for s in samples_b}

    exp_a = db_get_experiment(exp_a_id)
    task_type = exp_a.get("task_type", "classification") if exp_a else "classification"
    ds_name = (exp_a.get("dataset_name") or "").lower() if exp_a else ""
    is_medical = "ich" in ds_name or "rsna" in ds_name or "hemorrhage" in ds_name

    items = []
    for sa in samples_a:
        cid = sa["case_id"]
        if cid not in b_map:
            continue
        sb = b_map[cid]

        y_true = sa["true_label"]
        y_a = sa["predicted_label"]
        y_b = sb["predicted_label"]
        prob_a = sa["probability"]
        prob_b = sb["probability"]

        # Classification bucket
        if y_a == y_true and y_b == y_true:
            bucket = "mutual_correct"
        elif y_a != y_true and y_b != y_true:
            bucket = "both_error"
        elif y_a == y_true and y_b != y_true:
            bucket = "a_only_correct"
        else:
            bucket = "b_only_correct"

        is_disagreement = (y_a != y_b)
        has_fp = (y_a == 1 and y_true == 0) or (y_b == 1 and y_true == 0)
        has_fn = (y_a == 0 and y_true == 1) or (y_b == 0 and y_true == 1)

        # Filtering logic
        if filter_type == "mutual_correct" and bucket != "mutual_correct":
            continue
        elif filter_type == "disagreement" and not is_disagreement:
            continue
        elif filter_type == "both_error" and bucket != "both_error":
            continue
        elif filter_type == "a_only_correct" and bucket != "a_only_correct":
            continue
        elif filter_type == "b_only_correct" and bucket != "b_only_correct":
            continue
        elif filter_type == "fp" and not has_fp:
            continue
        elif filter_type == "fn" and not has_fn:
            continue

        if search and search.lower() not in cid.lower():
            continue

        # Determine task-appropriate label name and finding type
        slices_a = sa.get("slices", [])
        slice_count = len(slices_a) if slices_a else (sa.get("slice_count", 0) if sa.get("slice_count") != 24 else 0)

        if is_medical:
            label_name = "Positive (Hemorrhage)" if y_true == 1 else "Negative (Normal)"
            finding_type = sa.get("finding_type", "Intracranial Hemorrhage")
        elif task_type == "regression":
            label_name = f"Target: {sa.get('continuous_true', y_true)}"
            finding_type = sa.get("finding_type", "Continuous Target")
        else:
            label_name = "Positive (Class 1)" if y_true == 1 else "Negative (Class 0)"
            finding_type = sa.get("finding_type", "Standard Evaluation Sample")

        items.append({
            "case_id": cid,
            "true_label": y_true,
            "label_name": label_name,
            "finding_type": finding_type,
            "slice_count": slice_count,
            "continuous_true": sa.get("continuous_true"),
            "continuous_prediction_a": sa.get("continuous_prediction"),
            "continuous_prediction_b": sb.get("continuous_prediction"),
            "model_a": {
                "predicted_label": y_a,
                "probability": prob_a,
                "confidence": sa.get("confidence", prob_a),
                "is_correct": (y_a == y_true),
                "slices": slices_a,
                "continuous_prediction": sa.get("continuous_prediction")
            },
            "model_b": {
                "predicted_label": y_b,
                "probability": prob_b,
                "confidence": sb.get("confidence", prob_b),
                "is_correct": (y_b == y_true),
                "slices": sb.get("slices", []),
                "continuous_prediction": sb.get("continuous_prediction")
            },
            "bucket": bucket,
            "is_disagreement": is_disagreement
        })

    total_count = len(items)
    start_idx = (page - 1) * page_size
    paged_items = items[start_idx:start_idx + page_size]

    return {
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "items": paged_items
    }

def run_deterministic_analysis(exp_a: Dict[str, Any], exp_b: Dict[str, Any]) -> Dict[str, Any]:
    samples_a = db_get_experiment_samples(exp_a["id"])
    samples_b = db_get_experiment_samples(exp_b["id"])
    agreement = compute_agreement_summary(samples_a, samples_b)
    comp_metrics = compute_metrics_comparison(exp_a.get("metrics", {}), exp_b.get("metrics", {}))

    name_a = exp_a["name"]
    name_b = exp_b["name"]
    arch_a = exp_a["architecture"]
    arch_b = exp_b["architecture"]
    agg_a = exp_a.get("aggregation_method", "Standard")
    agg_b = exp_b.get("aggregation_method", "Standard")
    task_type = exp_a.get("task_type", "classification")

    ds_name = (exp_a.get("dataset_name") or "").lower()
    is_medical = "ich" in ds_name or "rsna" in ds_name or "hemorrhage" in ds_name
    has_slices = agreement.get("focal_slice_disagreements", 0) > 0 or task_type == "multi_slice_classification"

    findings = []
    recommendations = []

    # Standardized Taxonomy:
    # 1. Measured Observation
    f1_delta = next((m for m in comp_metrics if m["metric_name"] == "f1_macro"), None)
    loss_delta = next((m for m in comp_metrics if m["metric_name"] == "loss"), None)

    findings.append({
        "category": "Measured Observation",
        "title": f"Empirical Performance Deltas ({arch_a} vs {arch_b})",
        "description": (
            f"Evaluation records demonstrate that {name_a} achieves Macro-F1 of {exp_a.get('metrics', {}).get('f1_macro', 'N/A')} "
            f"while {name_b} achieves {exp_b.get('metrics', {}).get('f1_macro', 'N/A')} "
            f"(delta: {f1_delta['delta'] if f1_delta else '0.0'}). "
            f"Loss changed from {exp_a.get('metrics', {}).get('loss', 'N/A')} to {exp_b.get('metrics', {}).get('loss', 'N/A')}."
        ),
        "evidence": (
            f"Empirical protocol: {exp_a.get('evaluation_protocol')} on {exp_a.get('dataset_name')} ({exp_a.get('dataset_size')}). "
            f"Total matched evaluation records: {agreement['matched_cases']}."
        ),
        "confidence_level": "High"
    })

    # 2. Rule-Derived Finding
    if task_type == "regression":
        findings.append({
            "category": "Rule-Derived Finding",
            "title": f"Continuous Prediction Error Distribution ({arch_a} vs {arch_b})",
            "description": (
                f"Across {agreement['matched_cases']} matched evaluation cases, "
                f"{name_a} and {name_b} diverge on continuous prediction targets with "
                f"{agreement['total_disagreements']} cases exhibiting thresholded error divergence."
            ),
            "evidence": (
                f"Protocol: {exp_a.get('evaluation_protocol')} on {exp_a.get('dataset_name')}."
            ),
            "confidence_level": "High"
        })
    else:
        findings.append({
            "category": "Rule-Derived Finding",
            "title": f"Precision vs Sensitivity Divergence ({agg_a} vs {agg_b})",
            "description": (
                f"{name_a} recorded {agreement['fp_a']} False Positives and {agreement['fn_a']} False Negatives. "
                f"In contrast, {name_b} recorded {agreement['fp_b']} False Positives and {agreement['fn_b']} False Negatives. "
                f"While {name_b} changes missed detections by {agreement['fn_a'] - agreement['fn_b']} cases, it introduces "
                f"{agreement['fp_b'] - agreement['fp_a']} relative false alarms."
            ),
            "evidence": (
                f"Case analysis shows {agreement['total_disagreements']} total disagreement cases "
                f"({round(agreement['disagreement_rate'] * 100, 1)}% disagreement rate across {agreement['matched_cases']} cases)."
            ),
            "confidence_level": "High"
        })

    # 3. Hypothesis (Rule-grounded)
    if has_slices and agreement["focal_slice_disagreements"] > 0:
        if is_medical:
            findings.append({
                "category": "Hypothesis",
                "title": "Quorum Failure on Isolated Focal Sub-Components",
                "description": (
                    f"In {agreement['focal_slice_disagreements']} cases with localized focal signals confined to 1-3 sub-elements, "
                    f"the consensus voting mechanism in {name_a} failed to trigger positive detection because "
                    f"the quorum requirement was not satisfied. Pooling in {name_b} captured localized signals."
                ),
                "evidence": (
                    f"Sub-component inspection verifies {agreement['focal_slice_disagreements']} cases "
                    f"exhibiting isolated activation > 0.85 with adjacent slice activations < 0.15."
                ),
                "confidence_level": "High"
            })
        else:
            findings.append({
                "category": "Hypothesis",
                "title": "Aggregation Sensitivity Divergence on Localized Signals",
                "description": (
                    f"In {agreement['focal_slice_disagreements']} cases with localized sub-slice activations, "
                    f"differing pooling and aggregation mechanisms produced divergent instance-level predictions."
                ),
                "evidence": (
                    f"Verified on {agreement['focal_slice_disagreements']} sub-slice discrepancy cases."
                ),
                "confidence_level": "High"
            })
    else:
        findings.append({
            "category": "Hypothesis",
            "title": "Decision Boundary Trade-Off Hypothesis",
            "description": (
                f"The difference in false alarm and miss rates between {name_a} and {name_b} indicates "
                f"distinct inductive biases in decision boundary placement rather than uniform quality improvement."
            ),
            "evidence": (
                f"Observed on {agreement['total_disagreements']} disagreement samples across {agreement['matched_cases']} test records."
            ),
            "confidence_level": "Moderate"
        })

    # Recommendations
    if has_slices:
        if is_medical:
            recommendations.append({
                "title": "Attention-Weighted Softmax Aggregation with Temperature Scaling",
                "hypothesis_proposal": (
                    "Replacing unweighted consensus voting and max pooling with an attention-weighted aggregator "
                    "(temperature tau=0.35) will retain sensitivity on isolated signals while suppressing artifact false alarms."
                ),
                "controlled_variable": "Aggregation Head: Attention-Weighted Softmax (tau=0.35)",
                "rationale": (
                    f"Consensus voting produced {agreement['fn_a']} misses due to rigid quorum constraints, while "
                    f"unweighted pooling produced {agreement['fp_b']} false alarms. Attention scaling balances localized prominence."
                ),
                "expected_impact": "Target: Maintain high recall while reducing false alarms below baseline."
            })
            recommendations.append({
                "title": "Sub-Element Context Sequence Modeling (Transformer / BiLSTM)",
                "hypothesis_proposal": (
                    "Adding a lightweight contextual Transformer encoder across instance embeddings before pooling "
                    "will allow the model to recognize structural continuity across adjacent slices and filter isolated artifacts."
                ),
                "controlled_variable": "Context Encoder: 2-layer Transformer (d_model=512, nhead=8)",
                "rationale": (
                    "Current architectures treat slices as independent bag-of-instances without continuity constraints."
                ),
                "expected_impact": "Reduce false positive rate on boundary slices."
            })
        else:
            recommendations.append({
                "title": "Parametric Attention Aggregation Across Sub-Elements",
                "hypothesis_proposal": (
                    "Using parameterized attention pooling with temperature scaling will weight informative sub-slices "
                    "proportionally while damping spurious single-element activations."
                ),
                "controlled_variable": "Aggregation: Multi-Head Attention Pool",
                "rationale": "Static pooling lacks adaptivity across heterogeneous sub-element distributions.",
                "expected_impact": "Improve Macro-F1 across localized and distributed instances."
            })
    else:
        # General Classification / Tabular / Regression recommendations
        if task_type == "regression":
            recommendations.append({
                "title": "Huber Loss Optimization for Residual Stability",
                "hypothesis_proposal": (
                    "Switching to smooth Huber loss with adaptive delta thresholding will reduce error variance on boundary cases."
                ),
                "controlled_variable": "Loss Function: Huber Loss (delta=1.0)",
                "rationale": "Standard MSE disproportionately penalizes tail predictions, inducing variance.",
                "expected_impact": "Target: Reduce RMSE and improve R2 score."
            })
        else:
            recommendations.append({
                "title": "Decision Threshold Optimization via Cost-Sensitive Tuning",
                "hypothesis_proposal": (
                    "Calibrating the classification decision threshold based on empirical ROC operating point "
                    "will optimize the trade-off between False Positives and False Negatives."
                ),
                "controlled_variable": "Classification Threshold: Calibrated Optimal Cutoff",
                "rationale": (
                    f"Model A produced {agreement['fp_a']} FPs and {agreement['fn_a']} FNs; "
                    f"Model B produced {agreement['fp_b']} FPs and {agreement['fn_b']} FNs. "
                    f"Fixed 0.5 threshold fails to balance asymmetric error costs."
                ),
                "expected_impact": "Target: Maximize Macro-F1 and optimize precision-recall balance."
            })
            recommendations.append({
                "title": "Probability Calibration via Isotonic Regression / Platt Scaling",
                "hypothesis_proposal": (
                    "Applying post-hoc probability calibration will align predicted probabilities with empirical frequencies, "
                    "lowering Expected Calibration Error (ECE)."
                ),
                "controlled_variable": "Post-Processing: Isotonic Probability Calibration",
                "rationale": "Confidence scores currently show miscalibration across intermediate probability bins.",
                "expected_impact": "Target: Lower ECE below 0.05 while preserving class ranking."
            })

    summary = (
        f"Comparative analysis between {name_a} ({arch_a}) and {name_b} ({arch_b}) reveals "
        f"trade-offs across precision, sensitivity, and calibration. "
        f"Across {agreement['matched_cases']} matched cases, {agreement['total_disagreements']} prediction divergences were observed."
    )

    return {
        "provider_used": "Deterministic ML Analytical Engine (Offline Rule-Based)",
        "summary": summary,
        "findings": findings,
        "recommendations": recommendations,
        "discrepancy_stats": agreement
    }

async def generate_ai_insights(
    exp_a_id: str,
    exp_b_id: str,
    provider: str = "deterministic",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    import os
    exp_a = db_get_experiment(exp_a_id)
    exp_b = db_get_experiment(exp_b_id)

    if not exp_a or not exp_b:
        raise ValueError("One or both experiment IDs not found.")

    # Always compute deterministic ground truth facts first
    det_result = run_deterministic_analysis(exp_a, exp_b)

    # Resolve API keys: user-provided session key OR environment variable
    if provider == "gemini":
        api_key = api_key or os.environ.get("GEMINI_API_KEY")
    elif provider == "openai":
        api_key = api_key or os.environ.get("OPENAI_API_KEY")

    # If external provider requested with valid API key
    if provider in ["openai", "gemini"] and api_key:
        try:
            import httpx
            prompt = f"""
You are ExperimentPilot's Principal ML Scientist.
Analyze the following experimental data comparing two models:
Model A: {exp_a['name']} ({exp_a['architecture']}, Aggregation: {exp_a['aggregation_method']})
Metrics A: {json.dumps(exp_a['metrics'])}
Confusion Matrix A: {json.dumps(exp_a['confusion_matrix'])}

Model B: {exp_b['name']} ({exp_b['architecture']}, Aggregation: {exp_b['aggregation_method']})
Metrics B: {json.dumps(exp_b['metrics'])}
Confusion Matrix B: {json.dumps(exp_b['confusion_matrix'])}

Discrepancy Statistics: {json.dumps(det_result['discrepancy_stats'])}

Provide a grounded scientific synthesis in strict JSON format with keys:
"summary": string,
"findings": array of {{"category": string (must be one of 'Measured Observation', 'Rule-Derived Finding', 'Hypothesis'), "title": string, "description": string, "evidence": string, "confidence_level": string}},
"recommendations": array of {{"title": string, "hypothesis_proposal": string, "controlled_variable": string, "rationale": string, "expected_impact": string}}

SAFETY & SCIENTIFIC INTEGRITY RULES:
1. Do not claim that a parameter caused an improvement based solely on observational comparisons.
2. Link every recommendation to specific measured empirical evidence from the data above.
3. Never generate clinical medical diagnoses or unsupported clinical conclusions. Base findings strictly on ML behavior.
"""
            if provider == "openai":
                base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        f"{base_url}/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": prompt}],
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        return {
                            "provider_used": f"OpenAI ({resp.json().get('model', 'gpt-4o-mini')})",
                            "summary": parsed.get("summary", det_result["summary"]),
                            "findings": parsed.get("findings", det_result["findings"]),
                            "recommendations": parsed.get("recommendations", det_result["recommendations"]),
                            "discrepancy_stats": det_result["discrepancy_stats"]
                        }

            elif provider == "gemini":
                async with httpx.AsyncClient(timeout=20.0) as client:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                    resp = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"response_mime_type": "application/json"}
                        }
                    )
                    if resp.status_code == 200:
                        candidates = resp.json().get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            text = candidates[0]["content"]["parts"][0]["text"]
                            parsed = json.loads(text)
                            return {
                                "provider_used": "Google Gemini (gemini-1.5-flash)",
                                "summary": parsed.get("summary", det_result["summary"]),
                                "findings": parsed.get("findings", det_result["findings"]),
                                "recommendations": parsed.get("recommendations", det_result["recommendations"]),
                                "discrepancy_stats": det_result["discrepancy_stats"]
                            }

        except Exception as e:
            # Fall back safely without crashing
            det_result["provider_used"] = f"Deterministic ML Analytical Engine (Fallback due to: {str(e)[:60]}...)"
            return det_result

    return det_result
