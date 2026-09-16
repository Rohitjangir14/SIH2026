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
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsSummary, SourceDistribution, SeverityDistribution, ProcessingJob } from '../types';
import { fetchAnalyticsSummary, fetchSourceDistribution, fetchSeverityDistribution, fetchJobs } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sources, setSources] = useState<SourceDistribution[]>([]);
  const [severities, setSeverities] = useState<SeverityDistribution[]>([]);
  const [recentJobs, setRecentJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);

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
      setRecentJobs(jobsData.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Universal Log Pre-processing Platform
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              Live Pipeline
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ingest heterogeneous logs &bull; Automatic format detection &bull; Universal schema normalization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition active:scale-95"
          >
            <ArrowUpRight className="h-4 w-4" />
            New Ingestion Job
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Ingested Logs
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? summary.total_logs.toLocaleString() : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100% Immutable</span> raw log storage
            </p>
          </div>
        </div>

        {/* Processing Success Rate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `${summary.success_rate}%` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-cyan-400 font-medium">{summary?.processed_logs || 0}</span> validated records
            </p>
          </div>
        </div>

        {/* Errors & Threat Alerts */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Errors & Warnings
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? (summary.error_logs + summary.critical_logs + summary.warning_logs).toLocaleString() : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-rose-400 font-medium">{summary ? `${summary.error_rate}%` : '0%'}</span> error rate
            </p>
          </div>
        </div>

        {/* Average Processing Latency */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg Processing Speed
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `${summary.avg_processing_time_ms} ms` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              Across <span className="text-purple-300 font-medium">{summary?.total_jobs || 0}</span> batch executions
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Core Pipeline Flow Visualization */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              End-to-End Processing Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time progression from raw multi-format ingestion to universal schema delivery
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-surface-200 text-cyan-300 border border-cyan-500/20">
            SOLID &bull; Plugin-Driven
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { step: '1. Ingest', desc: 'Files / API / Paste', color: 'from-blue-600 to-cyan-600' },
            { step: '2. Raw Store', desc: 'Immutable DB', color: 'from-cyan-600 to-teal-600' },
            { step: '3. Detection', desc: 'Auto Heuristic', color: 'from-teal-600 to-emerald-600' },
            { step: '4. Parser', desc: 'Plugin Engine', color: 'from-emerald-600 to-indigo-600' },
            { step: '5. Cleaner', desc: 'Mask Secrets', color: 'from-indigo-600 to-violet-600' },
            { step: '6. Normalize', desc: 'UTC ISO-8601', color: 'from-violet-600 to-purple-600' },
            { step: '7. Enrich', desc: 'GeoIP & Threat', color: 'from-purple-600 to-fuchsia-600' },
            { step: '8. Validate', desc: 'Universal Schema', color: 'from-fuchsia-600 to-cyan-500' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-surface-100/90 border border-white/5 flex flex-col justify-between hover:border-cyan-500/40 transition-all group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {item.step}
                </span>
                <p className="text-xs font-semibold text-white mt-1 group-hover:text-cyan-300">
                  {item.desc}
                </p>
              </div>
              <div className={`h-1 w-full mt-3 rounded-full bg-gradient-to-r ${item.color}`}></div>
            </div>
          ))}
        </div>
      </div>

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
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        {src.source}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{src.count} logs</span>
                        <span className="font-mono font-bold text-cyan-400">{src.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
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

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Supports Apache, Nginx, Linux Syslog, Windows, AWS JSON, CSV & Custom</span>
            <button
              onClick={() => onNavigate('explorer')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Explore all &rarr;
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
              <span className="text-xs text-slate-400 font-medium">Standardized Levels</span>
            </div>

            <div className="space-y-3.5">
              {severities.length > 0 ? (
                severities.map((sev, i) => {
                  const total = summary?.total_logs || 1;
                  const pct = Math.round((sev.count / total) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sev.color }}
                          ></span>
                          {sev.severity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{sev.count} logs</span>
                          <span className="font-mono font-bold text-slate-200">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
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

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
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

      {/* Recent Processing Jobs Table */}
      <div className="glass-panel p-6 rounded-2xl">
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
              <tr className="border-b border-white/10 text-slate-400 font-semibold">
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
            <tbody className="divide-y divide-white/5 text-slate-200">
              {recentJobs.length > 0 ? (
                recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono text-cyan-400 font-medium">
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
                  <td colSpan={8} className="py-6 text-center text-slate-500">
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
