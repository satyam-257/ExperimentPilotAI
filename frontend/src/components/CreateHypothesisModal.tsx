import React, { useState, useEffect } from 'react';
import { Experiment, RecommendationItem } from '../types';
import { X, Tag } from 'lucide-react';

interface CreateHypothesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    rationale: string;
    status: string;
    experiment_id?: string;
    tags: string[];
  }) => void;
  prefill?: RecommendationItem | null;
  activeExperimentId?: string;
}

export const CreateHypothesisModal: React.FC<CreateHypothesisModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefill,
  activeExperimentId
}) => {
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [tagsInput, setTagsInput] = useState('Optimization, Aggregation');

  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title);
      setRationale(
        `${prefill.hypothesis_proposal}\n\nControlled Variable: ${prefill.controlled_variable}\nRationale: ${prefill.rationale}`
      );
      setTagsInput('Follow-Up, Aggregation, Controlled-Test');
    } else {
      setTitle('Attention-Weighted Softmax Quorum Hypothesis');
      setRationale(
        'Decreasing the learning rate and introducing temperature-scaled attention pooling will improve convergence of the loss and reduce false alarms on single-slice scanner artifacts.'
      );
    }
  }, [prefill, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rationale) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title,
      rationale,
      status,
      experiment_id: activeExperimentId,
      tags
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} color="#10b981" /> Formulate New Hypothesis
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Hypothesis Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Attention-Weighted Softmax Quorum"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scientific Rationale & Proposed Change</label>
            <textarea
              className="form-textarea"
              rows={5}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Describe what you plan to change and the empirical evidence supporting this expectation..."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Validated">Validated</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Optimization, Slice-Aggregator"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create-hypothesis" style={{ padding: '8px 18px' }}>
              Save Hypothesis <Tag size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
