export interface SlicePrediction {
  slice_index: number;
  probability: number;
  predicted_label: number;
  is_focal_ground_truth: boolean;
}

export interface CalibrationBin {
  bin_index: number;
  bin_center: number;
  confidence: number;
  accuracy: number;
  count: number;
}

export interface CaseSample {
  case_id: string;
  experiment_id: string;
  true_label: number;
  predicted_label: number;
  probability: number;
  is_correct: boolean;
  confidence: number;
  continuous_true?: number;
  continuous_prediction?: number;
  slices?: SlicePrediction[];
  finding_type?: string;
  slice_count?: number;
  metadata?: Record<string, any>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  threshold?: number;
  warning?: string;
}

export interface Experiment {
  id: string;
  name: string;
  task_type?: string;
  model_family: string;
  architecture: string;
  aggregation_method: string;
  dataset_name: string;
  dataset_split: string;
  dataset_size: string;
  evaluation_protocol: string;
  git_branch?: string;
  git_commit?: string;
  jira_owner?: string;
  hyperparameters: Record<string, any>;
  preprocessing: Record<string, any>;
  metrics: Record<string, number>;
  calculated_metrics?: Record<string, number>;
  loss_history: number[];
  confusion_matrix: ConfusionMatrix;
  calibration_curve?: CalibrationBin[];
  feature_importance?: FeatureImportance[];
  notes?: string;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
  case_count: number;
}

export interface CSVImportPayload {
  name: string;
  csv_text: string;
  task_type?: string;
  model_family?: string;
  architecture?: string;
  aggregation_method?: string;
  dataset_name?: string;
  dataset_split?: string;
  dataset_size?: string;
  evaluation_protocol?: string;
  hyperparameters?: Record<string, any>;
  notes?: string;
}

export interface MetricDelta {
  metric_name: string;
  val_a: number;
  val_b: number;
  delta: number;
  percent_change: number;
  better_model?: 'A' | 'B' | null;
}

export interface CompatibilityCheck {
  is_compatible: boolean;
  reasons: string[];
  warnings: string[];
}

export interface AgreementSummary {
  matched_cases: number;
  mutual_correct: number;
  both_incorrect: number;
  a_only_correct: number;
  b_only_correct: number;
  total_disagreements: number;
  disagreement_rate: number;
  fp_a: number;
  fn_a: number;
  fp_b: number;
  fn_b: number;
  focal_slice_disagreements: number;
}

export interface ComparisonResponse {
  experiment_a: Experiment;
  experiment_b: Experiment;
  compatibility: CompatibilityCheck;
  metrics_comparison: MetricDelta[];
  hyperparameter_diff: Record<string, { val_a: any; val_b: any; is_different: boolean }>;
  agreement_summary: AgreementSummary;
}

export interface ExplorerCaseItem {
  case_id: string;
  true_label: number;
  label_name: string;
  finding_type: string;
  slice_count: number;
  continuous_true?: number | null;
  continuous_prediction_a?: number | null;
  continuous_prediction_b?: number | null;
  model_a: {
    predicted_label: number;
    probability: number;
    confidence: number;
    is_correct: boolean;
    slices?: SlicePrediction[];
    continuous_prediction?: number | null;
  };
  model_b: {
    predicted_label: number;
    probability: number;
    confidence: number;
    is_correct: boolean;
    slices?: SlicePrediction[];
    continuous_prediction?: number | null;
  };
  bucket: string;
  is_disagreement: boolean;
}

export interface ExplorerResponse {
  total_count: number;
  page: number;
  page_size: number;
  items: ExplorerCaseItem[];
}

export interface FindingItem {
  category: string;
  title: string;
  description: string;
  evidence: string;
  confidence_level: string;
}

export interface RecommendationItem {
  title: string;
  hypothesis_proposal: string;
  controlled_variable: string;
  rationale: string;
  expected_impact: string;
}

export interface InsightResponse {
  provider_used: string;
  summary: string;
  findings: FindingItem[];
  recommendations: RecommendationItem[];
  discrepancy_stats: Record<string, any>;
}

export interface Hypothesis {
  id: string;
  experiment_id?: string;
  title: string;
  rationale: string;
  status: 'Draft' | 'In Progress' | 'Validated' | 'Rejected';
  created_at: string;
  tags: string[];
}
