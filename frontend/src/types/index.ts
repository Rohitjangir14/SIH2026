export interface ProcessedLog {
  id: string;
  raw_log_id?: string;
  job_id?: string;
  timestamp: string;
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'UNKNOWN';
  event_type?: string;
  message: string;
  host?: string;
  user?: string;
  ip_address?: string;
  application?: string;
  environment?: string;
  source_type?: string;
  source_name?: string;
  metadata_json: Record<string, any>;
  is_valid: boolean;
  created_at: string;
  raw_content?: string;
}

export interface ProcessingJob {
  id: string;
  source: string;
  file_name?: string;
  detected_format?: string;
  parser_used?: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  error_message?: string;
  success_rate: number;
}

export interface DetectionCandidate {
  format: string;
  parser_name: string;
  confidence: number;
  reason: string;
}

export interface DetectionResult {
  detected_format: string;
  recommended_parser: string;
  confidence: number;
  reason: string;
  candidates: DetectionCandidate[];
  sample_preview?: string;
}

export interface ParserPlugin {
  name: string;
  format_key: string;
  description?: string;
  is_builtin: boolean;
  version?: string;
}

export interface AnalyticsSummary {
  total_logs: number;
  processed_logs: number;
  failed_logs: number;
  error_logs: number;
  warning_logs: number;
  info_logs: number;
  debug_logs: number;
  critical_logs: number;
  success_rate: number;
  error_rate: number;
  avg_processing_time_ms: number;
  total_jobs: number;
}

export interface SourceDistribution {
  source: string;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  color: string;
}

export interface TimelinePoint {
  time_bucket: string;
  count: number;
  error_count: number;
}
