import React, { useEffect, useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  RefreshCw,
  Zap,
  ChevronRight,
  X,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import { AnalyticsSummary, SourceDistribution, SeverityDistribution, ProcessingJob } from '../types';
import { fetchAnalyticsSummary, fetchSourceDistribution, fetchSeverityDistribution, fetchJobs } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

interface PipelineStep {
  step: string;
  name: string;
  subtitle: string;
  gradient: string;
  detail: {
    title: string;
    objective: string;
    throughput: string;
    guarantee: string;
    specs: string[];
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sources, setSources] = useState<SourceDistribution[]>([]);
  const [severities, setSeverities] = useState<SeverityDistribution[]>([]);
  const [recentJobs, setRecentJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected pipeline stage modal state
  const [selectedStage, setSelectedStage] = useState<PipelineStep | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, srcData, sevData, jobsData] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchSourceDistribution(),
        fetchSeverityDistribution(),
        fetchJobs(),
      ]);
      setSummary(sumData);
      setSources(srcData);
      setSeverities(sevData);
      setRecentJobs(jobsData.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const PIPELINE_STEPS: PipelineStep[] = [
    {
      step: '01',
      name: 'Ingestion Layer',
      subtitle: 'Multi-Source Feeds',
      gradient: 'from-blue-600 to-cyan-500',
      detail: {
        title: 'Step 1: Universal Ingestion Layer',
        objective: 'Accept heterogeneous log streams via REST API, file batch upload, drag-and-drop, and network listeners.',
        throughput: 'Network line-rate streaming supported',
        guarantee: 'Zero schema friction: accepts unknown, semi-structured, and legacy log shapes without configuration.',
        specs: [
          'Direct HTTP POST JSON / Multipart Upload',
          'Support for .log, .txt, .json, .csv, and raw Syslog packets',
          'Automatic batching into chunks of records for optimal DB transaction write performance',
        ],
      },
    },
    {
      step: '02',
      name: 'Raw Storage',
      subtitle: 'Immutable & Lossless',
      gradient: 'from-cyan-500 to-teal-500',
      detail: {
        title: 'Step 2: Immutable Raw Storage Engine',
        objective: 'Persist original log payload verbatim prior to any parser or transformation execution.',
        throughput: 'Sub-millisecond writes',
        guarantee: '100% data preservation guarantee: if parsers fail, raw data is preserved for zero-downtime reprocessing.',
        specs: [
          'Dedicated raw_logs table with source tracking, ingestion timestamps, and unique UUID identifiers',
          'Audit trail compliance ready for SIEM, regulatory investigations, and forensic replay',
        ],
      },
    },
    {
      step: '03',
      name: 'Format Detector',
      subtitle: 'Heuristic Scoring',
      gradient: 'from-teal-500 to-emerald-500',
      detail: {
        title: 'Step 3: Multi-Signal Format Detection Engine',
        objective: 'Identify log source syntax automatically using structural analysis and signature matching.',
        throughput: 'Instant heuristic evaluation',
        guarantee: 'Ranks candidate parsers with confidence scores (0.0 to 1.0) and human-readable detection rationales.',
        specs: [
          'Structural inspection for JSON objects, JSON-lines, arrays, and CSV headers',
          'Regex signature evaluation for BSD Syslog (RFC 3164), RFC 5424, Apache Combined, Nginx, and Windows Events',
        ],
      },
    },
    {
      step: '04',
      name: 'Parser Plugin',
      subtitle: 'Extensible Plugins',
      gradient: 'from-emerald-500 to-indigo-500',
      detail: {
        title: 'Step 4: Extensible Parser Plugin Engine',
        objective: 'Dissect raw log strings into isolated semantic key-value fields using decoupled parser plugins.',
        throughput: '9,250+ EPS single-threaded',
        guarantee: 'Open-Closed Principle: New formats register as modular plugins without touching core engine logic.',
        specs: [
          'Pre-bundled plugins: Apache, Nginx, Syslog, Windows Events, AWS CloudWatch JSON, CSV Delimited, Generic Regex',
          'Custom Regex plugin generator with named capture groups (?P<timestamp>...) and live sandbox verification',
        ],
      },
    },
    {
      step: '05',
      name: 'Data Cleaner',
      subtitle: 'Luhn & Masking',
      gradient: 'from-indigo-500 to-violet-500',
      detail: {
        title: 'Step 5: Sensitive Data Redaction & Luhn Verification',
        objective: 'Sanitize credit cards, Bearer tokens, API keys, and passwords before downstream storage.',
        throughput: 'High-speed compiled regex pass',
        guarantee: 'Zero false positives: Luhn Mod-10 checksum ensures Windows SIDs and order IDs remain 100% intact.',
        specs: [
          'Luhn (Mod-10) checksum validation for 13-16 digit payment card numbers',
          'Protects Windows Security IDs (S-1-5-21-...) and order numbers from accidental corruption',
          'Masks RFC 6750 Bearer Authorization tokens and JWT signatures to [REDACTED_JWT_TOKEN]',
          'Replaces secret passwords (password=...) with ******** hashes',
        ],
      },
    },
    {
      step: '06',
      name: 'UTC Normalizer',
      subtitle: 'ISO-8601 Standard',
      gradient: 'from-violet-500 to-purple-500',
      detail: {
        title: 'Step 6: Universal UTC Timestamp Normalization',
        objective: 'Convert heterogeneous timestamp formats across timezones into unified UTC ISO-8601 strings.',
        throughput: 'Microsecond parsing via datetime heuristics',
        guarantee: 'Enables cross-system distributed chronological correlation and timeline analysis.',
        specs: [
          'Parses RFC 3339, Apache [16/Sep/2026:10:32:21 +0000], Unix epoch milliseconds, and Syslog Sep 16 10:32:21',
          'Normalizes timezone offsets to canonical UTC Z-format',
          'Provides fallback to ingestion reception timestamp if source log lacks a timestamp',
        ],
      },
    },
    {
      step: '07',
      name: 'Enrichment',
      subtitle: 'GeoIP & Threat Tagging',
      gradient: 'from-purple-500 to-fuchsia-500',
      detail: {
        title: 'Step 7: Metadata & Severity Enrichment Layer',
        objective: 'Harmonize non-standard log severities (ERR, warn, crit, 500 status) into standard levels.',
        throughput: 'Sub-microsecond dictionary mapping',
        guarantee: 'Uniform query semantics across all observability platforms.',
        specs: [
          'Maps status codes and keywords to: CRITICAL, ERROR, WARNING, INFO, DEBUG',
          'Enriches client IP metadata, hostname, environment tags, and service identities',
          'Labels high-risk security events (failed logins, brute-force patterns, 401/403 bursts)',
        ],
      },
    },
    {
      step: '08',
      name: 'Universal Schema',
      subtitle: 'Canonical Delivery',
      gradient: 'from-fuchsia-500 to-cyan-400',
      detail: {
        title: 'Step 8: Universal Log Schema Delivery',
        objective: 'Output standard JSON records aligned with OCSF and modern observability pipelines.',
        throughput: 'Ready for ClickHouse, OpenSearch, Kafka, PostgreSQL',
        guarantee: 'One canonical format for all enterprise observability and SIEM tools.',
        specs: [
          'Strict Pydantic v2 model validation ensuring 100% schema conformance',
          'Dual foreign-key link to raw_log_id for continuous auditing and traceability',
          'Exposed via high-speed query APIs, CSV/JSON batch exports, and real-time streams',
        ],
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Universal Log Pre-processing Platform
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold tracking-wide">
              Live Pipeline Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zero-config format detection &bull; Sensitive data redaction &bull; Canonical Universal Log Schema
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 text-xs font-semibold text-slate-200 transition active:scale-[0.98] shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition active:scale-[0.98]"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>New Ingestion Run</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Ingested Logs
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {summary ? summary.total_logs.toLocaleString() : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="h-3 w-3" /> 100% Immutable
              </span>
              <span>raw storage</span>
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Validation Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {summary ? `${summary.success_rate}%` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold">{summary?.processed_logs || 0}</span>
              <span>valid ULS records</span>
            </p>
          </div>
        </div>

        {/* Errors & Alerts */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security & Error Logs
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {summary ? (summary.error_logs + summary.critical_logs + summary.warning_logs).toLocaleString() : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-rose-400 font-semibold">{summary ? `${summary.error_rate}%` : '0%'}</span>
              <span>error frequency</span>
            </p>
          </div>
        </div>

        {/* Processing Latency */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg Batch Duration
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {summary ? `${summary.avg_processing_time_ms} ms` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Across</span>
              <span className="text-purple-300 font-semibold">{summary?.total_jobs || 0}</span>
              <span>pipeline jobs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Core Architecture Flow Visualization */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              8-Stage Data Engineering Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any stage below to inspect its data processing guarantees, throughput, and algorithms
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-cyan-500/20">
            Interactive Architecture
          </span>
        </div>

        {/* Connected 8-Stage Flow Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {PIPELINE_STEPS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStage(item)}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between hover:-translate-y-0.5 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono text-cyan-400">
                    {item.step}
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-200 transition-colors truncate">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {item.subtitle}
                </div>
              </div>
              <div className={`h-1 w-full mt-3 rounded-full bg-gradient-to-r ${item.gradient}`}></div>
            </button>
          ))}
        </div>
      </div>

      {/* Distribution Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source System Contributions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                Logs by Ingestion Source Format
              </h3>
              <span className="text-xs text-slate-400 font-medium font-mono">
                {sources.length} active formats
              </span>
            </div>

            <div className="space-y-3.5">
              {sources.length > 0 ? (
                sources.map((src, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        {src.source}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{src.count} records</span>
                        <span className="font-mono font-bold text-cyan-400">{src.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${src.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No log source data available. Ingest a log file to see distribution.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Supports Apache, Nginx, Syslog, Windows, JSON, CSV & Custom</span>
            <button
              onClick={() => onNavigate('explorer')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Explore all &rarr;
            </button>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Normalized Severity Breakdown
              </h3>
              <span className="text-xs text-slate-400 font-medium font-mono">Standardized Enums</span>
            </div>

            <div className="space-y-3.5">
              {severities.length > 0 ? (
                severities.map((sev, i) => {
                  const total = summary?.total_logs || 1;
                  const pct = Math.round((sev.count / total) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sev.color }}
                          ></span>
                          {sev.severity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{sev.count} records</span>
                          <span className="font-mono font-bold text-slate-200">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: sev.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No severity distribution data available.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Heterogeneous levels (ERR, SEVERE, warn, crit) normalized to standard enums</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Deep dive &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Processing Executions Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Recent Processing Executions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Batch processing runs, parser assignments, and validation rates
            </p>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            View all jobs ({recentJobs.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Job ID</th>
                <th className="pb-3 px-3">Source / File</th>
                <th className="pb-3 px-3">Detected Format</th>
                <th className="pb-3 px-3">Parser Plugin</th>
                <th className="pb-3 px-3">Records (Total / Parsed)</th>
                <th className="pb-3 px-3">Success Rate</th>
                <th className="pb-3 px-3">Duration</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-200">
              {recentJobs.length > 0 ? (
                recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">
                      {j.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{j.source}</div>
                      <div className="text-[10px] text-slate-400">{j.file_name || 'raw_input'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {j.detected_format || 'auto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {j.parser_used || 'Generic Regex'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {j.total_records} / <span className="text-emerald-400">{j.processed_records}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {j.success_rate}%
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {j.duration_ms} ms
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : j.status === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No processing jobs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Stage Deep-Dive Modal */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-slate-700/80 shadow-2xl bg-[#0b101d] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {selectedStage.step}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedStage.detail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedStage.detail.objective}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Throughput
                </span>
                <div className="font-mono font-bold text-cyan-300 mt-1">
                  {selectedStage.detail.throughput}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Engineering Guarantee
                </span>
                <div className="font-bold text-emerald-400 mt-1">
                  {selectedStage.detail.guarantee}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Technical Specifications
              </span>
              <ul className="space-y-1.5">
                {selectedStage.detail.specs.map((spec, sIdx) => (
                  <li key={sIdx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">&bull;</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
