import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import (
    ExperimentCreate, ExperimentUpdate, ExperimentResponse,
    CompareRequest, ComparisonResponse,
    InsightRequest, InsightResponse,
    HypothesisCreate, HypothesisUpdate, HypothesisResponse
)
from database import (
    init_db, db_list_experiments, db_get_experiment, db_insert_experiment,
    db_delete_experiment, db_list_hypotheses, db_insert_hypothesis, db_update_hypothesis
)
from analytics import (
    check_compatibility, compute_metrics_comparison, compute_hyperparameter_diff,
    compute_agreement_summary, get_explorer_cases, generate_ai_insights
)
from seed_data import seed_database

app = FastAPI(
    title="ExperimentPilot API",
    description="Backend service for ML experimentation, model comparison, and behavioral inspection.",
    version="1.0.0"
)

frontend_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    exps = db_list_experiments()
    if not exps:
        seed_database()

# --- Health Check ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ExperimentPilot", "version": "1.0.0"}

# --- Experiments Endpoints ---
@app.get("/api/experiments", response_model=List[ExperimentResponse])
def list_experiments():
    return db_list_experiments()

@app.post("/api/experiments", response_model=ExperimentResponse)
def create_experiment(payload: ExperimentCreate):
    exp_id = f"exp_{uuid.uuid4().hex[:8]}"
    now = datetime.now().isoformat()
    data = payload.dict(exclude={"samples"})
    data["id"] = exp_id
    data["created_at"] = now
    data["updated_at"] = now
    data["task_type"] = data.get("task_type", "classification")
    data["aggregation_method"] = data.get("aggregation_method", "None")

    samples_data = [s.dict() for s in payload.samples] if payload.samples else []
    if samples_data:
        from analytics import calculate_metrics_from_samples
        calcs = calculate_metrics_from_samples(samples_data, task_type=data["task_type"])
        data["calculated_metrics"] = calcs.get("calculated_metrics")
        data["calibration_curve"] = calcs.get("calibration_curve")
        if not data.get("confusion_matrix") and calcs.get("confusion_matrix"):
            data["confusion_matrix"] = calcs.get("confusion_matrix")

    db_insert_experiment(data, samples_data)
    
    created = db_get_experiment(exp_id)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create experiment.")
    return created

@app.get("/api/experiments/{exp_id}", response_model=ExperimentResponse)
def get_experiment(exp_id: str):
    exp = db_get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return exp

@app.put("/api/experiments/{exp_id}", response_model=ExperimentResponse)
def update_experiment(exp_id: str, payload: ExperimentUpdate):
    exp = db_get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    
    for k, v in payload.dict(exclude_unset=True).items():
        if v is not None:
            exp[k] = v
    exp["updated_at"] = datetime.now().isoformat()
    db_insert_experiment(exp)
    return db_get_experiment(exp_id)

@app.delete("/api/experiments/{exp_id}")
def delete_experiment(exp_id: str):
    exp = db_get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    db_delete_experiment(exp_id)
    return {"status": "success", "deleted_id": exp_id}

# --- Comparison Endpoint ---
@app.post("/api/compare", response_model=ComparisonResponse)
def compare_experiments(payload: CompareRequest):
    exp_a = db_get_experiment(payload.experiment_a_id)
    exp_b = db_get_experiment(payload.experiment_b_id)
    if not exp_a or not exp_b:
        raise HTTPException(status_code=404, detail="One or both experiments not found.")
    
    compat = check_compatibility(exp_a, exp_b)
    comp_metrics = compute_metrics_comparison(exp_a.get("metrics", {}), exp_b.get("metrics", {}))
    hp_diff = compute_hyperparameter_diff(exp_a.get("hyperparameters", {}), exp_b.get("hyperparameters", {}))
    
    from database import db_get_experiment_samples
    samples_a = db_get_experiment_samples(exp_a["id"])
    samples_b = db_get_experiment_samples(exp_b["id"])
    agreement = compute_agreement_summary(samples_a, samples_b)

    return {
        "experiment_a": exp_a,
        "experiment_b": exp_b,
        "compatibility": compat,
        "metrics_comparison": comp_metrics,
        "hyperparameter_diff": hp_diff,
        "agreement_summary": agreement
    }

# --- Model Behavior Explorer Endpoint ---
@app.get("/api/explorer/cases")
def explorer_cases(
    exp_a_id: str = Query(...),
    exp_b_id: str = Query(...),
    filter_type: str = Query("all"),
    search: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(50)
):
    try:
        return get_explorer_cases(
            exp_a_id=exp_a_id,
            exp_b_id=exp_b_id,
            filter_type=filter_type,
            search=search,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AI & Deterministic Insights Endpoint ---
@app.post("/api/insights/generate", response_model=InsightResponse)
async def generate_insights(payload: InsightRequest):
    try:
        return await generate_ai_insights(
            exp_a_id=payload.experiment_a_id,
            exp_b_id=payload.experiment_b_id,
            provider=payload.provider or "deterministic",
            api_key=payload.api_key
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Hypotheses Endpoints ---
@app.get("/api/hypotheses", response_model=List[HypothesisResponse])
def list_hypotheses():
    return db_list_hypotheses()

@app.post("/api/hypotheses", response_model=HypothesisResponse)
def create_hypothesis(payload: HypothesisCreate):
    hyp_id = f"hyp_{uuid.uuid4().hex[:6]}"
    now = datetime.now().isoformat()
    data = {
        "id": hyp_id,
        "experiment_id": payload.experiment_id,
        "title": payload.title,
        "rationale": payload.rationale,
        "status": payload.status,
        "created_at": now,
        "tags": payload.tags
    }
    db_insert_hypothesis(data)
    return data

@app.patch("/api/hypotheses/{hyp_id}")
def update_hypothesis_status(hyp_id: str, payload: HypothesisUpdate):
    db_update_hypothesis(hyp_id, payload.dict(exclude_unset=True))
    return {"status": "success", "id": hyp_id}

# --- Import and Export ---
@app.post("/api/import")
def import_experiment(payload: Dict[str, Any]):
    # Support versioned wrapper: {"version": "1.0", "experiment": {...}}
    if "experiment" in payload and isinstance(payload["experiment"], dict):
        schema_version = payload.get("version", "1.0")
        exp_data = dict(payload["experiment"])
    else:
        exp_data = dict(payload)
        schema_version = exp_data.get("schema_version", "1.0")

    # Validate required fields
    required = ["name", "model_family", "architecture", "dataset_name", "dataset_split", "dataset_size", "evaluation_protocol"]
    for r in required:
        if r not in exp_data or not exp_data[r]:
            raise HTTPException(status_code=400, detail=f"Validation Error: Missing required field '{r}' in imported JSON.")

    exp_id = exp_data.get("id") or f"exp_imp_{uuid.uuid4().hex[:6]}"
    now = datetime.now().isoformat()
    exp_data["id"] = exp_id
    exp_data["created_at"] = exp_data.get("created_at") or now
    exp_data["updated_at"] = now
    exp_data["is_synthetic"] = exp_data.get("is_synthetic", False)
    exp_data["task_type"] = exp_data.get("task_type", "classification")
    exp_data["aggregation_method"] = exp_data.get("aggregation_method", "None")

    samples = exp_data.pop("samples", [])
    if len(samples) > 10000:
        raise HTTPException(status_code=400, detail="Row limit exceeded: Maximum 10,000 samples permitted per import.")

    # Independently compute verification metrics if samples exist
    if samples:
        from analytics import calculate_metrics_from_samples
        calcs = calculate_metrics_from_samples(samples, task_type=exp_data["task_type"])
        exp_data["calculated_metrics"] = calcs.get("calculated_metrics")
        exp_data["calibration_curve"] = calcs.get("calibration_curve")
        if not exp_data.get("confusion_matrix") and calcs.get("confusion_matrix"):
            exp_data["confusion_matrix"] = calcs.get("confusion_matrix")

    db_insert_experiment(exp_data, samples)
    created = db_get_experiment(exp_id)
    return {
        "status": "success",
        "schema_version": schema_version,
        "imported_id": exp_id,
        "sample_count": len(samples),
        "experiment": created
    }

class CSVImportPayload(BaseModel):
    name: str
    csv_text: str
    task_type: Optional[str] = "classification"
    model_family: Optional[str] = "Imported Family"
    architecture: Optional[str] = "Custom Architecture"
    aggregation_method: Optional[str] = "None"
    dataset_name: Optional[str] = "Imported CSV Dataset"
    dataset_split: Optional[str] = "Test Split"
    dataset_size: Optional[str] = "N/A"
    evaluation_protocol: Optional[str] = "Standard Evaluation"
    hyperparameters: Optional[Dict[str, Any]] = None
    notes: Optional[str] = ""

@app.post("/api/import/csv")
def import_experiment_csv(payload: CSVImportPayload):
    import csv
    import io

    if not payload.csv_text.strip():
        raise HTTPException(status_code=400, detail="CSV Error: Uploaded CSV content is empty.")

    f = io.StringIO(payload.csv_text.strip())
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV Error: No header row detected.")

    fieldnames = [col.strip().lower() for col in reader.fieldnames]

    # Check headers
    if payload.task_type == "regression":
        if "continuous_true" not in fieldnames or "continuous_prediction" not in fieldnames:
            raise HTTPException(
                status_code=400,
                detail="CSV Error: Regression requires 'continuous_true' and 'continuous_prediction' columns."
            )
    else:
        if "true_label" not in fieldnames or "predicted_label" not in fieldnames:
            raise HTTPException(
                status_code=400,
                detail="CSV Error: Classification requires 'true_label' and 'predicted_label' columns."
            )

    samples = []
    row_count = 0
    for idx, row in enumerate(reader):
        row_count += 1
        if row_count > 10000:
            raise HTTPException(status_code=400, detail="Row limit exceeded: Maximum 10,000 samples permitted per CSV import.")

        # Clean row keys
        clean_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items()}
        cid = clean_row.get("case_id") or f"SAMPLE-{idx + 1:04d}"

        try:
            if payload.task_type == "regression":
                yt = float(clean_row["continuous_true"])
                yp = float(clean_row["continuous_prediction"])
                samples.append({
                    "case_id": cid,
                    "true_label": 0,
                    "predicted_label": 0,
                    "continuous_true": yt,
                    "continuous_prediction": yp,
                    "probability": 0.5,
                    "confidence": 0.5,
                    "is_correct": abs(yp - yt) < 0.05,
                    "finding_type": clean_row.get("finding_type", "Regression Target"),
                    "slices": []
                })
            else:
                y_true = int(float(clean_row["true_label"]))
                y_pred = int(float(clean_row["predicted_label"]))
                prob = float(clean_row.get("probability") or (0.9 if y_pred == 1 else 0.1))
                conf = float(clean_row.get("confidence") or prob)
                samples.append({
                    "case_id": cid,
                    "true_label": y_true,
                    "predicted_label": y_pred,
                    "probability": prob,
                    "confidence": conf,
                    "is_correct": (y_true == y_pred),
                    "finding_type": clean_row.get("finding_type", "Imported Sample"),
                    "slices": []
                })
        except (ValueError, KeyError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"CSV Parsing Error on row {idx + 1}: Malformed values ({str(e)})."
            )

    if not samples:
        raise HTTPException(status_code=400, detail="CSV Error: No valid data rows found.")

    from analytics import calculate_metrics_from_samples
    calcs = calculate_metrics_from_samples(samples, task_type=payload.task_type)

    exp_id = f"exp_csv_{uuid.uuid4().hex[:6]}"
    now = datetime.now().isoformat()
    exp_record = {
        "id": exp_id,
        "name": payload.name,
        "task_type": payload.task_type,
        "model_family": payload.model_family,
        "architecture": payload.architecture,
        "aggregation_method": payload.aggregation_method,
        "dataset_name": payload.dataset_name,
        "dataset_split": payload.dataset_split,
        "dataset_size": f"{len(samples)} samples" if payload.dataset_size == "N/A" else payload.dataset_size,
        "evaluation_protocol": payload.evaluation_protocol,
        "git_branch": "import-csv",
        "git_commit": "csv-ingest",
        "jira_owner": "CSV-User",
        "hyperparameters": payload.hyperparameters or {},
        "preprocessing": {"source": "CSV Upload", "rows": len(samples)},
        "metrics": calcs.get("calculated_metrics", {}),
        "calculated_metrics": calcs.get("calculated_metrics", {}),
        "loss_history": [],
        "confusion_matrix": calcs.get("confusion_matrix", {}),
        "calibration_curve": calcs.get("calibration_curve", []),
        "feature_importance": [],
        "notes": payload.notes or "Imported via CSV",
        "is_synthetic": False,
        "created_at": now,
        "updated_at": now
    }

    db_insert_experiment(exp_record, samples)
    created = db_get_experiment(exp_id)
    return {
        "status": "success",
        "imported_id": exp_id,
        "sample_count": len(samples),
        "calculated_metrics": calcs.get("calculated_metrics"),
        "experiment": created
    }

@app.get("/api/export/{exp_id}")
def export_experiment(exp_id: str):
    exp = db_get_experiment(exp_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    from database import db_get_experiment_samples
    samples = db_get_experiment_samples(exp_id)
    exp["samples"] = samples
    # Wrap in versioned export format
    return {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "experiment": exp
    }

# --- Seed Benchmark Endpoint ---
@app.post("/api/seed")
def reseed_benchmarks():
    seed_database(force=True)
    return {"status": "success", "message": "Synthetic fixtures and benchmark data restored."}
