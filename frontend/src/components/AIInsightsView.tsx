import React, { useState, useEffect } from 'react';
import { Experiment, InsightResponse, RecommendationItem } from '../types';
import { generateInsights } from '../api';
import {
  Sparkles,
  Cpu,
  Brain,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Tag,
  Key,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface AIInsightsViewProps {
  allExperiments: Experiment[];
  selectedExpAId: string;
  selectedExpBId: string;
  onSelectExpAId: (id: string) => void;
  onSelectExpBId: (id: string) => void;
  onPromoteHypothesis: (rec: RecommendationItem) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  allExperiments,
  selectedExpAId,
  selectedExpBId,
  onSelectExpAId,
  onSelectExpBId,
  onPromoteHypothesis
}) => {
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [provider, setProvider] = useState<'deterministic' | 'openai' | 'gemini'>('deterministic');
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const expA = allExperiments.find((e) => e.id === selectedExpAId);
  const expB = allExperiments.find((e) => e.id === selectedExpBId);

  const isSameRun = Boolean(selectedExpAId && selectedExpBId && selectedExpAId === selectedExpBId);
  const isDatasetMismatch = Boolean(
    expA &&
    expB &&
    (expA.dataset_name !== expB.dataset_name || expA.dataset_split !== expB.dataset_split)
  );
  const isTaskMismatch = Boolean(expA && expB && expA.task_type !== expB.task_type);
  const isIncompatible = isSameRun || isDatasetMismatch || isTaskMismatch;

  const fetchAIInsights = () => {
    if (!selectedExpAId || !selectedExpBId || isIncompatible) return;
    setLoading(true);
    setError(null);
    generateInsights(selectedExpAId, selectedExpBId, provider, apiKey)
      .then((res) => {
        setInsights(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isIncompatible) {
      fetchAIInsights();
    } else {
      setInsights(null);
    }
  }, [selectedExpAId, selectedExpBId, provider, isIncompatible]);

  return (
    <div className="main-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h1>AI Experiment Insights</h1>
          <p className="workspace-timestamp">
            Evidence-grounded model behavior synthesis • Controlled experimental recommendations
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Provider Toggle */}
          <div className="header-tabs-group">
            <button
              className={`header-tab-btn ${provider === 'deterministic' ? 'active' : ''}`}
              onClick={() => {
                setProvider('deterministic');
                setShowKeyInput(false);
              }}
            >
              <Cpu size={14} style={{ display: 'inline', marginRight: 4 }} /> Deterministic Engine (Offline)
            </button>
            <button
              className={`header-tab-btn ${provider === 'gemini' ? 'active' : ''}`}
              onClick={() => {
                setProvider('gemini');
                setShowKeyInput(true);
              }}
            >
              <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} /> Google Gemini
            </button>
            <button
              className={`header-tab-btn ${provider === 'openai' ? 'active' : ''}`}
              onClick={() => {
                setProvider('openai');
                setShowKeyInput(true);
              }}
            >
              <Brain size={14} style={{ display: 'inline', marginRight: 4 }} /> OpenAI-compatible
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={fetchAIInsights}
            disabled={loading || isIncompatible}
            title="Regenerate Insights"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="workspace-body">
        {/* SYNCHRONIZED RUN SELECTORS BAR */}
        <div
          style={{
            background: '#0c172c',
            border: '1px solid #1a2c50',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 16,
            alignItems: 'center'
          }}
        >
          {/* Model A Selector */}
          <div>
            <label className="form-label" style={{ color: '#38bdf8' }}>
              Run A (Baseline / Reference)
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
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4 }}>
              Dataset: {expA?.dataset_name || 'N/A'} • Task: {expA?.task_type || 'classification'}
            </div>
          </div>

          {/* VS Divider */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#132342',
              border: '2px solid #233e70',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            VS
          </div>

          {/* Model B Selector */}
          <div>
            <label className="form-label" style={{ color: '#818cf8' }}>
              Run B (Comparison Candidate)
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
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4 }}>
              Dataset: {expB?.dataset_name || 'N/A'} • Task: {expB?.task_type || 'classification'}
            </div>
          </div>
        </div>

        {/* INCOMPATIBILITY WARNING BANNER */}
        {isIncompatible && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}
          >
            <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f87171' }}>
                Incompatible Experiment Pair
              </div>
              <div style={{ fontSize: '0.84rem', marginTop: 4, color: '#fecaca', lineHeight: 1.45 }}>
                {isSameRun &&
                  'Run A and Run B are identical. Side-by-side analysis requires two distinct experimental runs.'}
                {isDatasetMismatch &&
                  `Dataset mismatch detected: "${expA?.dataset_name}" (${expA?.dataset_split}) vs "${expB?.dataset_name}" (${expB?.dataset_split}). Scientific comparison guardrails require identical evaluation datasets and splits.`}
                {isTaskMismatch &&
                  `Task type mismatch detected: ${expA?.task_type} vs ${expB?.task_type}. Models must share the same task objective.`}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 6 }}>
                Please select compatible runs from the dropdowns above to generate grounded empirical synthesis.
              </div>
            </div>
          </div>
        )}

        {/* Error notification if any */}
        {error && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.85rem'
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            <div>
              <strong>Inference Diagnostic Notice:</strong> {error}
              <div style={{ fontSize: '0.76rem', color: '#f87171', marginTop: 2 }}>
                Falling back to deterministic rule-derived analysis. You can provide an API key above or set GEMINI_API_KEY / OPENAI_API_KEY in backend/.env.
              </div>
            </div>
          </div>
        )}

        {/* API Key Drawer if LLM mode selected */}
        {showKeyInput && provider !== 'deterministic' && (
          <div
            style={{
              background: '#0e1c38',
              border: '1px solid #233e70',
              borderRadius: 10,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <Key size={18} color="#06b6d4" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                {provider === 'gemini' ? 'Google Gemini' : 'OpenAI-compatible'} API Key (Optional Client Override)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Secrets are preferred from server environment variables ({provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}). Enter here only for session testing.
              </div>
            </div>
            <input
              type="password"
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="form-input"
              style={{ width: 280, height: 32, fontSize: '0.8rem' }}
            />
            <button className="btn-primary" onClick={fetchAIInsights} disabled={loading || isIncompatible} style={{ height: 32 }}>
              Run Analysis
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <RefreshCw size={28} className="spin" style={{ color: '#06b6d4', marginBottom: 12 }} />
            <div style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 500 }}>
              Synthesizing Cross-Model Empirical Evidence...
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
              Comparing metric trade-offs, confidence calibration, and error distributions
            </div>
          </div>
        )}

        {/* Engine Status Banner */}
        {!loading && !isIncompatible && insights && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#06b6d4" />
              <span style={{ color: '#e2e8f0' }}>
                Diagnostic Engine: <strong>{insights.provider_used}</strong>
              </span>
            </div>
            <span style={{ color: '#64748b' }}>
              Comparing {expA?.name} vs {expB?.name}
            </span>
          </div>
        )}

        {/* Executive Summary Card */}
        {!isIncompatible && insights && (
          <div className="stat-card" style={{ padding: '24px' }}>
            <div className="card-header-label" style={{ marginBottom: 12 }}>
              <span>Executive Synthesis & Diagnostic Summary</span>
              <span className="loss-delta-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                Evidence Grounded
              </span>
            </div>
            <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              {insights.summary}
            </p>
          </div>
        )}

        {/* STRUCTURED FINDINGS */}
        {!isIncompatible && insights && (
          <div>
            <h2 className="section-title">Measured Diagnostic Findings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {insights.findings.map((f, idx) => {
                const getCategoryStyle = (cat: string) => {
                  if (cat.includes('Observation') || cat.includes('Measured')) {
                    return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' };
                  }
                  if (cat.includes('Rule') || cat.includes('Trade-off')) {
                    return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' };
                  }
                  if (cat.includes('Recommendation')) {
                    return { bg: 'rgba(52, 211, 153, 0.2)', text: '#34d399' };
                  }
                  return { bg: 'rgba(139, 92, 246, 0.2)', text: '#c084fc' };
                };
                const catStyle = getCategoryStyle(f.category);

                return (
                  <div key={idx} className="stat-card" style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className="loss-delta-badge"
                          style={{
                            background: catStyle.bg,
                            color: catStyle.text
                          }}
                        >
                          {f.category}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                          {f.title}
                        </h4>
                      </div>

                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Confidence: <strong>{f.confidence_level}</strong>
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 10 }}>
                      {f.description}
                    </p>

                    <div
                      style={{
                        background: '#091325',
                        border: '1px solid #172746',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        color: '#94a3b8'
                      }}
                    >
                      <strong style={{ color: '#e2e8f0' }}>Empirical Evidence: </strong>
                      {f.evidence}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLLED FOLLOW-UP EXPERIMENTAL PROPOSALS */}
        {!isIncompatible && insights && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                Controlled Follow-Up Experiment Recommendations
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Convert directly into testable hypothesis records
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {insights.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="stat-card"
                  style={{
                    background: 'linear-gradient(145deg, #0d1a33 0%, #112242 100%)',
                    border: '1px solid #1f3763',
                    padding: '22px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Lightbulb size={18} color="#f59e0b" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        {rec.title}
                      </h4>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Proposed Hypothesis
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: 2, lineHeight: 1.45 }}>
                      "{rec.hypothesis_proposal}"
                    </p>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Controlled Variable
                    </div>
                    <div className="metadata-badge" style={{ marginTop: 2, display: 'inline-block' }}>
                      {rec.controlled_variable}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    <strong style={{ color: '#cbd5e1' }}>Scientific Rationale: </strong>
                    {rec.rationale}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: 12,
                      borderTop: '1px solid #1a2e54'
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
                      Expected: {rec.expected_impact}
                    </span>

                    <button
                      className="btn-create-hypothesis"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => onPromoteHypothesis(rec)}
                    >
                      Promote to Hypothesis <Tag size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
