import os
import sys
import json
from fastapi.testclient import TestClient

def run_tests():
    from database import init_db, db_list_experiments, db_get_experiment, db_get_experiment_samples, db_list_hypotheses
    from seed_data import seed_database
    from analytics import (
        check_compatibility, compute_metrics_comparison, run_deterministic_analysis,
        get_explorer_cases, calculate_metrics_from_samples
    )
    from main import app

    client = TestClient(app)

    print("--- 1. Initializing and Seeding Database ---")
    init_db()
    seed_database()

    exps = db_list_experiments()
    print(f"Recorded experiments count: {len(exps)}")
    assert len(exps) >= 3, "Expected at least 3 seeded experiments"

    exp1 = db_get_experiment("exp_coatnet_consensus")
    exp2 = db_get_experiment("exp_convnext_pool")
    assert exp1 is not None and exp2 is not None, "Failed to retrieve seeded experiments"
    assert exp1.get("task_type") == "multi_slice_classification"
    assert exp1.get("calculated_metrics") is not None
    assert exp1.get("calibration_curve") is not None
    print(f"Verified seeded experiment #1 calculated metrics: {exp1['calculated_metrics']}")

    # --- 2. Metric Calculations: Classification & Calibration (ECE) ---
    print("\n--- 2. Testing Classification & ECE Metric Calculations ---")
    synthetic_samples = [
        {"case_id": "c1", "true_label": 1, "predicted_label": 1, "probability": 0.9, "confidence": 0.9, "is_correct": True},
        {"case_id": "c2", "true_label": 1, "predicted_label": 1, "probability": 0.8, "confidence": 0.8, "is_correct": True},
        {"case_id": "c3", "true_label": 0, "predicted_label": 0, "probability": 0.1, "confidence": 0.9, "is_correct": True},
        {"case_id": "c4", "true_label": 0, "predicted_label": 1, "probability": 0.7, "confidence": 0.7, "is_correct": False},
        {"case_id": "c5", "true_label": 1, "predicted_label": 0, "probability": 0.4, "confidence": 0.6, "is_correct": False},
    ]
    calcs = calculate_metrics_from_samples(synthetic_samples, "classification")
    cm = calcs["confusion_matrix"]
    m = calcs["calculated_metrics"]
    curve = calcs["calibration_curve"]
    assert cm["tp"] == 2 and cm["tn"] == 1 and cm["fp"] == 1 and cm["fn"] == 1
    assert m["accuracy"] == 0.6
    assert "ece" in m
    assert len(curve) == 10
    print(f"Classification calculations verified: accuracy={m['accuracy']}, ECE={m['ece']}, CM={cm}")

    # --- 3. Metric Calculations: Regression ---
    print("\n--- 3. Testing Regression Metric Calculations ---")
    reg_samples = [
        {"case_id": "r1", "continuous_true": 10.0, "continuous_prediction": 12.0},
        {"case_id": "r2", "continuous_true": 20.0, "continuous_prediction": 19.0},
        {"case_id": "r3", "continuous_true": 30.0, "continuous_prediction": 31.0},
        {"case_id": "r4", "continuous_true": 40.0, "continuous_prediction": 38.0},
    ]
    reg_calcs = calculate_metrics_from_samples(reg_samples, "regression")
    rm = reg_calcs["calculated_metrics"]
    assert rm["mae"] == 1.5, f"Expected MAE 1.5, got {rm['mae']}"
    assert rm["mse"] == 2.5, f"Expected MSE 2.5, got {rm['mse']}"
    assert rm["r2_score"] > 0.9
    print(f"Regression calculations verified: MAE={rm['mae']}, MSE={rm['mse']}, R2={rm['r2_score']}")

    # --- 4. Compatibility Guardrails ---
    print("\n--- 4. Testing Compatibility Guardrails ---")
    # Same dataset & split -> compatible
    compat = check_compatibility(exp1, exp2)
    assert compat["is_compatible"] is True, "Expected CoAtNet and ConvNeXt to be compatible"

    # Mismatched dataset
    mismatch_exp = dict(exp2)
    mismatch_exp["dataset_name"] = "Other-Dataset"
    compat_bad_ds = check_compatibility(exp1, mismatch_exp)
    assert compat_bad_ds["is_compatible"] is False
    assert any("Dataset mismatch" in r for r in compat_bad_ds["reasons"])
    print("Dataset mismatch correctly blocked.")

    # Mismatched task type
    reg_exp = dict(exp1)
    reg_exp["task_type"] = "regression"
    compat_bad_type = check_compatibility(exp1, reg_exp)
    assert compat_bad_type["is_compatible"] is False
    assert any("Task type mismatch" in r for r in compat_bad_type["reasons"])
    print("Task type mismatch correctly blocked.")

    # --- 5. Data Ingestion: Versioned JSON Import ---
    print("\n--- 5. Testing Versioned JSON Import ---")
    versioned_payload = {
        "version": "1.0",
        "experiment": {
            "name": "Custom XGBoost Tabular",
            "task_type": "classification",
            "model_family": "Gradient Boosted Trees",
            "architecture": "XGBoost-v2",
            "aggregation_method": "None",
            "dataset_name": "CreditRisk-2026",
            "dataset_split": "Holdout Test",
            "dataset_size": "5,000 records",
            "evaluation_protocol": "Stratified K-Fold",
            "hyperparameters": {
                "max_depth": 6,
                "learning_rate": 0.05,
                "arbitrary_custom_param": "special_token_42"
            },
            "metrics": {"accuracy": 0.88, "f1_macro": 0.86},
            "samples": [
                {"case_id": "USER-001", "true_label": 1, "predicted_label": 1, "probability": 0.85, "confidence": 0.85, "is_correct": True},
                {"case_id": "USER-002", "true_label": 0, "predicted_label": 0, "probability": 0.12, "confidence": 0.88, "is_correct": True}
            ]
        }
    }
    resp = client.post("/api/import", json=versioned_payload)
    assert resp.status_code == 200, f"Import failed: {resp.text}"
    imp_res = resp.json()
    assert imp_res["status"] == "success"
    assert imp_res["schema_version"] == "1.0"
    created_imp = db_get_experiment(imp_res["imported_id"])
    assert created_imp is not None
    assert created_imp["hyperparameters"].get("arbitrary_custom_param") == "special_token_42"
    print("Versioned JSON import & arbitrary key preservation verified.")

    # Reject missing required fields
    invalid_json = {"name": "Incomplete Exp"}
    bad_resp = client.post("/api/import", json=invalid_json)
    assert bad_resp.status_code == 400
    print("Malformed JSON rejection verified.")

    # --- 6. Data Ingestion: CSV Import ---
    print("\n--- 6. Testing CSV Import ---")
    csv_content = """case_id,true_label,predicted_label,probability,confidence
CASE-A01,1,1,0.92,0.92
CASE-A02,0,0,0.05,0.95
CASE-A03,1,0,0.35,0.65
CASE-A04,0,1,0.78,0.78
"""
    csv_payload = {
        "name": "CSV Ingested Run",
        "csv_text": csv_content,
        "task_type": "classification",
        "model_family": "CSV Model",
        "architecture": "CustomNet",
        "dataset_name": "CSV-Benchmark",
        "dataset_split": "Test",
        "dataset_size": "4 cases",
        "evaluation_protocol": "Holdout"
    }
    resp_csv = client.post("/api/import/csv", json=csv_payload)
    assert resp_csv.status_code == 200, f"CSV import failed: {resp_csv.text}"
    csv_res = resp_csv.json()
    assert csv_res["sample_count"] == 4
    assert csv_res["calculated_metrics"]["accuracy"] == 0.5
    print("CSV import for classification verified.")

    # Reject malformed CSV
    bad_csv_payload = {
        "name": "Bad CSV",
        "csv_text": "random_col1,random_col2\nfoo,bar\n",
        "task_type": "classification"
    }
    bad_csv_resp = client.post("/api/import/csv", json=bad_csv_payload)
    assert bad_csv_resp.status_code == 400
    print("Malformed CSV rejection verified.")

    # --- 7. Full Comparison & Behavior Explorer Endpoints ---
    print("\n--- 7. Testing Comparison and Behavior Explorer Endpoints ---")
    comp_resp = client.post("/api/compare", json={
        "experiment_a_id": "exp_coatnet_consensus",
        "experiment_b_id": "exp_convnext_pool"
    })
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert len(comp_data["metrics_comparison"]) > 0
    assert len(comp_data["hyperparameter_diff"]) > 0
    assert comp_data["agreement_summary"]["matched_cases"] == 200

    explorer_resp = client.get("/api/explorer/cases?exp_a_id=exp_coatnet_consensus&exp_b_id=exp_convnext_pool&filter_type=disagreement")
    assert explorer_resp.status_code == 200
    exp_cases = explorer_resp.json()
    assert exp_cases["total_count"] > 0
    print(f"Comparison and explorer endpoints verified (Found {exp_cases['total_count']} disagreement cases).")

    # Non-medical tabular case exploration verification
    tab_exp_id = imp_res["imported_id"]
    tab_explorer_resp = client.get(f"/api/explorer/cases?exp_a_id={tab_exp_id}&exp_b_id={tab_exp_id}&filter_type=all")
    assert tab_explorer_resp.status_code == 200
    tab_cases = tab_explorer_resp.json()
    assert tab_cases["total_count"] == 2
    assert len(tab_cases["items"][0]["model_a"]["slices"]) == 0
    assert tab_cases["items"][0]["slice_count"] == 0, f"Expected 0 slices for tabular, got {tab_cases['items'][0]['slice_count']}"
    assert "Hemorrhage" not in tab_cases["items"][0]["label_name"]
    assert "Normal" not in tab_cases["items"][0]["label_name"]
    assert "Hemorrhage" not in tab_cases["items"][0]["finding_type"]
    print("Non-medical tabular case explorer verified (handles zero slices cleanly without CT text).")

    # Non-medical insights verification (must not contain CT/skull-base artifacts)
    tab_insights_resp = client.post("/api/insights/generate", json={
        "experiment_a_id": tab_exp_id,
        "experiment_b_id": tab_exp_id,
        "provider": "deterministic"
    })
    assert tab_insights_resp.status_code == 200
    tab_ins = tab_insights_resp.json()
    ins_str = json.dumps(tab_ins).lower()
    assert "skull" not in ins_str, "Found medical 'skull' reference in generic tabular insights!"
    assert "streak artifact" not in ins_str, "Found medical 'streak artifact' in generic tabular insights!"
    print("Non-medical insights verified (cleanly excludes CT-specific references).")

    # --- 8. Deterministic Fallback & AI Insights ---
    print("\n--- 8. Testing Deterministic ML Insights Engine ---")
    insight_resp = client.post("/api/insights/generate", json={
        "experiment_a_id": "exp_coatnet_consensus",
        "experiment_b_id": "exp_convnext_pool",
        "provider": "deterministic"
    })
    assert insight_resp.status_code == 200
    ins_data = insight_resp.json()
    assert len(ins_data["findings"]) >= 2
    assert len(ins_data["recommendations"]) >= 2
    assert "discrepancy_stats" in ins_data
    print("Deterministic ML insights engine verified.")

    # --- 9. Testing LLM Provider Fallback Resilience ---
    print("\n--- 9. Testing LLM Provider Fallback (Gemini & OpenAI) ---")
    # Requesting gemini without key or invalid key should gracefully fallback to deterministic engine
    gemini_resp = client.post("/api/insights/generate", json={
        "experiment_a_id": "exp_coatnet_consensus",
        "experiment_b_id": "exp_convnext_pool",
        "provider": "gemini",
        "api_key": "invalid_test_key"
    })
    assert gemini_resp.status_code == 200, f"Expected 200 fallback, got {gemini_resp.status_code}"
    gem_data = gemini_resp.json()
    assert len(gem_data["findings"]) >= 2
    assert "Fallback" in gem_data["provider_used"] or "Deterministic" in gem_data["provider_used"]
    print(f"Gemini fallback verified: provider_used='{gem_data['provider_used']}'")

    openai_resp = client.post("/api/insights/generate", json={
        "experiment_a_id": "exp_coatnet_consensus",
        "experiment_b_id": "exp_convnext_pool",
        "provider": "openai",
        "api_key": "invalid_test_key"
    })
    assert openai_resp.status_code == 200
    oa_data = openai_resp.json()
    assert len(oa_data["findings"]) >= 2
    assert "Fallback" in oa_data["provider_used"] or "Deterministic" in oa_data["provider_used"]
    print(f"OpenAI fallback verified: provider_used='{oa_data['provider_used']}'")

    print("\n=======================================================")
    print("  ALL 9 BACKEND TEST SUITES COMPLETED AND VERIFIED!    ")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
