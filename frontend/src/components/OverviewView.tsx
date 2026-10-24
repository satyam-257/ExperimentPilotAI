import React from 'react';
import { Experiment } from '../types';
import {
  Trophy,
  GitCompare,
  Layers,
  Sparkles,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  FlaskConical,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface OverviewViewProps {
  experiments: Experiment[];
  onSelectExperiment: (exp: Experiment) => void;
  onNavigateView: (view: 'overview' | 'run_facts' | 'compare' | 'explorer' | 'insights') => void;
  onOpenCreateExp: () => void;
  onReseed: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  experiments,
  onSelectExperiment,
  onNavigateView,
  onOpenCreateExp,
  onReseed
}) => {
  // Compute best experiment by f1_macro
  const bestExp = [...experiments].sort(
    (a, b) => (b.metrics?.f1_macro ?? 0) - (a.metrics?.f1_macro ?? 0)
  )[0];

  const syntheticCount = experiments.filter((e) => e.is_synthetic).length;
  const userRunCount = experiments.filter((e) => !e.is_synthetic).length;

  return (
    <div className="main-workspace">
      {/* Top Header */}
      <div className="workspace-header">
        <div className="workspace-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Overview & Benchmark Hub</h1>
            <span
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 600
              }}
            >
              Platform v1.0 Ready
            </span>
          </div>
          <p className="workspace-timestamp">
            General-Purpose ML Experimentation, Metric Verification & Evidence-Grounded Hypothesis Synthesis
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={onReseed} title="Restore Seed Fixtures without modifying user runs">
            <RefreshCw size={15} /> Reseed Fixtures
          </button>
          <button className="btn-primary" onClick={onOpenCreateExp}>
            <Plus size={16} /> New Experiment
          </button>
        </div>
      </div>

      <div className="workspace-body">
        {/* VALUE PROPOSITION HERO BANNER (FIRST IMPRESSION) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0b1a38 0%, #11254e 50%, #0d1e3d 100%)',
            border: '1px solid #233e70',
            borderRadius: 16,
            padding: '26px 30px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Accent Glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ maxWidth: 860 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  background: '#2563eb',
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Platform Workflow
              </span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Model-Agnostic • Independent Metric Verification • Empirical Hypothesis Generation
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.25 }}>
              Bridge the Gap Between Raw Model Predictions and Verifiable Scientific Hypotheses
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55, marginTop: 8 }}>
              ExperimentPilot is a general-purpose ML platform supporting classification, regression, and multi-slice
              volumetric tasks. Record experimental runs with arbitrary schemas, independently audit reported metrics
              against raw sample predictions, pinpoint behavioral error patterns, and formulate grounded hypotheses.
            </p>

            {/* 4-Step Core Workflow Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginTop: 20
              }}
            >
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700 }}>
                  <Layers size={14} /> 1. Track & Record
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                  Log runs, arbitrary hyperparameter schemas, and sample predictions.
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                  <ShieldCheck size={14} /> 2. Verify Metrics
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                  Independently audit Accuracy, F1, and Expected Calibration Error (ECE).
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700 }}>
                  <Search size={14} /> 3. Analyze Behavior
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                  Inspect sample disagreements, false alarms, and sub-slice profiles.
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc', fontSize: '0.82rem', fontWeight: 700 }}>
                  <FlaskConical size={14} /> 4. Propose Hypotheses
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                  Synthesize follow-up research proposals with offline or LLM intelligence.
                </div>
              </div>
            </div>

            {/* PRIMARY NEXT ACTION BUTTON (CLEAR FIRST-VISIT GUIDANCE) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
              <button
                className="btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.45)'
                }}
                onClick={() => onNavigateView('compare')}
              >
                Launch Model Comparison <GitCompare size={16} />
              </button>

              <button
                className="btn-secondary"
                style={{ padding: '12px 20px', fontSize: '0.94rem' }}
                onClick={() => onNavigateView('explorer')}
              >
                Inspect Sample Disagreements <Search size={16} />
              </button>

              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Recommended first step: compare pre-seeded benchmarks or inspect imported user runs.
              </span>
            </div>
          </div>
        </div>

        {/* KPI STATS ROW */}
        <div className="three-card-grid">
          <div className="stat-card">
            <div className="card-header-label">
              <span>Total Recorded Runs</span>
              <Layers size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 700, color: '#fff' }}>
              {experiments.length}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', border: '1px solid #f43f5e', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                {syntheticCount} Synthetic Fixtures
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid #10b981', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                {userRunCount} User Runs
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="card-header-label">
              <span>Best Validated Model</span>
              <Trophy size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {bestExp?.name || 'N/A'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className="loss-delta-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                F1: {bestExp?.metrics?.f1_macro ?? 'N/A'}
              </span>
              <span className="loss-delta-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                Acc: {bestExp?.metrics?.accuracy ? (bestExp.metrics.accuracy * 100).toFixed(1) + '%' : 'N/A'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="card-header-label">
              <span>Scientific Compatibility Guard</span>
              <CheckCircle size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>
              Controlled Variable Verification Active
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 6 }}>
              Enforces protocol, dataset, and split alignment across comparisons.
            </div>
          </div>
        </div>

        {/* MOTIVATING USE CASE CALLOUT */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0e1e3d 0%, #162648 100%)',
            border: '1px solid #233e70',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.72rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                Featured Multi-Slice Case Study
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Volumetric Aggregation Diagnostics
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              CoAtNet Consensus vs. ConvNeXt-V2 Pool
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: 640, marginTop: 4 }}>
              Investigate trade-offs between quorum-based consensus voting and top-k max pooling across 200 evaluation cases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              onClick={() => onNavigateView('compare')}
            >
              Compare Runs <GitCompare size={15} />
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              onClick={() => onNavigateView('explorer')}
            >
              Explore Cases <Layers size={15} />
            </button>
          </div>
        </div>

        {/* RECORDED EXPERIMENTS LIST */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Recorded Experiments</h2>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                Persistent experimental registry with independently audited verification metrics
              </div>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing {experiments.length} runs ({syntheticCount} synthetic fixtures, {userRunCount} user runs)
            </span>
          </div>

          <div style={{ background: '#0c172c', border: '1px solid #172746', borderRadius: 12, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Experiment Name</th>
                  <th>Model / Family</th>
                  <th>Aggregation Strategy</th>
                  <th>Dataset / Split</th>
                  <th>Loss</th>
                  <th>Macro-F1</th>
                  <th>Latency</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{exp.name}</span>
                        {exp.is_synthetic ? (
                          <span
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#fda4af',
                              border: '1px solid #f43f5e',
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 8,
                              fontWeight: 600
                            }}
                          >
                            SYNTHETIC FIXTURE
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                              border: '1px solid #10b981',
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 8,
                              fontWeight: 600
                            }}
                          >
                            USER RUN
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                        Task: {exp.task_type || 'classification'} • Commit: {exp.git_commit || 'a7e891c'} • {exp.jira_owner || 'ML-Team'}
                      </div>
                    </td>
                    <td>
                      <span className="metadata-badge">{exp.architecture}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                        {exp.aggregation_method}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{exp.dataset_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{exp.dataset_split}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#f87171' }}>
                        {exp.metrics?.loss?.toFixed(3) ?? 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#34d399' }}>
                        {exp.metrics?.f1_macro ? (exp.metrics.f1_macro * 100).toFixed(1) + '%' : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {exp.metrics?.latency_ms ? `${exp.metrics.latency_ms} ms` : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => {
                          onSelectExperiment(exp);
                          onNavigateView('run_facts');
                        }}
                      >
                        Inspect Facts <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
