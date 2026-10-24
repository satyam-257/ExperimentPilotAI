from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Slice and Case Prediction Models ---
class SlicePrediction(BaseModel):
    slice_index: int
    probability: float
    predicted_label: int
    is_focal_ground_truth: bool

class CaseSample(BaseModel):
    case_id: str
    experiment_id: str
    true_label: int = 0  # 0 = Negative, 1 = Positive (or integer class)
    predicted_label: int = 0
    probability: float = 0.5
    is_correct: bool = True
    confidence: float = 0.5
    continuous_true: Optional[float] = None       # For regression tasks
    continuous_prediction: Optional[float] = None # For regression tasks
    slices: Optional[List[SlicePrediction]] = None
    finding_type: Optional[str] = "General Evaluation"
    slice_count: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"

# --- Experiment Models ---
class ExperimentBase(BaseModel):
    name: str
    task_type: Optional[str] = "classification"  # "classification", "regression", "multi_slice_classification"
    model_family: str  # e.g., "Hybrid Transformer-CNN", "ConvNet", "Vision Transformer", "Ensemble", "Gradient Boosted Trees"
    architecture: str  # e.g., "CoAtNet-2", "ConvNeXt-V2-Base", "DINOv2-ViT", "XGBoost"
    aggregation_method: Optional[str] = "None"  # e.g., "Consensus Voting (t=0.6)", "Max Pooling", "Mean Pooling", "None"
    dataset_name: str
    dataset_split: str
    dataset_size: str
    evaluation_protocol: str  # e.g., "Patient-stratified 5-fold CV", "Holdout Test"
    git_branch: Optional[str] = "main"
    git_commit: Optional[str] = "a7e891c"
    jira_owner: Optional[str] = "ML-Research"
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    preprocessing: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, float] = Field(default_factory=dict)  # User-imported/reported metrics
    calculated_metrics: Optional[Dict[str, float]] = None    # Independently computed verification metrics (ECE, accuracy, per-class F1, etc.)
    loss_history: List[float] = Field(default_factory=list)
    confusion_matrix: Dict[str, Any] = Field(default_factory=dict)  # {"tn": 105, "fp": 15, "fn": 8, "tp": 72}
    calibration_curve: Optional[List[Dict[str, Any]]] = None # Reliability diagram bins
    feature_importance: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = ""
    is_synthetic: bool = False

    class Config:
        extra = "allow"

class ExperimentCreate(ExperimentBase):
    samples: Optional[List[CaseSample]] = None

class VersionedExperimentImport(BaseModel):
    version: str = "1.0"
    experiment: ExperimentCreate

class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    preprocessing: Optional[Dict[str, Any]] = None
    aggregation_method: Optional[str] = None

class ExperimentResponse(ExperimentBase):
    id: str
    created_at: str
    updated_at: str
    case_count: int = 0

# --- Comparison Models ---
class CompareRequest(BaseModel):
    experiment_a_id: str
    experiment_b_id: str

class MetricDelta(BaseModel):
    metric_name: str
    val_a: float
    val_b: float
    delta: float
    percent_change: float
    better_model: Optional[str] = None

class CompatibilityCheck(BaseModel):
    is_compatible: bool
    reasons: List[str]
    warnings: List[str]

class ComparisonResponse(BaseModel):
    experiment_a: ExperimentResponse
    experiment_b: ExperimentResponse
    compatibility: CompatibilityCheck
    metrics_comparison: List[MetricDelta]
    hyperparameter_diff: Dict[str, Dict[str, Any]]
    agreement_summary: Dict[str, Any]

# --- Behavior Explorer Filter Models ---
class ExplorerFilter(BaseModel):
    experiment_a_id: str
    experiment_b_id: str
    filter_type: str = "all"  # "all", "mutual_correct", "disagreement", "both_error", "a_only_correct", "b_only_correct", "fp", "fn"
    search: Optional[str] = None
    page: int = 1
    page_size: int = 50

# --- AI Insights & Hypothesis Models ---
class InsightRequest(BaseModel):
    experiment_a_id: str
    experiment_b_id: str
    api_key: Optional[str] = None
    provider: Optional[str] = "deterministic"  # "deterministic", "openai", "gemini"

class FindingItem(BaseModel):
    category: str  # "Measured Finding", "Failure Trade-off", "Slice Behavior"
    title: str
    description: str
    evidence: str
    confidence_level: str  # "High", "Medium"

class RecommendationItem(BaseModel):
    title: str
    hypothesis_proposal: str
    controlled_variable: str
    rationale: str
    expected_impact: str

class InsightResponse(BaseModel):
    provider_used: str
    summary: str
    findings: List[FindingItem]
    recommendations: List[RecommendationItem]
    discrepancy_stats: Dict[str, Any]

class HypothesisCreate(BaseModel):
    experiment_id: Optional[str] = None
    title: str
    rationale: str
    status: str = "Draft"  # "Draft", "In Progress", "Validated", "Rejected"
    tags: List[str] = Field(default_factory=list)

class HypothesisUpdate(BaseModel):
    title: Optional[str] = None
    rationale: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

class HypothesisResponse(BaseModel):
    id: str
    experiment_id: Optional[str] = None
    title: str
    rationale: str
    status: str
    created_at: str
    tags: List[str]
