import os
import sqlite3
import json
from typing import List, Dict, Any, Optional

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "experimentpilot.db")

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        task_type TEXT DEFAULT 'classification',
        model_family TEXT NOT NULL,
        architecture TEXT NOT NULL,
        aggregation_method TEXT NOT NULL,
        dataset_name TEXT NOT NULL,
        dataset_split TEXT NOT NULL,
        dataset_size TEXT NOT NULL,
        evaluation_protocol TEXT NOT NULL,
        git_branch TEXT,
        git_commit TEXT,
        jira_owner TEXT,
        hyperparameters TEXT,
        preprocessing TEXT,
        metrics TEXT,
        calculated_metrics TEXT,
        loss_history TEXT,
        confusion_matrix TEXT,
        calibration_curve TEXT,
        feature_importance TEXT,
        notes TEXT,
        is_synthetic INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Safe migrations for existing SQLite databases
    cursor.execute("PRAGMA table_info(experiments)")
    columns = [col[1] for col in cursor.fetchall()]
    if "task_type" not in columns:
        cursor.execute("ALTER TABLE experiments ADD COLUMN task_type TEXT DEFAULT 'classification'")
    if "calculated_metrics" not in columns:
        cursor.execute("ALTER TABLE experiments ADD COLUMN calculated_metrics TEXT")
    if "calibration_curve" not in columns:
        cursor.execute("ALTER TABLE experiments ADD COLUMN calibration_curve TEXT")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        true_label INTEGER NOT NULL,
        predicted_label INTEGER NOT NULL,
        probability REAL NOT NULL,
        is_correct INTEGER NOT NULL,
        confidence REAL NOT NULL,
        continuous_true REAL,
        continuous_prediction REAL,
        slices TEXT,
        finding_type TEXT,
        slice_count INTEGER DEFAULT 24,
        metadata TEXT,
        FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """)
    cursor.execute("PRAGMA table_info(case_samples)")
    sample_cols = [col[1] for col in cursor.fetchall()]
    if "continuous_true" not in sample_cols:
        cursor.execute("ALTER TABLE case_samples ADD COLUMN continuous_true REAL")
    if "continuous_prediction" not in sample_cols:
        cursor.execute("ALTER TABLE case_samples ADD COLUMN continuous_prediction REAL")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_exp ON case_samples(experiment_id, case_id)")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hypotheses (
        id TEXT PRIMARY KEY,
        experiment_id TEXT,
        title TEXT NOT NULL,
        rationale TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        tags TEXT
    )
    """)

    conn.commit()
    conn.close()

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Experiments CRUD ---
def db_list_experiments() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, (SELECT COUNT(*) FROM case_samples WHERE experiment_id = e.id) as case_count 
        FROM experiments e ORDER BY e.created_at DESC
    """)
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "name": r["name"],
            "task_type": r["task_type"] if "task_type" in r.keys() and r["task_type"] else "classification",
            "model_family": r["model_family"],
            "architecture": r["architecture"],
            "aggregation_method": r["aggregation_method"],
            "dataset_name": r["dataset_name"],
            "dataset_split": r["dataset_split"],
            "dataset_size": r["dataset_size"],
            "evaluation_protocol": r["evaluation_protocol"],
            "git_branch": r["git_branch"],
            "git_commit": r["git_commit"],
            "jira_owner": r["jira_owner"],
            "hyperparameters": json.loads(r["hyperparameters"] or "{}"),
            "preprocessing": json.loads(r["preprocessing"] or "{}"),
            "metrics": json.loads(r["metrics"] or "{}"),
            "calculated_metrics": json.loads(r["calculated_metrics"]) if ("calculated_metrics" in r.keys() and r["calculated_metrics"]) else None,
            "loss_history": json.loads(r["loss_history"] or "[]"),
            "confusion_matrix": json.loads(r["confusion_matrix"] or "{}"),
            "calibration_curve": json.loads(r["calibration_curve"]) if ("calibration_curve" in r.keys() and r["calibration_curve"]) else None,
            "feature_importance": json.loads(r["feature_importance"] or "[]"),
            "notes": r["notes"],
            "is_synthetic": bool(r["is_synthetic"]),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "case_count": r["case_count"]
        })
    conn.close()
    return results

def db_get_experiment(exp_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, (SELECT COUNT(*) FROM case_samples WHERE experiment_id = e.id) as case_count 
        FROM experiments e WHERE e.id = ?
    """, (exp_id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        return None
    res = {
        "id": r["id"],
        "name": r["name"],
        "task_type": r["task_type"] if "task_type" in r.keys() and r["task_type"] else "classification",
        "model_family": r["model_family"],
        "architecture": r["architecture"],
        "aggregation_method": r["aggregation_method"],
        "dataset_name": r["dataset_name"],
        "dataset_split": r["dataset_split"],
        "dataset_size": r["dataset_size"],
        "evaluation_protocol": r["evaluation_protocol"],
        "git_branch": r["git_branch"],
        "git_commit": r["git_commit"],
        "jira_owner": r["jira_owner"],
        "hyperparameters": json.loads(r["hyperparameters"] or "{}"),
        "preprocessing": json.loads(r["preprocessing"] or "{}"),
        "metrics": json.loads(r["metrics"] or "{}"),
        "calculated_metrics": json.loads(r["calculated_metrics"]) if ("calculated_metrics" in r.keys() and r["calculated_metrics"]) else None,
        "loss_history": json.loads(r["loss_history"] or "[]"),
        "confusion_matrix": json.loads(r["confusion_matrix"] or "{}"),
        "calibration_curve": json.loads(r["calibration_curve"]) if ("calibration_curve" in r.keys() and r["calibration_curve"]) else None,
        "feature_importance": json.loads(r["feature_importance"] or "[]"),
        "notes": r["notes"],
        "is_synthetic": bool(r["is_synthetic"]),
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "case_count": r["case_count"]
    }
    conn.close()
    return res

def db_insert_experiment(data: Dict[str, Any], samples: Optional[List[Dict[str, Any]]] = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO experiments (
            id, name, task_type, model_family, architecture, aggregation_method,
            dataset_name, dataset_split, dataset_size, evaluation_protocol,
            git_branch, git_commit, jira_owner, hyperparameters, preprocessing,
            metrics, calculated_metrics, loss_history, confusion_matrix, calibration_curve,
            feature_importance, notes, is_synthetic, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["id"], data["name"], data.get("task_type", "classification"),
        data["model_family"], data["architecture"], data.get("aggregation_method", "None"),
        data["dataset_name"], data["dataset_split"], data["dataset_size"], data["evaluation_protocol"],
        data.get("git_branch", "main"), data.get("git_commit", "a7e891c"), data.get("jira_owner", "ML-Research"),
        json.dumps(data.get("hyperparameters", {})),
        json.dumps(data.get("preprocessing", {})),
        json.dumps(data.get("metrics", {})),
        json.dumps(data["calculated_metrics"]) if data.get("calculated_metrics") else None,
        json.dumps(data.get("loss_history", [])),
        json.dumps(data.get("confusion_matrix", {})),
        json.dumps(data["calibration_curve"]) if data.get("calibration_curve") else None,
        json.dumps(data.get("feature_importance", [])),
        data.get("notes", ""),
        1 if data.get("is_synthetic", False) else 0,
        data["created_at"], data["updated_at"]
    ))

    if samples is not None:
        # Delete prior samples if updating
        cursor.execute("DELETE FROM case_samples WHERE experiment_id = ?", (data["id"],))
        sample_rows = [
            (
                s["case_id"], data["id"], s.get("true_label", 0), s.get("predicted_label", 0),
                s.get("probability", 0.5), 1 if s.get("is_correct", True) else 0, s.get("confidence", 0.5),
                s.get("continuous_true"), s.get("continuous_prediction"),
                json.dumps(s.get("slices", [])),
                s.get("finding_type", "General Evaluation"),
                s.get("slice_count", len(s.get("slices", []))),
                json.dumps(s.get("metadata", {}))
            )
            for s in samples
        ]
        cursor.executemany("""
            INSERT INTO case_samples (
                case_id, experiment_id, true_label, predicted_label, probability,
                is_correct, confidence, continuous_true, continuous_prediction,
                slices, finding_type, slice_count, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_rows)

    conn.commit()
    conn.close()

def db_delete_experiment(exp_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM case_samples WHERE experiment_id = ?", (exp_id,))
    cursor.execute("DELETE FROM experiments WHERE id = ?", (exp_id,))
    conn.commit()
    conn.close()

def db_get_experiment_samples(exp_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM case_samples WHERE experiment_id = ? ORDER BY case_id ASC", (exp_id,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "case_id": r["case_id"],
            "experiment_id": r["experiment_id"],
            "true_label": r["true_label"],
            "predicted_label": r["predicted_label"],
            "probability": r["probability"],
            "is_correct": bool(r["is_correct"]),
            "confidence": r["confidence"],
            "continuous_true": r["continuous_true"] if "continuous_true" in r.keys() else None,
            "continuous_prediction": r["continuous_prediction"] if "continuous_prediction" in r.keys() else None,
            "slices": json.loads(r["slices"] or "[]"),
            "finding_type": r["finding_type"],
            "slice_count": r["slice_count"],
            "metadata": json.loads(r["metadata"] or "{}")
        })
    conn.close()
    return results

# --- Hypotheses CRUD ---
def db_list_hypotheses() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hypotheses ORDER BY created_at DESC")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "experiment_id": r["experiment_id"],
            "title": r["title"],
            "rationale": r["rationale"],
            "status": r["status"],
            "created_at": r["created_at"],
            "tags": json.loads(r["tags"] or "[]")
        })
    conn.close()
    return results

def db_insert_hypothesis(data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO hypotheses (id, experiment_id, title, rationale, status, created_at, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["id"], data.get("experiment_id"), data["title"], data["rationale"],
        data["status"], data["created_at"], json.dumps(data.get("tags", []))
    ))
    conn.commit()
    conn.close()

def db_update_hypothesis(hyp_id: str, updates: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        if v is not None:
            if k == "tags":
                fields.append("tags = ?")
                values.append(json.dumps(v))
            else:
                fields.append(f"{k} = ?")
                values.append(v)
    if fields:
        values.append(hyp_id)
        cursor.execute(f"UPDATE hypotheses SET {', '.join(fields)} WHERE id = ?", tuple(values))
        conn.commit()
    conn.close()
