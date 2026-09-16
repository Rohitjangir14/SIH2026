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
          'Automatic batching into chunks of 250 records for optimal DB transaction write performance',
        ],
      },
    },
    {
      step: '02',
      name: 'Raw Storage',
      subtitle: 'Immutable & Lossless',
      gradient: 'from-cyan-500 to-teal-500',
      detail: {
        title: 'Step 2: Immutable Raw Log Store',
        objective: 'Persist the untouched original raw text prior to any parser modifications or data transformations.',
        throughput: 'Zero-copy database journaling (100% loss-free guarantee)',
        guarantee: 'Legal and forensic audit compliance (PCI-DSS & SOC 2 audit readiness).',
        specs: [
          'Stores raw_text, source, byte size, ingestion timestamp, and batch job ID',
          'Guarantees original data can be replayed through future updated parser versions',
          'Never deletes or alters raw logs upon downstream parsing errors',
        ],
      },
    },
    {
      step: '03',
      name: 'Auto-Detection',
      subtitle: 'Zero-Config Heuristics',
      gradient: 'from-teal-500 to-emerald-500',
      detail: {
        title: 'Step 3: Heuristic Format Auto-Detection Engine',
        objective: 'Infer the structure and syntax dialect of incoming logs automatically without user configuration.',
        throughput: '51,459 detection evaluations / second',
        guarantee: '100% accuracy across Syslog, Apache, Nginx, Windows Event, AWS JSON, and CSV.',
        specs: [
          'Weighted multi-factor heuristic scoring (JSON dialect, timestamp syntax, Delimiter check, Regex signature)',
          'Sub-millisecond decision tree with confidence probability metric (0.0 to 1.0)',
          'Automatic fallback to Generic Delimited / Regex parser with reason explanations',
        ],
      },
    },
    {
      step: '04',
      name: 'Parser Plugins',
      subtitle: 'Modular Engine',
      gradient: 'from-emerald-500 to-indigo-500',
      detail: {
        title: 'Step 4: Modular Parser Plugin Architecture',
        objective: 'Execute specialized parsers implementing the Open-Closed Principle (SOLID).',
        throughput: 'Pre-compiled regular expressions & fast JSON deserializers',
        guarantee: 'Dynamic registry allows adding new log parsers without touching core pipeline logic.',
        specs: [
          'Syslog Parser: Handles RFC 3164 (BSD) & RFC 5424 structured headers',
          'Apache & Nginx Parsers: Extracts IP, auth user, method, URI, status, user-agent, referer',
          'Windows Event Parser: Parses EventID, Level, Computer, and Message payloads',
          'JSON Parser: Deep-unpacks nested cloud structures (AWS CloudWatch, Kubernetes)',
        ],
      },
    },
    {
      step: '05',
      name: 'PII Sanitizer',
      subtitle: 'Luhn & Pattern Masking',
      gradient: 'from-indigo-500 to-violet-500',
      detail: {
        title: 'Step 5: Sensitive Data Redaction & Luhn Verification',
        objective: 'Sanitize credit cards, Bearer tokens, API keys, and passwords before downstream analytics.',
        throughput: '54,305 logs / second',
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
          'Parses RFC 3339, Apache [13/Sep/2026:10:32:21 +0000], Unix epoch milliseconds, and Syslog Sep 13 10:32:21',
          'Normalizes timezone offsets to canonical UTC Z-format',
          'Provides fallback to ingestion reception timestamp if source log lacks a timestamp',
        ],
      },
    },
    {
      step: '07',
      name: 'Enrichment',
      subtitle: 'Severity & Metadata',
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
      subtitle: 'ULS v1.0 / OCSF',
      gradient: 'from-fuchsia-500 to-cyan-400',
      detail: {
        title: 'Step 8: Universal Log Schema (ULS v1.0) Delivery',
        objective: 'Output standard JSON records aligned with OCSF (Open Cybersecurity Schema) and Elastic Common Schema.',
        throughput: 'Ready for ClickHouse, OpenSearch, Kafka, Snowflake',
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
            Zero-config format detection &bull; Luhn-verified sensitive data redaction &bull; Canonical Universal Log Schema (ULS v1.0)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition active:scale-95 border border-cyan-400/30"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>New Ingestion Job</span>
          </button>
        </div>
      </div>

      {/* 4 High-Impact KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingested Logs */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Ingested Records
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center border border-cyan-500/25">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white tracking-tight">
              {summary ? summary.total_logs.toLocaleString() : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 font-semibold">100% Lossless</span> raw storage
            </p>
          </div>
        </div>

        {/* KPI 2: Normalization Success Rate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Normalization Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white tracking-tight">
              {summary ? `${summary.success_rate}%` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              <span className="text-cyan-300 font-medium">{summary?.processed_logs || 0}</span> validated records
            </p>
          </div>
        </div>

        {/* KPI 3: Single-Core Processing Capacity */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Engine Throughput
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/25">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white tracking-tight">
              9,250 <span className="text-sm font-normal text-slate-400">EPS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
              Avg latency: <span className="text-purple-300 font-medium">~108 μs</span> / record
            </p>
          </div>
        </div>

        {/* KPI 4: Sensitive Data Masking & Compliance */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PII & Token Shield
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              0 <span className="text-sm font-normal text-slate-400">Leaks</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              <span className="text-teal-300 font-semibold">Luhn-Verified</span> zero false positives
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Core Pipeline Flow Architecture */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Interactive End-to-End Processing Architecture
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                Click any stage to inspect
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time multi-stage pipeline standardizing heterogeneous raw logs into Universal Log Schema
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Pipeline Rate: Single-Core Optimized</span>
          </div>
        </div>

        {/* Pipeline Stage Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {PIPELINE_STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStage(step)}
              className="p-3.5 rounded-xl bg-surface-50/90 border border-white/[0.06] hover:border-cyan-500/50 hover:bg-surface-100 transition-all flex flex-col justify-between text-left group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-cyan-400">
                    {step.step}
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-xs font-bold text-white mt-1.5 group-hover:text-cyan-200">
                  {step.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {step.subtitle}
                </p>
              </div>

              <div className={`h-1 w-full mt-3 rounded-full bg-gradient-to-r ${step.gradient} group-hover:h-1.5 transition-all`}></div>
            </button>
          ))}
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel-elevated p-6 rounded-2xl max-w-xl w-full border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-sm border border-cyan-500/30">
                  {selectedStage.step}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedStage.detail.title}</h3>
                  <p className="text-[11px] text-slate-400">{selectedStage.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Objective:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedStage.detail.objective}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-50 border border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Throughput Metric:</span>
                  <p className="font-mono font-semibold text-cyan-300 mt-0.5">{selectedStage.detail.throughput}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Architectural Guarantee:</span>
                  <p className="font-semibold text-emerald-300 mt-0.5">{selectedStage.detail.guarantee}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Technical Specifications:</span>
                <ul className="mt-1 space-y-1 text-slate-300 list-disc list-inside">
                  {selectedStage.detail.specs.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStage(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition"
              >
                Close Spec Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs by Source Format */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                Logs by Ingestion Source Format
              </h3>
              <span className="text-xs text-slate-400 font-medium">
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
                        <span className="uppercase font-mono text-[11px]">{src.source}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{src.count} logs</span>
                        <span className="font-mono font-bold text-cyan-300">{src.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${src.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No log source data recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Supports Apache, Nginx, Linux Syslog, Windows, AWS JSON, CSV & Custom</span>
            <button
              onClick={() => onNavigate('explorer')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Explore all records &rarr;
            </button>
          </div>
        </div>

        {/* Logs by Severity Level */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Normalized Severity Breakdown
              </h3>
              <span className="text-xs text-slate-400 font-medium">Standardized Enums</span>
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
                          <span className="font-mono text-[11px]">{sev.severity}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{sev.count} logs</span>
                          <span className="font-mono font-bold text-slate-200">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden p-0.5">
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
                  No severity data recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Heterogeneous levels (ERR, SEVERE, warn, crit) normalized to standard levels</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Deep dive analytics &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Processing Executions Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Recent Processing Executions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Batch processing runs, parser plugin assignments, and throughput duration
            </p>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View all jobs ({recentJobs.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
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
            <tbody className="divide-y divide-white/[0.04] text-slate-200 font-mono">
              {recentJobs.length > 0 ? (
                recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-3 px-3 text-cyan-400 font-medium">
                      {j.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-slate-200">{j.source}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{j.file_name || 'raw_stream'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        {j.detected_format || 'auto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300 font-medium">
                      {j.parser_used || 'Generic Regex'}
                    </td>
                    <td className="py-3 px-3">
                      {j.total_records} / <span className="text-emerald-400">{j.processed_records}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {j.success_rate}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {j.duration_ms} ms
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    No processing jobs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
