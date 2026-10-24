import React, { useState } from 'react';
import { Experiment } from '../types';
import { importExperiment, importExperimentCsv, exportExperiment } from '../api';
import { X, Upload, Download, Database, CheckCircle, AlertTriangle, FileText, Table } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeExperiment: Experiment;
  onImportSuccess: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  activeExperiment,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import_json' | 'import_csv'>('export');
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvExpName, setCsvExpName] = useState('My Custom Model Experiment');
  const [csvTaskType, setCsvTaskType] = useState('classification');
  const [csvArchitecture, setCsvArchitecture] = useState('Custom Architecture');
  const [csvDataset, setCsvDataset] = useState('Benchmark-Dataset-v1');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const data = await exportExperiment(activeExperiment.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experimentpilot_${activeExperiment.id}_v1.0.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ text: `Successfully exported ${activeExperiment.name} (v1.0 JSON format)`, isError: false });
    } catch (e: any) {
      setStatusMsg({ text: e.message, isError: true });
    }
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) {
      setStatusMsg({ text: 'Please enter or upload a valid JSON payload.', isError: true });
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await importExperiment(parsed);
      setStatusMsg({
        text: `Successfully imported "${res.experiment?.name || res.imported_id}" with ${res.sample_count || 0} evaluated samples!`,
        isError: false
      });
      onImportSuccess();
      setTimeout(onClose, 1400);
    } catch (e: any) {
      setStatusMsg({ text: `JSON Import Error: ${e.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      setStatusMsg({ text: 'Please paste or upload CSV prediction rows.', isError: true });
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: csvExpName.trim() || 'Imported Model Experiment',
        csv_text: csvText,
        task_type: csvTaskType,
        model_family: 'Custom Evaluation',
        architecture: csvArchitecture,
        dataset_name: csvDataset,
        dataset_split: 'Holdout Evaluation Split',
        dataset_size: 'CSV Batch',
        evaluation_protocol: 'Empirical Verification'
      };
      const res = await importExperimentCsv(payload);
      const metricsSummary = res.calculated_metrics
        ? Object.entries(res.calculated_metrics)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : '';
      setStatusMsg({
        text: `CSV Imported successfully! (${res.sample_count} samples validated. Calculated: ${metricsSummary})`,
        isError: false
      });
      onImportSuccess();
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setStatusMsg({ text: `CSV Import Error: ${e.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'csv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ text: 'File size limit exceeded: maximum allowed file size is 5MB.', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === 'json') {
        setJsonText(content);
      } else {
        setCsvText(content);
      }
      setStatusMsg({ text: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, isError: false });
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} color="#06b6d4" /> Data Portability: Import & Export
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="header-tabs-group" style={{ marginBottom: 18 }}>
          <button
            className={`header-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => { setActiveTab('export'); setStatusMsg(null); }}
          >
            <Download size={14} style={{ display: 'inline', marginRight: 4 }} /> Export Active Run
          </button>
          <button
            className={`header-tab-btn ${activeTab === 'import_json' ? 'active' : ''}`}
            onClick={() => { setActiveTab('import_json'); setStatusMsg(null); }}
          >
            <FileText size={14} style={{ display: 'inline', marginRight: 4 }} /> Import JSON (v1.0)
          </button>
          <button
            className={`header-tab-btn ${activeTab === 'import_csv' ? 'active' : ''}`}
            onClick={() => { setActiveTab('import_csv'); setStatusMsg(null); }}
          >
            <Table size={14} style={{ display: 'inline', marginRight: 4 }} /> Ingest CSV Results
          </button>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: statusMsg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: statusMsg.isError ? '#f87171' : '#34d399',
              border: `1px solid ${statusMsg.isError ? '#ef4444' : '#10b981'}`
            }}
          >
            {statusMsg.isError ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            {statusMsg.text}
          </div>
        )}

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: 16, lineHeight: 1.5 }}>
              Export the complete experiment record for <strong>{activeExperiment.name}</strong> as versioned JSON (v1.0),
              including all hyperparameter configurations, metrics, and case-level predictions.
            </p>
            <div style={{ background: '#080d1a', padding: '12px 16px', borderRadius: 8, border: '1px solid #1e305b', marginBottom: 18 }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Selected Record:</div>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{activeExperiment.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#06b6d4', marginTop: 4 }}>
                ID: {activeExperiment.id} • {activeExperiment.dataset_name} • {activeExperiment.case_count} samples
              </div>
            </div>
            <button className="btn-primary" onClick={handleExport} style={{ padding: '10px 20px' }}>
              <Download size={16} /> Download {activeExperiment.id}.json
            </button>
          </div>
        )}

        {/* Tab 2: Import JSON */}
        {activeTab === 'import_json' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Versioned Experiment JSON (v1.0)</label>
              <label style={{ fontSize: '0.78rem', color: '#8b5cf6', cursor: 'pointer', textDecoration: 'underline' }}>
                <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
                Browse File (.json)
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'json')}
                />
              </label>
            </div>
            <textarea
              className="form-textarea"
              rows={7}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{
  "version": "1.0",
  "experiment": {
    "name": "Custom Model Run",
    "task_type": "classification",
    "model_family": "Vision Transformer",
    "architecture": "ViT-B/16",
    "dataset_name": "RSNA-ICH-Synthetic-24Slice",
    "dataset_split": "Validation Split A",
    "dataset_size": "200 scans",
    "evaluation_protocol": "Patient-stratified 5-fold CV",
    "hyperparameters": { "lr": 0.001, "batch_size": 32 },
    "metrics": { "accuracy": 0.91, "f1_macro": 0.90 }
  }
}`}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
              <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleImportJson} disabled={isSubmitting}>
                <Upload size={16} /> {isSubmitting ? 'Ingesting...' : 'Ingest & Validate JSON'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Import CSV */}
        {activeTab === 'import_csv' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Experiment Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={csvExpName}
                  onChange={(e) => setCsvExpName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Task Type</label>
                <select
                  className="form-input"
                  value={csvTaskType}
                  onChange={(e) => setCsvTaskType(e.target.value)}
                >
                  <option value="classification">Classification (Binary / Multi-class)</option>
                  <option value="regression">Regression (Continuous Residuals)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Architecture / Backbone</label>
                <input
                  type="text"
                  className="form-input"
                  value={csvArchitecture}
                  onChange={(e) => setCsvArchitecture(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dataset Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={csvDataset}
                  onChange={(e) => setCsvDataset(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Paste CSV Prediction Rows
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 8 }}>
                  {csvTaskType === 'regression'
                    ? '(Headers: case_id, continuous_true, continuous_prediction)'
                    : '(Headers: case_id, true_label, predicted_label, probability, confidence)'}
                </span>
              </label>
              <label style={{ fontSize: '0.78rem', color: '#06b6d4', cursor: 'pointer', textDecoration: 'underline' }}>
                <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
                Browse File (.csv)
                <input
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'csv')}
                />
              </label>
            </div>

            <textarea
              className="form-textarea"
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={
                csvTaskType === 'regression'
                  ? `case_id,continuous_true,continuous_prediction\nSAMPLE-001,15.2,14.8\nSAMPLE-002,28.4,29.1\nSAMPLE-003,10.0,10.3`
                  : `case_id,true_label,predicted_label,probability,confidence\nSCAN-1001,1,1,0.92,0.92\nSCAN-1002,0,0,0.08,0.92\nSCAN-1003,1,0,0.42,0.58\nSCAN-1004,0,1,0.85,0.85`
              }
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
              <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleImportCsv} disabled={isSubmitting}>
                <Table size={16} /> {isSubmitting ? 'Calculating...' : 'Ingest & Compute Metrics'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
