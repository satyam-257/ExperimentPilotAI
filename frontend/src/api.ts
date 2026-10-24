import {
  Experiment,
  ComparisonResponse,
  ExplorerResponse,
  InsightResponse,
  Hypothesis
} from './types';

const BASE_URL = '/api';

export async function fetchExperiments(): Promise<Experiment[]> {
  const res = await fetch(`${BASE_URL}/experiments`);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  return res.json();
}

export async function fetchExperiment(id: string): Promise<Experiment> {
  const res = await fetch(`${BASE_URL}/experiments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch experiment');
  return res.json();
}

export async function createExperiment(data: any): Promise<Experiment> {
  const res = await fetch(`${BASE_URL}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create experiment');
  return res.json();
}

export async function deleteExperiment(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/experiments/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete experiment');
}

export async function compareExperiments(
  expAId: string,
  expBId: string
): Promise<ComparisonResponse> {
  const res = await fetch(`${BASE_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experiment_a_id: expAId,
      experiment_b_id: expBId
    })
  });
  if (!res.ok) throw new Error('Failed to compare experiments');
  return res.json();
}

export async function fetchExplorerCases(
  expAId: string,
  expBId: string,
  filterType: string = 'all',
  search?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<ExplorerResponse> {
  const params = new URLSearchParams({
    exp_a_id: expAId,
    exp_b_id: expBId,
    filter_type: filterType,
    page: page.toString(),
    page_size: pageSize.toString()
  });
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/explorer/cases?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch explorer cases');
  return res.json();
}

export async function generateInsights(
  expAId: string,
  expBId: string,
  provider: string = 'deterministic',
  apiKey?: string
): Promise<InsightResponse> {
  const res = await fetch(`${BASE_URL}/insights/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experiment_a_id: expAId,
      experiment_b_id: expBId,
      provider,
      api_key: apiKey
    })
  });
  if (!res.ok) throw new Error('Failed to generate insights');
  return res.json();
}

export async function fetchHypotheses(): Promise<Hypothesis[]> {
  const res = await fetch(`${BASE_URL}/hypotheses`);
  if (!res.ok) throw new Error('Failed to fetch hypotheses');
  return res.json();
}

export async function createHypothesis(data: {
  title: string;
  rationale: string;
  status: string;
  experiment_id?: string;
  tags?: string[];
}): Promise<Hypothesis> {
  const res = await fetch(`${BASE_URL}/hypotheses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create hypothesis');
  return res.json();
}

export async function updateHypothesis(
  id: string,
  data: Partial<Hypothesis>
): Promise<void> {
  const res = await fetch(`${BASE_URL}/hypotheses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update hypothesis');
}

export async function reseedData(): Promise<void> {
  const res = await fetch(`${BASE_URL}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reseed database');
}

export async function importExperiment(data: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to import experiment');
  }
  return res.json();
}

export async function importExperimentCsv(payload: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/import/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to import CSV');
  }
  return res.json();
}

export async function exportExperiment(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/export/${id}`);
  if (!res.ok) throw new Error('Failed to export experiment');
  return res.json();
}
