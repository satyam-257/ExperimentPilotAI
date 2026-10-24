import React, { useState } from 'react';
import { Hypothesis } from '../types';
import {
  Lightbulb,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface HypothesisDrawerProps {
  hypotheses: Hypothesis[];
  onSelectHypothesis?: (hyp: Hypothesis) => void;
  onOpenCreateModal: () => void;
}

export const HypothesisDrawer: React.FC<HypothesisDrawerProps> = ({
  hypotheses,
  onSelectHypothesis,
  onOpenCreateModal
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <aside className={`flow-pane ${isCollapsed ? 'collapsed' : ''}`}>
      {isCollapsed ? (
        /* Collapsed narrow rail */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 8px',
            height: '100%',
            gap: 16
          }}
        >
          <button
            className="btn-secondary"
            style={{
              padding: '6px',
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setIsCollapsed(false)}
            title="Expand Experiment Flow"
          >
            <ChevronRight size={18} />
          </button>

          <button
            className="btn-primary"
            style={{
              padding: '6px',
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={onOpenCreateModal}
            title="Add New Hypothesis"
          >
            <Plus size={16} />
          </button>

          <div
            onClick={() => setIsCollapsed(false)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              marginTop: 12
            }}
            title="Click to view hypotheses"
          >
            <div style={{ position: 'relative' }}>
              <Lightbulb size={20} color="#8b5cf6" />
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  background: '#8b5cf6',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {hypotheses.length}
              </span>
            </div>

            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '0.74rem',
                color: '#64748b',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 12
              }}
            >
              Experiment Flow
            </div>
          </div>
        </div>
      ) : (
        /* Expanded full drawer */
        <>
          <div
            className="flow-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h2 className="flow-title">Experiment Flow</h2>
              <p className="flow-subtitle">{hypotheses.length} Hypotheses Tracked</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                onClick={onOpenCreateModal}
                title="Create New Hypothesis"
              >
                <Plus size={13} /> New
              </button>
              <button
                className="btn-secondary"
                style={{
                  padding: '4px',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setIsCollapsed(true)}
                title="Collapse Drawer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>

          <div className="flow-divider" />

          <div className="flow-hypotheses-list">
            {hypotheses.map((hyp) => (
              <div
                key={hyp.id}
                className="flow-hypo-card"
                onClick={() => onSelectHypothesis && onSelectHypothesis(hyp)}
              >
                <div className="flow-hypo-header">
                  <span className="flow-hypo-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={16} color="#8b5cf6" />
                    {hyp.title || 'Hypothesis'}
                  </span>
                </div>

                <p className="flow-hypo-body">
                  {hyp.rationale.length > 110
                    ? `${hyp.rationale.slice(0, 110)}...`
                    : hyp.rationale}
                </p>

                <div className="flow-hypo-footer">
                  <span className={`hypo-status-badge hypo-status-${hyp.status.replace(/\s+/g, '')}`}>
                    {hyp.status}
                  </span>
                  {hyp.tags && hyp.tags.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={11} /> {hyp.tags[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {hypotheses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '0.85rem' }}>
                No hypotheses logged yet. Use the New button or AI Insights to propose one.
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
