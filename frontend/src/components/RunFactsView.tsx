import React, { useState } from 'react';
import { Experiment } from '../types';
import { HelpCircle, AlertTriangle, Tag, Users, ChevronDown } from 'lucide-react';

interface RunFactsViewProps {
  experiment: Experiment;
  allExperiments: Experiment[];
  onSelectExperiment: (exp: Experiment) => void;
  onOpenCreateHypothesis: () => void;
  onNavigateTab: (tab: 'Run Facts' | 'Demo Space' | 'Analysis') => void;
  activeTab: 'Run Facts' | 'Demo Space' | 'Analysis';
}

export const RunFactsView: React.FC<RunFactsViewProps> = ({
  experiment,
  allExperiments,
  onSelectExperiment,
  onOpenCreateHypothesis,
  onNavigateTab,
  activeTab
}) => {
  const [showWarningTooltip, setShowWarningTooltip] = useState(true);

  // Parse loss number
  const rawLoss = experiment.metrics?.loss ?? 0.253;
  const displayLoss = rawLoss < 1 ? Math.round(rawLoss * 1000) : rawLoss;

  // Feature / slice importance items
  const features = experiment.feature_importance || [
    { feature: 'Age', importance: 0.14 },
    { feature: 'Sex', importance: 0.39 },
    { feature: 'Savings', importance: 0.24 },
    { feature: 'Credit History', importance: 0.12 },
    { feature: 'Personal Status', importance: 0.19 },
    { feature: 'Employment', importance: 0.08 },
    { feature: 'Housing', importance: 0.05 },
    { feature: 'Credit Amount', importance: 0.38 }
  ];

  // Confusion matrix values
  const cm = experiment.confusion_matrix || { tn: 97, fp: 20, fn: 4, tp: 79 };
  const totalCases = (cm.tn + cm.fp + cm.fn + cm.tp) || 1;
  const tnRate = (cm.tn / (cm.tn + cm.fp)).toFixed(1);
  const fpRate = (cm.fp / (cm.tn + cm.fp)).toFixed(1);
  const fnRate = (cm.fn / (cm.fn + cm.tp)).toFixed(1);
  const tpRate = (cm.tp / (cm.fn + cm.tp)).toFixed(1);

  return (
    <div className="main-workspace">
      {/* Header matching the reference UI */}
      <div className="workspace-header">
        <div className="workspace-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1>
              {experiment.id === 'exp_convnext_pool' ? 'Experiment #2' : experiment.name}
            </h1>
            {/* Synthetic vs User Run Badge */}
            {experiment.is_synthetic ? (
              <span
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#fda4af',
                  border: '1px solid #f43f5e',
                  padding: '3px 9px',
                  borderRadius: 14,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em'
                }}
              >
                [SYNTHETIC FIXTURE]
              </span>
            ) : (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  border: '1px solid #10b981',
                  padding: '3px 9px',
                  borderRadius: 14,
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                [USER RUN]
              </span>
            )}
            <span
              style={{
                background: '#132342',
                color: '#06b6d4',
                border: '1px solid #223a6b',
                padding: '3px 9px',
                borderRadius: 14,
                fontSize: '0.72rem',
                fontWeight: 500
              }}
            >
              Task: {experiment.task_type || 'classification'}
            </span>
            {/* Quick dropdown switcher for experiments */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={experiment.id}
                onChange={(e) => {
                  const target = allExperiments.find((x) => x.id === e.target.value);
                  if (target) onSelectExperiment(target);
                }}
                className="form-select"
                style={{
                  padding: '4px 28px 4px 10px',
                  fontSize: '0.78rem',
                  height: 30,
                  background: '#132342',
                  borderColor: '#223a6b',
                  borderRadius: 20,
                  cursor: 'pointer'
                }}
              >
                {allExperiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    Switch Run: {exp.name} ({exp.architecture})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="workspace-timestamp">
            Sep 20 2026 - 2:35pm • Model Family: {experiment.model_family}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Sub-navigation tabs: Run Facts | Demo Space | Analysis */}
          <div className="header-tabs-group">
            <button
              className={`header-tab-btn ${activeTab === 'Run Facts' ? 'active' : ''}`}
              onClick={() => onNavigateTab('Run Facts')}
            >
              Run Facts
            </button>
            <button
              className={`header-tab-btn ${activeTab === 'Demo Space' ? 'active' : ''}`}
              onClick={() => onNavigateTab('Demo Space')}
            >
              Demo Space
            </button>
            <button
              className={`header-tab-btn ${activeTab === 'Analysis' ? 'active' : ''}`}
              onClick={() => onNavigateTab('Analysis')}
            >
              Analysis
            </button>
          </div>

          {/* User profile action icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#132342',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #22375f',
              color: '#94a3b8'
            }}
          >
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="workspace-body">
        {/* METADATA SECTION */}
        <div>
          <h2 className="section-title">Metadata</h2>
          <div className="three-card-grid">
            {/* Card 1: General */}
            <div className="stat-card">
              <div className="card-header-label">General</div>
              <div className="metadata-list">
                <div className="metadata-row">
                  <span className="metadata-key">JIRA Owner</span>
                  <span className="metadata-badge">{experiment.jira_owner || 'Person 1'}</span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Git Branch</span>
                  <span className="metadata-badge">{experiment.git_branch || 'Feature 1'}</span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Latest commit hash</span>
                  <span className="metadata-badge">{experiment.git_commit || '023medf239'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Model */}
            <div className="stat-card">
              <div className="card-header-label">Model</div>
              <div className="metadata-list">
                <div className="metadata-row">
                  <span className="metadata-key">Algorithm</span>
                  <span className="metadata-badge">
                    {experiment.architecture || 'Algo 1'}
                  </span>
                </div>

                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                    Hyperparameter
                  </div>
                  <div className="metadata-list">
                    <div className="metadata-row">
                      <span className="metadata-key">Learning-rate</span>
                      <span className="metadata-badge">
                        {experiment.hyperparameters?.learning_rate ?? 0.01}
                      </span>
                    </div>
                    <div className="metadata-row">
                      <span className="metadata-key">n_estimators</span>
                      <span className="metadata-badge">
                        {experiment.hyperparameters?.n_estimators ?? 600}
                      </span>
                    </div>
                    <div className="metadata-row">
                      <span className="metadata-key">max_depth</span>
                      <span className="metadata-badge">
                        {experiment.hyperparameters?.max_depth ?? 9}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Data */}
            <div className="stat-card">
              <div className="card-header-label">Data</div>
              <div className="metadata-list">
                <div className="metadata-row">
                  <span className="metadata-key">Dataset name</span>
                  <span className="metadata-badge">
                    {experiment.preprocessing?.dataset_name || experiment.dataset_name || 'credit_customers.csv'}
                  </span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Pre-pocessing</span>
                  <span className="metadata-badge">
                    {experiment.preprocessing?.['pre-pocessing'] || 'prep2.py'}
                  </span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Size</span>
                  <span className="metadata-badge">
                    {experiment.preprocessing?.size || '63.7 KB'}
                  </span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Observations</span>
                  <span className="metadata-badge">
                    {experiment.preprocessing?.observations || `${experiment.case_count || 200} rows`}
                  </span>
                </div>
                <div className="metadata-row">
                  <span className="metadata-key">Sample</span>
                  <span
                    className="metadata-badge clickable"
                    onClick={() => onNavigateTab('Demo Space')}
                  >
                    show sample
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS SECTION */}
        <div>
          <h2 className="section-title">Metrics</h2>
          <div className="three-card-grid">
            {/* Card 1: Loss */}
            <div className="stat-card">
              <div className="card-header-label">Loss</div>
              <div className="loss-stat-wrapper">
                <span className="loss-stat-number">{displayLoss}</span>
                <span className="loss-delta-badge">- 5.2%</span>
              </div>
              <div className="loss-subtitle">best loss vs. last experiment</div>

              {/* Area loss curve with red-gradient fill */}
              <div className="loss-sparkline-container">
                <svg width="100%" height="100%" viewBox="0 0 260 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {/* Fill area */}
                  <path
                    d="M 10 20 Q 50 65, 120 72 T 250 78 L 250 80 L 10 80 Z"
                    fill="url(#lossGradient)"
                  />
                  {/* Curve stroke */}
                  <path
                    d="M 10 20 Q 50 65, 120 72 T 250 78"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Explainability */}
            <div className="stat-card">
              <div className="card-header-label">
                Explainability
                <HelpCircle size={16} color="#64748b" style={{ cursor: 'pointer' }} />
              </div>

              <div className="explain-bars-container">
                {features.map((feat, idx) => (
                  <div key={idx} className="explain-row">
                    <span className="explain-label">{feat.feature}</span>
                    <span className="explain-val-badge">
                      +{feat.importance.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="explain-bottom-label">Feature Importance</div>
            </div>

            {/* Card 3: Confusion Matrix with Warning Tooltip */}
            <div className="stat-card" style={{ position: 'relative' }}>
              <div className="card-header-label">
                Confusion Matrix
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Normalized</span>
              </div>

              <div className="cm-container" style={{ marginTop: 24 }}>
                {/* Speech-bubble warning callout */}
                {showWarningTooltip && (
                  <div className="cm-callout-warning">
                    Warning
                    <div style={{ fontWeight: 400, marginTop: 2 }}>
                      The false positive rate is higher than your threshold
                    </div>
                  </div>
                )}

                <div className="cm-grid-wrapper">
                  <div className="cm-axis-vertical">True label</div>

                  <div className="cm-matrix-2x2">
                    {/* TN */}
                    <div className="cm-cell" title={`True Negatives: ${cm.tn}`}>
                      {tnRate}
                    </div>

                    {/* FP (with Warning Icon!) */}
                    <div
                      className="cm-cell warning-cell"
                      title={`False Positives: ${cm.fp}`}
                      onClick={() => setShowWarningTooltip(!showWarningTooltip)}
                      style={{ cursor: 'pointer' }}
                    >
                      {fpRate}
                      <AlertTriangle className="cm-warning-icon" size={16} />
                    </div>

                    {/* FN */}
                    <div className="cm-cell" title={`False Negatives: ${cm.fn}`}>
                      {fnRate}
                    </div>

                    {/* TP */}
                    <div className="cm-cell" title={`True Positives: ${cm.tp}`}>
                      {tpRate}
                    </div>
                  </div>
                </div>

                <div className="cm-axis-horizontal">Predicted label</div>
              </div>
            </div>
          </div>

          {/* Card 4: Independent Verification & Calibration Banner */}
          {experiment.calculated_metrics && (
            <div
              className="stat-card"
              style={{
                marginTop: 18,
                background: 'linear-gradient(135deg, rgba(16, 28, 56, 0.95), rgba(19, 35, 66, 0.95))',
                border: '1px solid #233766'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.92rem' }}>
                    Independently Calculated Verification Metrics
                  </span>
                  <span
                    style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: '#06b6d4',
                      border: '1px solid #0891b2',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    Audited from {experiment.case_count} Case Predictions
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Distinguished from author-reported scalar metrics
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e305b' }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase' }}>Verified Accuracy</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', marginTop: 4 }}>
                    {(experiment.calculated_metrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Reported: {experiment.metrics?.accuracy ? `${(experiment.metrics.accuracy * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e305b' }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase' }}>Verified Macro-F1</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
                    {experiment.calculated_metrics.f1_macro?.toFixed(3) || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Reported: {experiment.metrics?.f1_macro?.toFixed(3) || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e305b' }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase' }}>Precision / Recall</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#a78bfa', marginTop: 4 }}>
                    {(experiment.calculated_metrics.precision * 100).toFixed(1)}% / {(experiment.calculated_metrics.recall * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Positive Class</div>
                </div>

                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e305b' }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase' }}>Calibration ECE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399', marginTop: 4 }}>
                    {experiment.calculated_metrics.ece?.toFixed(3) ?? 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.72rem', marginTop: 2, color: (experiment.calculated_metrics.ece ?? 0) < 0.1 ? '#34d399' : '#f59e0b' }}>
                    {(experiment.calculated_metrics.ece ?? 0) < 0.1 ? 'Reliably Calibrated' : 'Overconfidence Bias'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar: "Create Hypothesis" */}
      <div className="bottom-action-bar">
        <button className="btn-create-hypothesis" onClick={onOpenCreateHypothesis}>
          Create Hypothesis
          <Tag size={17} />
        </button>
      </div>
    </div>
  );
};
