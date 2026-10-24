import React, { useState, useEffect } from 'react';
import { Experiment, ExplorerResponse, ExplorerCaseItem, SlicePrediction } from '../types';
import { fetchExplorerCases } from '../api';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  HelpCircle,
  Activity
} from 'lucide-react';

interface BehaviorExplorerViewProps {
  allExperiments: Experiment[];
  selectedExpAId: string;
  selectedExpBId: string;
  onSelectExpAId: (id: string) => void;
  onSelectExpBId: (id: string) => void;
  onOpenCreateHypothesis: () => void;
}

export const BehaviorExplorerView: React.FC<BehaviorExplorerViewProps> = ({
  allExperiments,
  selectedExpAId,
  selectedExpBId,
  onSelectExpAId,
  onSelectExpBId,
  onOpenCreateHypothesis
}) => {
  const [filterType, setFilterType] = useState<string>('disagreement');
  const [search, setSearch] = useState<string>('');
  const [data, setData] = useState<ExplorerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<ExplorerCaseItem | null>(null);
  const [activeSliceIndex, setActiveSliceIndex] = useState<number>(0);

  const expA = allExperiments.find((e) => e.id === selectedExpAId);
  const expB = allExperiments.find((e) => e.id === selectedExpBId);

  const isRegression = expA?.task_type === 'regression' || expB?.task_type === 'regression';
  const hasSlices = Boolean(
    selectedCase?.model_a.slices &&
    selectedCase.model_a.slices.length > 0 &&
    selectedCase?.model_b.slices &&
    selectedCase.model_b.slices.length > 0
  );
  const sliceCount = selectedCase?.model_a.slices?.length || 0;
  const maxSliceIdx = Math.max(0, sliceCount - 1);

  const hasSliceAggregation = hasSlices && Boolean(
    (expA?.aggregation_method && expA.aggregation_method !== 'None') ||
    (expB?.aggregation_method && expB.aggregation_method !== 'None') ||
    expA?.task_type === 'multi_slice_classification' ||
    expB?.task_type === 'multi_slice_classification'
  );

  const isMedicalImaging = Boolean(
    expA?.dataset_name?.toLowerCase().includes('ich') ||
    expA?.dataset_name?.toLowerCase().includes('rsna') ||
    expB?.dataset_name?.toLowerCase().includes('ich') ||
    expB?.dataset_name?.toLowerCase().includes('rsna') ||
    selectedCase?.finding_type?.toLowerCase().includes('hemorrhage')
  );

  const loadCases = () => {
    if (!selectedExpAId || !selectedExpBId) return;
    setLoading(true);
    fetchExplorerCases(selectedExpAId, selectedExpBId, filterType, search, 1, 100)
      .then((res) => {
        setData(res);
        setLoading(false);
        if (res.items.length > 0 && !selectedCase) {
          setSelectedCase(res.items[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCases();
  }, [selectedExpAId, selectedExpBId, filterType, search]);

  const filterOptions = [
    { key: 'disagreement', label: 'Disagreements (A ≠ B)' },
    { key: 'all', label: 'All Cases' },
    { key: 'mutual_correct', label: 'Mutual Agreement' },
    { key: 'both_error', label: 'Both In Error' },
    { key: 'a_only_correct', label: `${expA?.architecture || 'Run A'} Only Correct` },
    { key: 'b_only_correct', label: `${expB?.architecture || 'Run B'} Only Correct` },
    { key: 'fp', label: 'False Positives' },
    { key: 'fn', label: 'False Negatives' }
  ];

  const safeSliceIdx = Math.min(activeSliceIndex, maxSliceIdx);
  const sliceProbA = selectedCase?.model_a.slices?.[safeSliceIdx]?.probability ?? 0;
  const sliceProbB = selectedCase?.model_b.slices?.[safeSliceIdx]?.probability ?? 0;
  const isGroundTruthFocal = selectedCase?.model_a.slices?.[safeSliceIdx]?.is_focal_ground_truth ?? false;

  return (
    <div className="main-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h1>Model Behavior Explorer</h1>
          <p className="workspace-timestamp">
            Sample-level behavioral inspection • Agreement, disagreement, and prediction divergence analysis
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={selectedExpAId}
            onChange={(e) => onSelectExpAId(e.target.value)}
            className="form-select"
            style={{ width: 250 }}
          >
            {allExperiments.map((e) => (
              <option key={e.id} value={e.id}>
                Run A: {e.name} {e.is_synthetic ? '[SYNTHETIC]' : '[USER RUN]'}
              </option>
            ))}
          </select>

          <select
            value={selectedExpBId}
            onChange={(e) => onSelectExpBId(e.target.value)}
            className="form-select"
            style={{ width: 250 }}
          >
            {allExperiments.map((e) => (
              <option key={e.id} value={e.id}>
                Run B: {e.name} {e.is_synthetic ? '[SYNTHETIC]' : '[USER RUN]'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="workspace-body">
        {/* FILTER BAR & SEARCH */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            background: '#0c172c',
            border: '1px solid #1a2c50',
            borderRadius: 12,
            padding: '12px 18px'
          }}
        >
          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterType(opt.key)}
                className="header-tab-btn"
                style={{
                  background: filterType === opt.key ? '#25406c' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: filterType === opt.key ? '#3b619e' : 'transparent',
                  color: filterType === opt.key ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  padding: '5px 14px'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: 200 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }}
            />
            <input
              type="text"
              placeholder="Search Case ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: '0.82rem', height: 34 }}
            />
          </div>
        </div>

        {/* TWO-COLUMN EXPLORER LAYOUT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            gap: 24,
            alignItems: 'start'
          }}
        >
          {/* LEFT: CASES LIST TABLE */}
          <div
            style={{
              background: '#0c172c',
              border: '1px solid #172746',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '680px'
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #172746',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0a1426'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                Evaluation Cases ({data?.total_count || 0})
              </span>
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                Click row to inspect sample diagnostics
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Ground Truth</th>
                    <th>{expA?.architecture?.split('-')[0] || 'Run A'}</th>
                    <th>{expB?.architecture?.split('-')[0] || 'Run B'}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((item) => {
                    const isSelected = selectedCase?.case_id === item.case_id;
                    const isDisagreed = item.is_disagreement;

                    return (
                      <tr
                        key={item.case_id}
                        onClick={() => setSelectedCase(item)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected
                            ? 'rgba(59, 130, 246, 0.12)'
                            : isDisagreed
                            ? 'rgba(245, 158, 11, 0.04)'
                            : 'transparent'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{item.case_id}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {item.slice_count && item.slice_count > 0
                              ? `${item.slice_count} ${isMedicalImaging ? 'axial slices' : 'sub-slices'}`
                              : 'Single Instance'}
                          </div>
                        </td>

                        <td>
                          <span
                            className="metadata-badge"
                            style={{
                              background:
                                item.true_label === 1
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(16, 185, 129, 0.15)',
                              color: item.true_label === 1 ? '#f87171' : '#34d399',
                              borderColor:
                                item.true_label === 1
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : 'rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {isRegression
                              ? `Target: ${item.continuous_true ?? item.true_label}`
                              : item.true_label === 1
                              ? 'Positive'
                              : 'Negative'}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.model_a.is_correct ? (
                              <CheckCircle2 size={14} color="#10b981" />
                            ) : (
                              <XCircle size={14} color="#ef4444" />
                            )}
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              {isRegression
                                ? (item.model_a.continuous_prediction ?? item.model_a.probability).toFixed(2)
                                : `${(item.model_a.probability * 100).toFixed(0)}%`}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.model_b.is_correct ? (
                              <CheckCircle2 size={14} color="#10b981" />
                            ) : (
                              <XCircle size={14} color="#ef4444" />
                            )}
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              {isRegression
                                ? (item.model_b.continuous_prediction ?? item.model_b.probability).toFixed(2)
                                : `${(item.model_b.probability * 100).toFixed(0)}%`}
                            </span>
                          </div>
                        </td>

                        <td>
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(item);
                            }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(!data || data.items.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                  No cases match the selected filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INTERACTIVE INSPECTION SUITE */}
          {selectedCase ? (
            <div
              style={{
                background: '#0c172c',
                border: '1px solid #1a2c50',
                borderRadius: 14,
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18
              }}
            >
              {/* Selected Case Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 14,
                  borderBottom: '1px solid #172746'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      {selectedCase.case_id}
                    </h3>
                    <span
                      className="loss-delta-badge"
                      style={{
                        background:
                          selectedCase.true_label === 1
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color: selectedCase.true_label === 1 ? '#f87171' : '#34d399'
                      }}
                    >
                      Ground Truth:{' '}
                      {isRegression
                        ? `Target ${selectedCase.continuous_true ?? selectedCase.true_label}`
                        : selectedCase.true_label === 1
                        ? 'Positive'
                        : 'Negative'}
                    </span>
                    {selectedCase.is_disagreement && (
                      <span
                        className="loss-delta-badge"
                        style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}
                      >
                        Model Disagreement
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                    Protocol: {expA?.dataset_name || 'Standard Dataset'} • {expA?.evaluation_protocol || 'Evaluation'} •{' '}
                    {hasSlices ? `${sliceCount} Sub-elements` : 'Standard Input Instance'}
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={onOpenCreateHypothesis}
                >
                  <Sparkles size={14} color="#8b5cf6" /> Formulate Hypothesis
                </button>
              </div>

              {/* EMPIRICAL OBSERVATION vs HYPOTHESIS BOX */}
              <div
                style={{
                  background: '#091325',
                  border: '1px solid #172746',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                  <Activity size={14} color="#38bdf8" /> Observed Sample Facts (Independently Verified)
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14
                  }}
                >
                  {/* Model A Observation */}
                  <div style={{ background: '#0b162b', padding: 12, borderRadius: 8, border: '1px solid #1a2c50' }}>
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                      {expA?.name}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                      {isRegression
                        ? `Prediction: ${(selectedCase.model_a.continuous_prediction ?? selectedCase.model_a.probability).toFixed(3)}`
                        : `Prediction: ${selectedCase.model_a.predicted_label === 1 ? 'Positive' : 'Negative'} (${(selectedCase.model_a.probability * 100).toFixed(0)}%)`}
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: 4 }}>
                      {selectedCase.model_a.is_correct ? (
                        <span style={{ color: '#34d399' }}>✓ Consistent with ground truth</span>
                      ) : (
                        <span style={{ color: '#f87171' }}>✗ Misclassified against ground truth</span>
                      )}
                    </div>
                  </div>

                  {/* Model B Observation */}
                  <div style={{ background: '#0b162b', padding: 12, borderRadius: 8, border: '1px solid #1a2c50' }}>
                    <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                      {expB?.name}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                      {isRegression
                        ? `Prediction: ${(selectedCase.model_b.continuous_prediction ?? selectedCase.model_b.probability).toFixed(3)}`
                        : `Prediction: ${selectedCase.model_b.predicted_label === 1 ? 'Positive' : 'Negative'} (${(selectedCase.model_b.probability * 100).toFixed(0)}%)`}
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: 4 }}>
                      {selectedCase.model_b.is_correct ? (
                        <span style={{ color: '#34d399' }}>✓ Consistent with ground truth</span>
                      ) : (
                        <span style={{ color: '#f87171' }}>✗ Misclassified against ground truth</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explicit Non-Causal Grounded Note */}
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px dashed #1e3a6d',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: '0.74rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Info size={14} color="#60a5fa" />
                  <span>
                    <strong>Investigative Grounding:</strong> Model error reflects empirical classification outcome. Causal explanations are treated as testable hypotheses rather than observed facts.
                  </span>
                </div>
              </div>

              {/* SLICE AGGREGATION DIAGNOSTICS: ONLY WHEN SLICES & AGGREGATION METADATA EXIST */}
              {hasSliceAggregation && (
                <div
                  style={{
                    background: '#091325',
                    border: '1px solid #172746',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                      Slice Aggregation Diagnostics
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Aggregation strategy breakdown
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.76rem' }}>
                    <div style={{ background: '#0c172c', padding: '10px 12px', borderRadius: 6, border: '1px solid #1a2c50' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{expA?.name}: </span>
                      <span style={{ color: '#cbd5e1' }}>{expA?.aggregation_method || 'Standard'}</span>
                      <div style={{ color: '#94a3b8', marginTop: 4 }}>
                        Sub-elements exceeding 0.5 threshold:{' '}
                        {selectedCase.model_a.slices?.filter((s) => s.probability >= 0.5).length || 0} of {sliceCount}
                      </div>
                    </div>
                    <div style={{ background: '#0c172c', padding: '10px 12px', borderRadius: 6, border: '1px solid #1a2c50' }}>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{expB?.name}: </span>
                      <span style={{ color: '#cbd5e1' }}>{expB?.aggregation_method || 'Standard'}</span>
                      <div style={{ color: '#94a3b8', marginTop: 4 }}>
                        Sub-elements exceeding 0.5 threshold:{' '}
                        {selectedCase.model_b.slices?.filter((s) => s.probability >= 0.5).length || 0} of {sliceCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SAMPLE / SLICE INSPECTION SUITE: ONLY WHEN SLICES EXIST */}
              {hasSlices ? (
                <>
                  {/* MULTI-SLICE ACTIVATION CURVE */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
                        Sub-Slice Activation Profile ({sliceCount} Sub-elements)
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Click point to inspect slice
                      </span>
                    </div>

                    <div
                      style={{
                        height: 140,
                        background: '#091325',
                        border: '1px solid #172746',
                        borderRadius: 8,
                        padding: '10px 14px',
                        position: 'relative'
                      }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 480 120" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="60" x2="480" y2="60" stroke="#172746" strokeDasharray="4 4" />
                        <line x1="0" y1="10" x2="480" y2="10" stroke="#172746" strokeDasharray="4 4" />

                        {/* Ground truth focal marker bars */}
                        {selectedCase.model_a.slices?.map((s, idx) => {
                          if (!s.is_focal_ground_truth) return null;
                          const x = maxSliceIdx > 0 ? (idx / maxSliceIdx) * 460 + 10 : 240;
                          return (
                            <rect
                              key={`gt-${idx}`}
                              x={x - 4}
                              y="10"
                              width="8"
                              height="100"
                              fill="rgba(239, 68, 68, 0.2)"
                              rx="2"
                            />
                          );
                        })}

                        {/* Curve for Model A (Cyan) */}
                        <path
                          d={
                            selectedCase.model_a.slices
                              ?.map((s, idx) => {
                                const x = maxSliceIdx > 0 ? (idx / maxSliceIdx) * 460 + 10 : 240;
                                const y = 110 - s.probability * 100;
                                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                              })
                              .join(' ') || ''
                          }
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                        />

                        {/* Curve for Model B (Violet) */}
                        <path
                          d={
                            selectedCase.model_b.slices
                              ?.map((s, idx) => {
                                const x = maxSliceIdx > 0 ? (idx / maxSliceIdx) * 460 + 10 : 240;
                                const y = 110 - s.probability * 100;
                                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                              })
                              .join(' ') || ''
                          }
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2.5"
                        />

                        {/* Active Slice Marker Indicator */}
                        <line
                          x1={maxSliceIdx > 0 ? (safeSliceIdx / maxSliceIdx) * 460 + 10 : 240}
                          y1="5"
                          x2={maxSliceIdx > 0 ? (safeSliceIdx / maxSliceIdx) * 460 + 10 : 240}
                          y2="115"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        color: '#64748b',
                        marginTop: 4
                      }}
                    >
                      <span>Element 0 (Initial)</span>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <span style={{ color: '#06b6d4' }}>● {expA?.architecture || 'Model A'} Prob</span>
                        <span style={{ color: '#8b5cf6' }}>● {expB?.architecture || 'Model B'} Prob</span>
                        <span style={{ color: '#ef4444' }}>■ Target Sub-Region</span>
                      </div>
                      <span>Element {maxSliceIdx} (Terminal)</span>
                    </div>
                  </div>

                  {/* SLICE SCRUBBER & DYNAMIC VISUALIZER */}
                  <div
                    style={{
                      background: '#091325',
                      border: '1px solid #172746',
                      borderRadius: 10,
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20
                    }}
                  >
                    {/* Visualizer Canvas Graphic */}
                    <div
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 12,
                        background: '#040810',
                        border: '1px solid #22375f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        flexShrink: 0
                      }}
                    >
                      {isMedicalImaging ? (
                        /* Anatomical CT depiction for medical fixtures */
                        <div
                          style={{
                            width: 90,
                            height: 94,
                            borderRadius: '50% 50% 45% 45%',
                            border: '2px solid #94a3b8',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div
                            style={{
                              width: 76,
                              height: 80,
                              borderRadius: '50% 50% 45% 45%',
                              background: '#1a273e'
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              width: 14,
                              height: 24,
                              background: '#091122',
                              borderRadius: 6
                            }}
                          />
                          {(sliceProbA > 0.4 || sliceProbB > 0.4 || isGroundTruthFocal) && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 28,
                                right: 18,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: isGroundTruthFocal
                                  ? 'radial-gradient(circle, #ef4444 0%, rgba(239,68,68,0.2) 100%)'
                                  : 'radial-gradient(circle, #f59e0b 0%, rgba(245,158,11,0.2) 100%)',
                                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        /* Task-Neutral Volumetric / Sequence Element Matrix */
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: 8,
                            border: '1px solid #334155',
                            background: '#0f172a',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 4,
                            padding: 6
                          }}
                        >
                          {Array.from({ length: 9 }).map((_, i) => {
                            const intensity = ((sliceProbA + sliceProbB) / 2) * ((i + 1) / 9);
                            return (
                              <div
                                key={i}
                                style={{
                                  borderRadius: 4,
                                  background: isGroundTruthFocal
                                    ? `rgba(239, 68, 68, ${Math.max(0.15, intensity)})`
                                    : `rgba(6, 182, 212, ${Math.max(0.15, intensity)})`
                                }}
                              />
                            );
                          })}
                        </div>
                      )}

                      <span
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          fontSize: '0.65rem',
                          color: '#64748b'
                        }}
                      >
                        {isMedicalImaging ? `Axial #${safeSliceIdx}` : `Step #${safeSliceIdx}`}
                      </span>
                    </div>

                    {/* Scrubber Controls */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8
                        }}
                      >
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                          {isMedicalImaging ? 'Axial Slice' : 'Sub-Element'} {safeSliceIdx} of {sliceCount}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '2px 8px' }}
                            disabled={safeSliceIdx <= 0}
                            onClick={() => setActiveSliceIndex((prev) => Math.max(0, prev - 1))}
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '2px 8px' }}
                            disabled={safeSliceIdx >= maxSliceIdx}
                            onClick={() => setActiveSliceIndex((prev) => Math.min(maxSliceIdx, prev + 1))}
                          >
                            Next <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Range Slider Scrubber */}
                      <input
                        type="range"
                        min="0"
                        max={maxSliceIdx}
                        value={safeSliceIdx}
                        onChange={(e) => setActiveSliceIndex(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                      />

                      {/* Slice Metrics Readout */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 16,
                          marginTop: 8,
                          fontSize: '0.78rem'
                        }}
                      >
                        <div>
                          <span style={{ color: '#64748b' }}>Focal Ground Truth: </span>
                          <span style={{ color: isGroundTruthFocal ? '#f87171' : '#34d399', fontWeight: 600 }}>
                            {isGroundTruthFocal ? 'Active Sub-Target' : 'Baseline / Inactive'}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>{expA?.name || 'Model A'}: </span>
                          <span style={{ color: '#06b6d4', fontWeight: 600 }}>
                            {(sliceProbA * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>{expB?.name || 'Model B'}: </span>
                          <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                            {(sliceProbB * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* GENERAL / TABULAR / NON-SLICE SAMPLE DETAIL VIEW */
                <div
                  style={{
                    background: '#091325',
                    border: '1px solid #172746',
                    borderRadius: 10,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#e2e8f0' }}>
                    {isRegression ? 'Continuous Regression Target Analysis' : 'Single-Instance Classification Diagnostics'}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16
                    }}
                  >
                    <div style={{ background: '#0c172c', padding: 16, borderRadius: 8, border: '1px solid #1e305b' }}>
                      <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                        {expA?.name || 'Model A'} Prediction
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                        {isRegression
                          ? `Value: ${(selectedCase.model_a.continuous_prediction ?? selectedCase.model_a.probability).toFixed(3)}`
                          : `Predicted Class: ${selectedCase.model_a.predicted_label}`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                        {isRegression
                          ? `Abs Error: ${Math.abs((selectedCase.model_a.continuous_prediction ?? selectedCase.model_a.probability) - (selectedCase.continuous_true ?? selectedCase.true_label)).toFixed(3)}`
                          : `Confidence: ${(selectedCase.model_a.confidence * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span
                          className="loss-delta-badge"
                          style={{
                            background: selectedCase.model_a.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: selectedCase.model_a.is_correct ? '#34d399' : '#f87171'
                          }}
                        >
                          {selectedCase.model_a.is_correct ? 'Verified Correct' : 'Verified Misclassified'}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: '#0c172c', padding: 16, borderRadius: 8, border: '1px solid #1e305b' }}>
                      <div style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>
                        {expB?.name || 'Model B'} Prediction
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                        {isRegression
                          ? `Value: ${(selectedCase.model_b.continuous_prediction ?? selectedCase.model_b.probability).toFixed(3)}`
                          : `Predicted Class: ${selectedCase.model_b.predicted_label}`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                        {isRegression
                          ? `Abs Error: ${Math.abs((selectedCase.model_b.continuous_prediction ?? selectedCase.model_b.probability) - (selectedCase.continuous_true ?? selectedCase.true_label)).toFixed(3)}`
                          : `Confidence: ${(selectedCase.model_b.confidence * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span
                          className="loss-delta-badge"
                          style={{
                            background: selectedCase.model_b.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: selectedCase.model_b.is_correct ? '#34d399' : '#f87171'
                          }}
                        >
                          {selectedCase.model_b.is_correct ? 'Verified Correct' : 'Verified Misclassified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: '#0c172c',
                border: '1px solid #172746',
                borderRadius: 14,
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              Select a case from the table to inspect sample-level predictions and model behavior.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
