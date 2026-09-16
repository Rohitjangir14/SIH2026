import {
  ProcessedLog,
  ProcessingJob,
  DetectionResult,
  ParserPlugin,
  AnalyticsSummary,
  SourceDistribution,
  SeverityDistribution,
  TimelinePoint,
} from '../types';

const API_BASE = '/api/v1';

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error('Failed to fetch analytics summary');
  return res.json();
}

export async function fetchSourceDistribution(): Promise<SourceDistribution[]> {
  const res = await fetch(`${API_BASE}/analytics/by-source`);
  if (!res.ok) throw new Error('Failed to fetch source distribution');
  return res.json();
}

export async function fetchSeverityDistribution(): Promise<SeverityDistribution[]> {
  const res = await fetch(`${API_BASE}/analytics/by-severity`);
  if (!res.ok) throw new Error('Failed to fetch severity distribution');
  return res.json();
}

export async function fetchTimeline(): Promise<TimelinePoint[]> {
  const res = await fetch(`${API_BASE}/analytics/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline data');
  return res.json();
}

export async function runStressBenchmark(num_records: number = 5000): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/benchmark?num_records=${num_records}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run stress benchmark');
  return res.json();
}

export interface LogFilterParams {
  query?: string;
  severity?: string;
  source_type?: string;
  source_name?: string;
  host?: string;
  user?: string;
  ip_address?: string;
  event_type?: string;
  page?: number;
  page_size?: number;
}

export async function fetchLogs(params: LogFilterParams = {}): Promise<ProcessedLog[]> {
  const queryParts: string[] = [];
  if (params.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
  if (params.severity && params.severity !== 'ALL') queryParts.push(`severity=${encodeURIComponent(params.severity)}`);
  if (params.source_type && params.source_type !== 'ALL') queryParts.push(`source_type=${encodeURIComponent(params.source_type)}`);
  if (params.source_name) queryParts.push(`source_name=${encodeURIComponent(params.source_name)}`);
  if (params.host) queryParts.push(`host=${encodeURIComponent(params.host)}`);
  if (params.ip_address) queryParts.push(`ip_address=${encodeURIComponent(params.ip_address)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.page_size) queryParts.push(`page_size=${params.page_size}`);

  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
  const res = await fetch(`${API_BASE}/logs${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchLogDetail(id: string): Promise<ProcessedLog> {
  const res = await fetch(`${API_BASE}/logs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch log details');
  return res.json();
}

export async function fetchJobs(): Promise<ProcessingJob[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch processing jobs');
  return res.json();
}

export async function fetchJobDetail(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch job details');
  return res.json();
}

export async function fetchParsers(): Promise<ParserPlugin[]> {
  const res = await fetch(`${API_BASE}/parsers`);
  if (!res.ok) throw new Error('Failed to fetch parser list');
  return res.json();
}

export async function testParserSandbox(parser_name: string, sample_log: string): Promise<any> {
  const res = await fetch(`${API_BASE}/parsers/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parser_name, sample_log }),
  });
  if (!res.ok) throw new Error('Parser test request failed');
  return res.json();
}

export async function createCustomParser(data: {
  name: string;
  format_key: string;
  regex_pattern: string;
  description?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/parsers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create parser plugin');
  }
  return res.json();
}

export async function detectFormat(sample_content: string, filename?: string): Promise<DetectionResult> {
  const form = new FormData();
  form.append('sample_content', sample_content);
  if (filename) form.append('filename', filename);

  const res = await fetch(`${API_BASE}/logs/detect`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Format detection failed');
  return res.json();
}

export async function uploadLogFile(file: File, source_name: string, forced_format: string = 'auto'): Promise<ProcessingJob> {
  const form = new FormData();
  form.append('file', file);
  form.append('source_name', source_name);
  form.append('forced_format', forced_format);

  const res = await fetch(`${API_BASE}/logs/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('File upload and processing failed');
  return res.json();
}

export async function pasteLogText(raw_content: string, source_name: string, forced_format: string = 'auto'): Promise<ProcessingJob> {
  const form = new FormData();
  form.append('raw_content', raw_content);
  form.append('source_name', source_name);
  form.append('forced_format', forced_format);

  const res = await fetch(`${API_BASE}/logs/paste`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Log paste processing failed');
  return res.json();
}

export function getExportUrl(format: 'json' | 'csv', severity?: string, source_type?: string): string {
  const parts = [`format=${format}`];
  if (severity && severity !== 'ALL') parts.push(`severity=${encodeURIComponent(severity)}`);
  if (source_type && source_type !== 'ALL') parts.push(`source_type=${encodeURIComponent(source_type)}`);
  return `${API_BASE}/logs/export?${parts.join('&')}`;
}
