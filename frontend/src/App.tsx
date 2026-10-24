import React, { useState, useEffect } from 'react';
import { Experiment, Hypothesis, RecommendationItem } from './types';
import {
  fetchExperiments,
  fetchHypotheses,
  createHypothesis,
  createExperiment,
  reseedData
} from './api';
import { Sidebar } from './components/Sidebar';
import { HypothesisDrawer } from './components/HypothesisDrawer';
import { RunFactsView } from './components/RunFactsView';
import { OverviewView } from './components/OverviewView';
import { ModelComparisonView } from './components/ModelComparisonView';
import { BehaviorExplorerView } from './components/BehaviorExplorerView';
import { AIInsightsView } from './components/AIInsightsView';
import { CreateHypothesisModal } from './components/CreateHypothesisModal';
import { CreateExperimentModal } from './components/CreateExperimentModal';
import { ImportExportModal } from './components/ImportExportModal';

export function App() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [currentView, setCurrentView] = useState<
    'overview' | 'run_facts' | 'compare' | 'explorer' | 'insights'
  >('overview');
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [selectedExpAId, setSelectedExpAId] = useState<string>('exp_coatnet_consensus');
  const [selectedExpBId, setSelectedExpBId] = useState<string>('exp_convnext_pool');
  const [activeHeaderTab, setActiveHeaderTab] = useState<'Run Facts' | 'Demo Space' | 'Analysis'>('Run Facts');

  // Modals
  const [showCreateHypo, setShowCreateHypo] = useState<boolean>(false);
  const [showCreateExp, setShowCreateExp] = useState<boolean>(false);
  const [showImportExport, setShowImportExport] = useState<boolean>(false);
  const [prefillHypo, setPrefillHypo] = useState<RecommendationItem | null>(null);

  const loadData = async () => {
    try {
      const exps = await fetchExperiments();
      setExperiments(exps);
      if (exps.length > 0) {
        // Default to ConvNeXt-V2 Pool (Run #2) to match reference mockup visually
        const defaultExp = exps.find((x) => x.id === 'exp_convnext_pool') || exps[0];
        setActiveExperiment(defaultExp);
      }

      const hyps = await fetchHypotheses();
      setHypotheses(hyps);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHypothesis = async (data: any) => {
    try {
      const created = await createHypothesis(data);
      setHypotheses((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to create hypothesis:', err);
    }
  };

  const handleCreateExperiment = async (data: any) => {
    try {
      const created = await createExperiment(data);
      setExperiments((prev) => [created, ...prev]);
      setActiveExperiment(created);
      setCurrentView('run_facts');
    } catch (err) {
      console.error('Failed to create experiment:', err);
    }
  };

  const handleReseed = async () => {
    try {
      await reseedData();
      await loadData();
    } catch (err) {
      console.error('Reseed failed:', err);
    }
  };

  const handlePromoteHypothesis = (rec: RecommendationItem) => {
    setPrefillHypo(rec);
    setShowCreateHypo(true);
  };

  const handleNavigateHeaderTab = (tab: 'Run Facts' | 'Demo Space' | 'Analysis') => {
    setActiveHeaderTab(tab);
    if (tab === 'Demo Space') {
      setCurrentView('explorer');
    } else if (tab === 'Analysis') {
      setCurrentView('insights');
    } else {
      setCurrentView('run_facts');
    }
  };

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Rail */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          if (v === 'run_facts') setActiveHeaderTab('Run Facts');
        }}
        onOpenCreateExp={() => setShowCreateExp(true)}
        onOpenImportExport={() => setShowImportExport(true)}
      />

      {/* 2. Middle Flow Pane (Experiment Flow & Hypotheses Timeline) */}
      <HypothesisDrawer
        hypotheses={hypotheses}
        onOpenCreateModal={() => {
          setPrefillHypo(null);
          setShowCreateHypo(true);
        }}
      />

      {/* 3. Main Workspace Area */}
      {currentView === 'run_facts' && activeExperiment && (
        <RunFactsView
          experiment={activeExperiment}
          allExperiments={experiments}
          onSelectExperiment={(exp) => setActiveExperiment(exp)}
          onOpenCreateHypothesis={() => {
            setPrefillHypo(null);
            setShowCreateHypo(true);
          }}
          onNavigateTab={handleNavigateHeaderTab}
          activeTab={activeHeaderTab}
        />
      )}

      {currentView === 'overview' && (
        <OverviewView
          experiments={experiments}
          onSelectExperiment={(exp) => {
            setActiveExperiment(exp);
            setCurrentView('run_facts');
          }}
          onNavigateView={(v) => setCurrentView(v)}
          onOpenCreateExp={() => setShowCreateExp(true)}
          onReseed={handleReseed}
        />
      )}

      {currentView === 'compare' && (
        <ModelComparisonView
          allExperiments={experiments}
          selectedExpAId={selectedExpAId}
          selectedExpBId={selectedExpBId}
          onSelectExpAId={setSelectedExpAId}
          onSelectExpBId={setSelectedExpBId}
          onNavigateToExplorer={() => setCurrentView('explorer')}
          onNavigateToInsights={() => setCurrentView('insights')}
        />
      )}

      {currentView === 'explorer' && (
        <BehaviorExplorerView
          allExperiments={experiments}
          selectedExpAId={selectedExpAId}
          selectedExpBId={selectedExpBId}
          onSelectExpAId={setSelectedExpAId}
          onSelectExpBId={setSelectedExpBId}
          onOpenCreateHypothesis={() => {
            setPrefillHypo(null);
            setShowCreateHypo(true);
          }}
        />
      )}

      {currentView === 'insights' && (
        <AIInsightsView
          allExperiments={experiments}
          selectedExpAId={selectedExpAId}
          selectedExpBId={selectedExpBId}
          onSelectExpAId={setSelectedExpAId}
          onSelectExpBId={setSelectedExpBId}
          onPromoteHypothesis={handlePromoteHypothesis}
        />
      )}

      {/* Modals */}
      <CreateHypothesisModal
        isOpen={showCreateHypo}
        onClose={() => setShowCreateHypo(false)}
        onSubmit={handleCreateHypothesis}
        prefill={prefillHypo}
        activeExperimentId={activeExperiment?.id}
      />

      <CreateExperimentModal
        isOpen={showCreateExp}
        onClose={() => setShowCreateExp(false)}
        onSubmit={handleCreateExperiment}
      />

      {activeExperiment && (
        <ImportExportModal
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          activeExperiment={activeExperiment}
          onImportSuccess={loadData}
        />
      )}
    </div>
  );
}

export default App;
