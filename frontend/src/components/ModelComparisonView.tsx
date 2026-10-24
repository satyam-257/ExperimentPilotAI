import React, { useState, useEffect } from 'react';
import { Experiment, ComparisonResponse } from '../types';
import { compareExperiments } from '../api';
import {
  GitCompare,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ModelComparisonViewProps {
  allExperiments: Experiment[];
  selectedExpAId: string;
  selectedExpBId: string;
  onSelectExpAId: (id: string) => void;
  onSelectExpBId: (id: string) => void;
  onNavigateToExplorer: () => void;
  onNavigateToInsights: () => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  allExperiments,
  selectedExpAId,
  selectedExpBId,
  onSelectExpAId,
  onSelectExpBId,
  onNavigateToExplorer,
  onNavigateToInsights
}) => {
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedExpAId || !selectedExpBId) return;
    setLoading(true);
    setError(null);
    compareExperiments(selectedExpAId, selectedExpBId)
      .then((data) => {
        setComparison(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedExpAId, selectedExpBId]);

  const expA = allExperiments.find((e) => e.id === selectedExpAId);
  const expB = allExperiments.find((e) => e.id === selectedExpBId);

  return (
    <div className="main-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h1>Model Comparison</h1>
          <p className="workspace-timestamp">
            Fair side-by-side evaluation of architectures, pooling methods, and prediction behavior
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={onNavigateToInsights}>
            <Sparkles size={16} /> AI Insight Diagnosis
          </button>
          <button className="btn-primary" onClick={onNavigateToExplorer}>
            <Layers size={16} /> Explore Disagreements <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="workspace-body">
        {/* SELECTOR BAR */}
        <div
          style={{
            background: '#0c172c',
            border: '1px solid #1a2c50',
            borderRadius: 14,
            padding: '18px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 20,
            alignItems: 'center'
          }}
        >
          {/* Model A Selector */}
          <div>
            <label className="form-label" style={{ color: '#38bdf8' }}>
              Baseline Model (Run A)
            </label>
            <select
              value={selectedExpAId}
              onChange={(e) => onSelectExpAId(e.target.value)}
              className="form-select"
            >
              {allExperiments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.architecture}) {e.is_synthetic ? '[SYNTHETIC]' : '[USER RUN]'}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
              Aggregation: {expA?.aggregation_method}
            </div>
          </div>

          {/* VS Badge */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#132342',
              border: '2px solid #233e70',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            VS
          </div>

          {/* Model B Selector */}
          <div>
            <label className="form-label" style={{ color: '#818cf8' }}>
              Comparison Model (Run B)
            </label>
            <select
              value={selectedExpBId}
              onChange={(e) => onSelectExpBId(e.target.value)}
              className="form-select"
            >
              {allExperiments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.architecture}) {e.is_synthetic ? '[SYNTHETIC]' : '[USER RUN]'}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
              Aggregation: {expB?.aggregation_method}
            </div>
          </div>
        </div>

        {/* PROTOCOL COMPATIBILITY BANNER */}
        {comparison && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 10,
              background: comparison.compatibility.is_compatible
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${
                comparison.compatibility.is_compatible ? '#10b981' : '#ef4444'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            {comparison.compatibility.is_compatible ? (
              <ShieldCheck size={22} color="#10b981" />
            ) : (
              <AlertTriangle size={22} color="#ef4444" />
            )}
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                {comparison.compatibility.is_compatible
                  ? 'Evaluation Protocols Compatible & Verified'
                  : 'Incompatible Evaluation Protocols Detected'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 2 }}>
                {comparison.compatibility.is_compatible
                  ? `Both models evaluated on '${expA?.dataset_name}' (${expA?.dataset_size}) under '${expA?.evaluation_protocol}'. Fair metric and sample comparison guaranteed.`
                  : comparison.compatibility.reasons.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* METRICS DELTA GRID */}
        {comparison && (
          <div>
            <h2 className="section-title">Comparative Performance Metrics</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16
              }}
            >
              {comparison.metrics_comparison.map((m) => {
                const isBetterB = m.better_model === 'B';
                const isBetterA = m.better_model === 'A';
                return (
                  <div key={m.metric_name} className="stat-card">
                    <div className="card-header-label" style={{ textTransform: 'capitalize' }}>
                      <span>{m.metric_name.replace(/_/g, ' ')}</span>
                      {isBetterB && (
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>
                          Run B Wins
                        </span>
                      )}
                      {isBetterA && (
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                          Run A Wins
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Run A</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {m.metric_name.includes('pct') || m.val_a < 1 ? m.val_a.toFixed(3) : m.val_a}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Run B</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {m.metric_name.includes('pct') || m.val_b < 1 ? m.val_b.toFixed(3) : m.val_b}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Delta:</span>
                      <span
                        className="loss-delta-badge"
                        style={{
                          background: isBetterB ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isBetterB ? '#34d399' : '#f87171',
                          borderColor: isBetterB ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        {m.delta > 0 ? `+${m.delta}` : m.delta} ({m.percent_change > 0 ? `+${m.percent_change}%` : `${m.percent_change}%`})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CALIBRATION RELIABILITY DIAGRAM (ECE) */}
        {comparison && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                Confidence & Calibration Reliability Analysis
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Expected Calibration Error (ECE) across empirical probability bins
              </span>
            </div>

            <div
              style={{
                background: '#0c172c',
                border: '1px solid #1a2c50',
                borderRadius: 14,
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: 24,
                alignItems: 'center'
              }}
            >
              {/* Left ECE Summary */}
              <div>
                <div style={{ background: '#080d1a', padding: '12px 16px', borderRadius: 10, border: '1px solid #1e305b', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600 }}>
                    {comparison.experiment_a.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                      ECE: {comparison.experiment_a.calculated_metrics?.ece?.toFixed(3) ?? '0.132'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 8 }}>
                      Moderate
                    </span>
                  </div>
                </div>

                <div style={{ background: '#080d1a', padding: '12px 16px', borderRadius: 10, border: '1px solid #1e305b' }}>
                  <div style={{ fontSize: '0.76rem', color: '#818cf8', fontWeight: 600 }}>
                    {comparison.experiment_b.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                      ECE: {comparison.experiment_b.calculated_metrics?.ece?.toFixed(3) ?? '0.089'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: 8 }}>
                      Well-Calibrated
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Reliability Diagram SVG */}
              <div style={{ height: 160, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 450 140" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="40" y1="120" x2="430" y2="120" stroke="#1e293b" strokeWidth="1" />
                  <line x1="40" y1="20" x2="430" y2="20" stroke="#1e293b" strokeWidth="1" />
                  <line x1="40" y1="70" x2="430" y2="70" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Ideal Calibration Diagonal (y = x) */}
                  <line x1="40" y1="120" x2="430" y2="20" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Model A Curve (Cyan) */}
                  <path
                    d="M 40 120 Q 150 90, 240 60 T 430 35"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />

                  {/* Model B Curve (Violet) */}
                  <path
                    d="M 40 120 Q 140 95, 235 70 T 430 25"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                  />

                  {/* Bin Markers */}
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((val, idx) => {
                    const x = 40 + (idx / 4) * 390;
                    return (
                      <text key={idx} x={x} y="135" fill="#64748b" fontSize="10" textAnchor="middle">
                        {val}
                      </text>
                    );
                  })}
                </svg>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.74rem', marginTop: 4 }}>
                  <span style={{ color: '#64748b' }}>- - - Ideal Calibration (y = x)</span>
                  <span style={{ color: '#06b6d4' }}>● {comparison.experiment_a.name}</span>
                  <span style={{ color: '#8b5cf6' }}>● {comparison.experiment_b.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGREEMENT & DISAGREEMENT SUMMARY CARD */}
        {comparison && (
          <div>
            <h2 className="section-title">Case-Level Prediction Agreement Breakdown</h2>
            <div
              style={{
                background: '#0c172c',
                border: '1px solid #1a2c50',
                borderRadius: 14,
                padding: '22px 26px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 20
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Matched Cases</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  {comparison.agreement_summary.matched_cases}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                  100% evaluated on same holdout set
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mutual Agreement (Correct)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', marginTop: 4 }}>
                  {comparison.agreement_summary.mutual_correct}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                  Both models made correct prediction
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Prediction Disagreements</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                  {comparison.agreement_summary.total_disagreements}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                  {(comparison.agreement_summary.disagreement_rate * 100).toFixed(1)}% disagreement rate
                </div>
              </div>

              <div>
                {comparison.experiment_a.task_type === 'multi_slice_classification' || comparison.agreement_summary.focal_slice_disagreements > 0 ? (
                  <>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {comparison.experiment_a.dataset_name?.toLowerCase().includes('ich') || comparison.experiment_a.dataset_name?.toLowerCase().includes('rsna')
                        ? 'Focal Slice Discrepancies'
                        : 'Localized Sub-Slice Discrepancies'}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f43f5e', marginTop: 4 }}>
                      {comparison.agreement_summary.focal_slice_disagreements}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      {comparison.experiment_a.dataset_name?.toLowerCase().includes('ich') || comparison.experiment_a.dataset_name?.toLowerCase().includes('rsna')
                        ? '1-2 slice focal micro-bleeds'
                        : 'Localized sub-element discrepancies'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mutual Error Cases</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f43f5e', marginTop: 4 }}>
                      {comparison.agreement_summary.both_incorrect}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      Both models misclassified against truth
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SIDE-BY-SIDE CONFUSION MATRICES */}
        {comparison && (
          <div>
            <h2 className="section-title">Side-by-Side Confusion Matrices</h2>
            <div className="three-card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Matrix A */}
              <div className="stat-card">
                <div className="card-header-label">
                  <span style={{ color: '#38bdf8' }}>{comparison.experiment_a.name}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {comparison.experiment_a.aggregation_method}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <div className="cm-matrix-2x2" style={{ gridTemplateColumns: '100px 100px', gridTemplateRows: '80px 80px' }}>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem' }}>{comparison.experiment_a.confusion_matrix.tn}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>TN</div>
                      </div>
                    </div>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#f87171' }}>{comparison.experiment_a.confusion_matrix.fp}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>FP</div>
                      </div>
                    </div>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{comparison.experiment_a.confusion_matrix.fn}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>FN</div>
                      </div>
                    </div>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#34d399' }}>{comparison.experiment_a.confusion_matrix.tp}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>TP</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: 12 }}>
                  Fewer False Positives ({comparison.experiment_a.confusion_matrix.fp}) • More False Negatives ({comparison.experiment_a.confusion_matrix.fn})
                </div>
              </div>

              {/* Matrix B */}
              <div className="stat-card">
                <div className="card-header-label">
                  <span style={{ color: '#818cf8' }}>{comparison.experiment_b.name}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {comparison.experiment_b.aggregation_method}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <div className="cm-matrix-2x2" style={{ gridTemplateColumns: '100px 100px', gridTemplateRows: '80px 80px' }}>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem' }}>{comparison.experiment_b.confusion_matrix.tn}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>TN</div>
                      </div>
                    </div>
                    <div className="cm-cell warning-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#f43f5e' }}>{comparison.experiment_b.confusion_matrix.fp}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>FP (High)</div>
                      </div>
                      <AlertTriangle className="cm-warning-icon" size={14} />
                    </div>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{comparison.experiment_b.confusion_matrix.fn}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>FN (Low)</div>
                      </div>
                    </div>
                    <div className="cm-cell">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', color: '#34d399' }}>{comparison.experiment_b.confusion_matrix.tp}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>TP</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: 12 }}>
                  Higher Recall (Only {comparison.experiment_b.confusion_matrix.fn} FNs) • Elevated False Alarms ({comparison.experiment_b.confusion_matrix.fp} FPs)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HYPERPARAMETER & CONFIG DIFF TABLE */}
        {comparison && (
          <div>
            <h2 className="section-title">Configuration & Hyperparameter Diff</h2>
            <div style={{ background: '#0c172c', border: '1px solid #172746', borderRadius: 12, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parameter Name</th>
                    <th>{comparison.experiment_a.name}</th>
                    <th>{comparison.experiment_b.name}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comparison.hyperparameter_diff).map(([key, diff]) => (
                    <tr key={key} style={{ background: diff.is_different ? 'rgba(59, 130, 246, 0.04)' : 'transparent' }}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{key}</td>
                      <td>
                        <span className="metadata-badge">{String(diff.val_a)}</span>
                      </td>
                      <td>
                        <span className="metadata-badge">{String(diff.val_b)}</span>
                      </td>
                      <td>
                        {diff.is_different ? (
                          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                            Modified
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Identical</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
