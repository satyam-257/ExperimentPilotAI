import math
import random
import json
from datetime import datetime
from database import db_insert_experiment, db_insert_hypothesis
from analytics import calculate_metrics_from_samples

def seed_database(force: bool = False):
    from database import get_connection
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM experiments WHERE id IN ('exp_coatnet_consensus', 'exp_convnext_pool', 'exp_optimal_slice_pool')")
    existing = [r["id"] for r in c.fetchall()]
    conn.close()

    if not force and len(existing) >= 3:
        print("Synthetic experiment fixtures already seeded; preserving existing valid data.")
        return

    print("Seeding synthetic experiment fixtures...")
    random.seed(42)

    # 1. Generate 200 Synthetic Multi-Slice CT Cases
    cases_coatnet = []
    cases_convnext = []

    for i in range(1, 201):
        case_id = f"SCAN-{1000 + i}"
        
        # Determine ground truth (83 positive, 117 negative)
        is_positive = 1 if (i % 5 in [0, 2] or (i % 7 == 0 and i < 170)) else 0
        
        slices_ground_truth = []
        slices_coatnet = []
        slices_convnext = []

        if is_positive:
            # Type of hemorrhage: focal (1-2 slices) vs extensive (5-10 slices)
            is_focal = (i % 3 == 0) # About 1/3 are subtle focal micro-hemorrhages
            
            focal_start = random.randint(6, 14)
            focal_len = random.randint(1, 2) if is_focal else random.randint(5, 9)
            focal_range = range(focal_start, focal_start + focal_len)

            for s_idx in range(24):
                is_bleed_slice = s_idx in focal_range
                slices_ground_truth.append(is_bleed_slice)

                if is_bleed_slice:
                    base_prob = random.uniform(0.78, 0.96)
                    p_coat = round(min(0.99, base_prob + random.uniform(-0.08, 0.04)), 3)
                    p_conv = round(min(0.99, base_prob + random.uniform(-0.02, 0.06)), 3)
                else:
                    p_coat = round(random.uniform(0.01, 0.12), 3)
                    p_conv = round(random.uniform(0.02, 0.15), 3)

                slices_coatnet.append({
                    "slice_index": s_idx,
                    "probability": p_coat,
                    "predicted_label": 1 if p_coat >= 0.5 else 0,
                    "is_focal_ground_truth": is_bleed_slice
                })
                slices_convnext.append({
                    "slice_index": s_idx,
                    "probability": p_conv,
                    "predicted_label": 1 if p_conv >= 0.5 else 0,
                    "is_focal_ground_truth": is_bleed_slice
                })

            # Scan-level aggregation
            # CoAtNet: Consensus quorum (needs >= 3 slices >= 0.6)
            pos_slices_coat = sum(1 for s in slices_coatnet if s["probability"] >= 0.6)
            pred_coat = 1 if pos_slices_coat >= 3 else 0
            prob_coat = round(min(0.98, max(0.05, (pos_slices_coat / 6.0) * 0.8 + 0.1)), 3)

            # ConvNeXt: Top-3 Max/Avg Pool
            top_probs = sorted([s["probability"] for s in slices_convnext], reverse=True)[:3]
            prob_conv = round(sum(top_probs) / 3.0, 3)
            pred_conv = 1 if prob_conv >= 0.45 else 0

        else:
            # True Negative scan
            # Check if this scan has a streak artifact on skull base (slices 1-3)
            has_artifact = (i % 11 == 0) # ~10 scans have scanner streak artifact

            for s_idx in range(24):
                if has_artifact and s_idx == 2:
                    p_coat = round(random.uniform(0.40, 0.55), 3) # Consensus ignores single outlier
                    p_conv = round(random.uniform(0.78, 0.89), 3) # Max pool false alarms!
                else:
                    p_coat = round(random.uniform(0.01, 0.09), 3)
                    p_conv = round(random.uniform(0.02, 0.11), 3)

                slices_ground_truth.append(False)
                slices_coatnet.append({
                    "slice_index": s_idx,
                    "probability": p_coat,
                    "predicted_label": 1 if p_coat >= 0.5 else 0,
                    "is_focal_ground_truth": False
                })
                slices_convnext.append({
                    "slice_index": s_idx,
                    "probability": p_conv,
                    "predicted_label": 1 if p_conv >= 0.5 else 0,
                    "is_focal_ground_truth": False
                })

            # Scan aggregation for negative scan
            pos_slices_coat = sum(1 for s in slices_coatnet if s["probability"] >= 0.6)
            pred_coat = 1 if pos_slices_coat >= 3 else 0
            prob_coat = round(min(0.45, (pos_slices_coat / 4.0) * 0.4 + 0.05), 3)

            top_probs = sorted([s["probability"] for s in slices_convnext], reverse=True)[:3]
            prob_conv = round(sum(top_probs) / 3.0, 3)
            pred_conv = 1 if prob_conv >= 0.45 else 0

        # Build case sample records
        cases_coatnet.append({
            "case_id": case_id,
            "experiment_id": "exp_coatnet_consensus",
            "true_label": is_positive,
            "predicted_label": pred_coat,
            "probability": prob_coat,
            "is_correct": (pred_coat == is_positive),
            "confidence": prob_coat if pred_coat == 1 else round(1.0 - prob_coat, 3),
            "slices": slices_coatnet,
            "finding_type": "Intracranial Hemorrhage",
            "slice_count": 24,
            "metadata": {"scanner_kvp": 120, "reconstruction_kernel": "H30s"}
        })

        cases_convnext.append({
            "case_id": case_id,
            "experiment_id": "exp_convnext_pool",
            "true_label": is_positive,
            "predicted_label": pred_conv,
            "probability": prob_conv,
            "is_correct": (pred_conv == is_positive),
            "confidence": prob_conv if pred_conv == 1 else round(1.0 - prob_conv, 3),
            "slices": slices_convnext,
            "finding_type": "Intracranial Hemorrhage",
            "slice_count": 24,
            "metadata": {"scanner_kvp": 120, "reconstruction_kernel": "H30s"}
        })

    # 2. Experiment #1: CoAtNet Consensus
    exp_coatnet = {
        "id": "exp_coatnet_consensus",
        "name": "CoAtNet Consensus (Baseline)",
        "model_family": "Hybrid Transformer-CNN",
        "architecture": "CoAtNet-2",
        "aggregation_method": "Consensus Voting (t=0.6, Quorum >=3)",
        "dataset_name": "RSNA-ICH-Synthetic-24Slice",
        "dataset_split": "Validation Split A (n=200 scans)",
        "dataset_size": "200 scans (4,800 slices)",
        "evaluation_protocol": "Patient-stratified 5-fold CV",
        "git_branch": "feature-coatnet-quorum",
        "git_commit": "023medf239",
        "jira_owner": "Dr. Chen / ML-Vision",
        "hyperparameters": {
            "learning_rate": 0.0001,
            "batch_size": 16,
            "optimizer": "AdamW",
            "weight_decay": 0.01,
            "warmup_epochs": 5,
            "dropout": 0.2
        },
        "preprocessing": {
            "windowing": "Subdural + Brain + Bone",
            "resolution": "512x512",
            "slice_thickness": "5mm",
            "augmentation": "RandomCrop + Affine",
            "normalization": "HU Window Clipping (-20 to 180)",
            "slice_interpolation": "Bicubic 24-slice standard"
        },
        "metrics": {
            "loss": 0.267,
            "accuracy": 0.885,
            "f1_macro": 0.871,
            "precision": 0.880,
            "recall": 0.863,
            "latency_ms": 16.4
        },
        "loss_history": [0.82, 0.65, 0.51, 0.42, 0.36, 0.32, 0.29, 0.275, 0.267],
        "confusion_matrix": {
            "tn": 103,
            "fp": 14,
            "fn": 11,
            "tp": 72,
            "threshold": 0.5
        },
        "feature_importance": [
            {"feature": "Slices 5-12 (Basal Ganglia)", "importance": 0.39},
            {"feature": "Soft Tissue Expansion", "importance": 0.38},
            {"feature": "Slices 13-18 (Corona Radiata)", "importance": 0.24},
            {"feature": "Bone Window Density", "importance": 0.19},
            {"feature": "Slices 1-4 (Skull Base)", "importance": 0.14},
            {"feature": "Ventricle Midline Shift", "importance": 0.12},
            {"feature": "Centrum Semiovale", "importance": 0.08}
        ],
        "notes": "[SYNTHETIC FIXTURE] CoAtNet-2 with multi-slice consensus quorum voting. High precision on widespread bleeds; misses subtle single-slice micro-hemorrhages.",
        "is_synthetic": True,
        "created_at": "2026-09-18T10:15:00",
        "updated_at": "2026-09-18T14:30:00"
    }

    # 3. Experiment #2: ConvNeXt-V2 Pool (Reflecting the UI Mockup!)
    exp_convnext = {
        "id": "exp_convnext_pool",
        "name": "ConvNeXt-V2 Pool (Run #2)",
        "model_family": "Pure ConvNet",
        "architecture": "ConvNeXt-V2-Base",
        "aggregation_method": "Top-K Max-Average Pooling (k=3)",
        "dataset_name": "RSNA-ICH-Synthetic-24Slice",
        "dataset_split": "Validation Split A (n=200 scans)",
        "dataset_size": "200 scans (4,800 slices)",
        "evaluation_protocol": "Patient-stratified 5-fold CV",
        "git_branch": "feature-convnext-pool",
        "git_commit": "023medf239",
        "jira_owner": "Dr. Chen / ML-Vision",
        "hyperparameters": {
            "learning_rate": 0.0002,
            "batch_size": 16,
            "optimizer": "AdamW",
            "weight_decay": 0.05,
            "drop_path": 0.1,
            "top_k_slices": 3
        },
        "preprocessing": {
            "windowing": "Subdural + Brain + Bone",
            "resolution": "512x512",
            "slice_thickness": "5mm",
            "augmentation": "RandomCrop + Affine",
            "normalization": "HU Window Clipping (-20 to 180)",
            "slice_interpolation": "Bicubic 24-slice standard"
        },
        "metrics": {
            "loss": 0.253,
            "accuracy": 0.895,
            "f1_macro": 0.885,
            "precision": 0.825,
            "recall": 0.952,
            "latency_ms": 11.2
        },
        "loss_history": [0.79, 0.61, 0.48, 0.39, 0.33, 0.29, 0.272, 0.260, 0.253],
        "confusion_matrix": {
            "tn": 97,
            "fp": 20,
            "fn": 4,
            "tp": 79,
            "threshold": 0.45,
            "warning": "The false positive rate is higher than your threshold"
        },
        "feature_importance": [
            {"feature": "Focal Slice Max Activation", "importance": 0.42},
            {"feature": "Slices 5-12 (Basal Ganglia)", "importance": 0.34},
            {"feature": "Skull Base Slices (Streak Susceptible)", "importance": 0.26},
            {"feature": "Ventricle Compression", "importance": 0.18},
            {"feature": "Bone Rim Density", "importance": 0.11}
        ],
        "notes": "[SYNTHETIC FIXTURE] ConvNeXt-V2 with Top-3 slice pooling. Catches subtle focal single-slice bleeds, but sensitive to streak artifacts leading to higher false alarm rate.",
        "is_synthetic": True,
        "created_at": "2026-09-20T14:35:00",
        "updated_at": "2026-09-20T15:20:00"
    }

    # 4. Experiment #3: Optimal Slice Pool (Extensible candidate)
    exp_optimal = {
        "id": "exp_optimal_slice_pool",
        "name": "Optimal Slice Attention Pool (Candidate)",
        "model_family": "Attention-Weighted Pooling",
        "architecture": "CoAtNet-2 + Softmax-Attn",
        "aggregation_method": "Attention-Weighted Softmax (tau=0.35)",
        "dataset_name": "RSNA-ICH-Synthetic-24Slice",
        "dataset_split": "Validation Split A (n=200 scans)",
        "dataset_size": "200 scans (4,800 slices)",
        "evaluation_protocol": "Patient-stratified 5-fold CV",
        "git_branch": "exp-attn-pool-v3",
        "git_commit": "c48bb901",
        "jira_owner": "Dr. Chen / ML-Vision",
        "hyperparameters": {
            "learning_rate": 0.00008,
            "batch_size": 16,
            "temperature_tau": 0.35,
            "optimizer": "AdamW",
            "weight_decay": 0.02,
            "dropout": 0.15
        },
        "preprocessing": {
            "windowing": "Subdural + Brain + Bone",
            "resolution": "512x512",
            "slice_thickness": "5mm",
            "augmentation": "RandomCrop + Affine"
        },
        "metrics": {
            "loss": 0.231,
            "accuracy": 0.925,
            "f1_macro": 0.920,
            "precision": 0.912,
            "recall": 0.928,
            "latency_ms": 15.0
        },
        "loss_history": [0.75, 0.58, 0.44, 0.35, 0.30, 0.265, 0.245, 0.236, 0.231],
        "confusion_matrix": {
            "tn": 106,
            "fp": 11,
            "fn": 6,
            "tp": 77,
            "threshold": 0.5
        },
        "feature_importance": [
            {"feature": "Slices 5-12 (Basal Ganglia)", "importance": 0.44},
            {"feature": "Slices 13-18 (Corona Radiata)", "importance": 0.29},
            {"feature": "Slices 1-4 (Skull Base)", "importance": 0.14},
            {"feature": "Ventricle Compression", "importance": 0.13}
        ],
        "notes": "[SYNTHETIC FIXTURE] Temperature-scaled Attention-Weighted aggregator successfully bridges precision and sensitivity.",
        "task_type": "multi_slice_classification",
        "is_synthetic": True,
        "created_at": "2026-09-22T09:10:00",
        "updated_at": "2026-09-22T11:45:00"
    }

    # Set task_type and compute calculated metrics and calibration curves for all seeded benchmarks
    exp_coatnet["task_type"] = "multi_slice_classification"
    calcs_coat = calculate_metrics_from_samples(cases_coatnet, "classification")
    exp_coatnet["calculated_metrics"] = calcs_coat["calculated_metrics"]
    exp_coatnet["calibration_curve"] = calcs_coat["calibration_curve"]

    exp_convnext["task_type"] = "multi_slice_classification"
    calcs_conv = calculate_metrics_from_samples(cases_convnext, "classification")
    exp_convnext["calculated_metrics"] = calcs_conv["calculated_metrics"]
    exp_convnext["calibration_curve"] = calcs_conv["calibration_curve"]

    calcs_opt = calculate_metrics_from_samples(cases_coatnet, "classification")
    exp_optimal["calculated_metrics"] = calcs_opt["calculated_metrics"]
    exp_optimal["calibration_curve"] = calcs_opt["calibration_curve"]

    # Insert into database
    db_insert_experiment(exp_coatnet, cases_coatnet)
    db_insert_experiment(exp_convnext, cases_convnext)
    db_insert_experiment(exp_optimal, cases_coatnet) # Reuse cases for candidate

    # 5. Pre-seed Hypotheses (Matching the UI Mockup!)
    hyp1 = {
        "id": "hyp_001",
        "experiment_id": "exp_convnext_pool",
        "title": "Learning Rate Convergence Hypothesis",
        "rationale": "Decreasing the learning rate will lead to a better convergence of the loss and therefore a higher macro-F1 score on boundary cases.",
        "status": "Validated",
        "created_at": "2026-09-19T14:00:00",
        "tags": ["Optimization", "Hyperparameters", "Loss-Convergence"]
    }

    hyp2 = {
        "id": "hyp_002",
        "experiment_id": "exp_convnext_pool",
        "title": "Attention-Weighted Pooling for Focal Bleed Sensitivity",
        "rationale": "Replacing unweighted Top-K Max pooling with Attention-Weighted Softmax (tau=0.35) will suppress isolated streak artifact false positives while preserving 95%+ sensitivity on true focal single-slice bleeds.",
        "status": "In Progress",
        "created_at": "2026-09-20T16:30:00",
        "tags": ["Aggregation", "Multi-Slice", "False-Positive-Reduction"]
    }

    hyp3 = {
        "id": "hyp_003",
        "experiment_id": "exp_coatnet_consensus",
        "title": "Dynamic Quorum Thresholding",
        "rationale": "Adapting the consensus quorum threshold based on anatomical slice region (lower quorum for skull base, standard quorum for ventricles) can reduce false negatives on micro-hemorrhages.",
        "status": "Draft",
        "created_at": "2026-09-21T11:15:00",
        "tags": ["Consensus", "Anatomical-Prior"]
    }

    db_insert_hypothesis(hyp1)
    db_insert_hypothesis(hyp2)
    db_insert_hypothesis(hyp3)

    print("Successfully seeded synthetic experiment fixtures and hypotheses!")

if __name__ == "__main__":
    from database import init_db
    init_db()
    seed_database()
