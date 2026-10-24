import React, { useState } from 'react';
import { X, Plus, Layers } from 'lucide-react';

interface CreateExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CreateExperimentModal: React.FC<CreateExperimentModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('DINOv2 ViT Attention Pool');
  const [taskType, setTaskType] = useState('classification');
  const [modelFamily, setModelFamily] = useState('Vision Transformer');
  const [architecture, setArchitecture] = useState('DINOv2-ViT-B/14');
  const [aggregationMethod, setAggregationMethod] = useState('Attention-Weighted Softmax (tau=0.25)');
  const [datasetName, setDatasetName] = useState('RSNA-ICH-Synthetic-24Slice');
  const [datasetSplit, setDatasetSplit] = useState('Validation Split A (n=200 scans)');
  const [datasetSize, setDatasetSize] = useState('200 scans (4,800 slices)');
  const [evaluationProtocol, setEvaluationProtocol] = useState('Patient-stratified 5-fold CV');
  const [gitBranch, setGitBranch] = useState('exp-dinov2-attn');
  const [gitCommit, setGitCommit] = useState('e58b109');
  const [jiraOwner, setJiraOwner] = useState('ML-Vision-Team');
  const [hyperparamsJson, setHyperparamsJson] = useState('{\n  "learning_rate": 0.00005,\n  "batch_size": 16,\n  "optimizer": "AdamW",\n  "weight_decay": 0.01\n}');
  const [lossVal, setLossVal] = useState('0.224');
  const [accVal, setAccVal] = useState('0.930');
  const [f1Val, setF1Val] = useState('0.925');
  const [precisionVal, setPrecisionVal] = useState('0.915');
  const [recallVal, setRecallVal] = useState('0.936');
  const [latencyVal, setLatencyVal] = useState('18.5');
  const [notes, setNotes] = useState('Pre-trained foundation vision transformer with cross-slice attention aggregation.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedHp = {};
    try {
      if (hyperparamsJson.trim()) {
        parsedHp = JSON.parse(hyperparamsJson);
      }
    } catch {
      parsedHp = { raw_config: hyperparamsJson };
    }

    const payload = {
      name,
      task_type: taskType,
      model_family: modelFamily,
      architecture,
      aggregation_method: aggregationMethod,
      dataset_name: datasetName,
      dataset_split: datasetSplit,
      dataset_size: datasetSize,
      evaluation_protocol: evaluationProtocol,
      git_branch: gitBranch,
      git_commit: gitCommit,
      jira_owner: jiraOwner,
      hyperparameters: parsedHp,
      preprocessing: {
        windowing: 'Brain + Bone + Subdural',
        resolution: '518x518',
        slice_thickness: '5mm'
      },
      metrics: {
        loss: parseFloat(lossVal) || 0.224,
        accuracy: parseFloat(accVal) || 0.93,
        f1_macro: parseFloat(f1Val) || 0.925,
        precision: parseFloat(precisionVal) || 0.915,
        recall: parseFloat(recallVal) || 0.936,
        latency_ms: parseFloat(latencyVal) || 18.5
      },
      loss_history: [0.72, 0.54, 0.41, 0.33, 0.28, 0.25, 0.235, 0.224],
      confusion_matrix: {
        tn: 107,
        fp: 10,
        fn: 5,
        tp: 78
      },
      feature_importance: [
        { feature: 'Slices 5-12 (Basal Ganglia)', importance: 0.45 },
        { feature: 'Slices 13-18 (Corona Radiata)', importance: 0.28 },
        { feature: 'Slices 1-4 (Skull Base)', importance: 0.15 }
      ],
      notes,
      is_synthetic: false
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#06b6d4" /> Record New Experiment Run
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Experiment Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Type</label>
              <select
                className="form-input"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
              >
                <option value="classification">Classification (General)</option>
                <option value="multi_slice_classification">Multi-Slice / Volumetric Vision</option>
                <option value="regression">Regression (Continuous)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Model Family</label>
              <input
                type="text"
                className="form-input"
                value={modelFamily}
                onChange={(e) => setModelFamily(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Architecture / Backbone</label>
              <input
                type="text"
                className="form-input"
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Aggregation / Pooling Strategy</label>
              <input
                type="text"
                className="form-input"
                value={aggregationMethod}
                onChange={(e) => setAggregationMethod(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Dataset Name</label>
              <input
                type="text"
                className="form-input"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Evaluation Protocol</label>
              <input
                type="text"
                className="form-input"
                value={evaluationProtocol}
                onChange={(e) => setEvaluationProtocol(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Loss</label>
              <input
                type="text"
                className="form-input"
                value={lossVal}
                onChange={(e) => setLossVal(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Accuracy (0-1)</label>
              <input
                type="text"
                className="form-input"
                value={accVal}
                onChange={(e) => setAccVal(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Macro-F1 (0-1)</label>
              <input
                type="text"
                className="form-input"
                value={f1Val}
                onChange={(e) => setF1Val(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hyperparameters & Config (Arbitrary JSON)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={hyperparamsJson}
              onChange={(e) => setHyperparamsJson(e.target.value)}
              placeholder='{\n  "learning_rate": 0.001,\n  "batch_size": 32\n}'
            />
          </div>

          <div className="form-group">
            <label className="form-label">Experiment Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} /> Save Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
