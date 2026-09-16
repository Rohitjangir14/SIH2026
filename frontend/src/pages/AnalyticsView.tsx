import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldAlert,
  Server,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AnalyticsSummary, SourceDistribution, SeverityDistribution, TimelinePoint } from '../types';
import { fetchAnalyticsSummary, fetchSourceDistribution, fetchSeverityDistribution, fetchTimeline } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sources, setSources] = useState<SourceDistribution[]>([]);
  const [severities, setSeverities] = useState<SeverityDistribution[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sum, src, sev, tl] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchSourceDistribution(),
          fetchSeverityDistribution(),
          fetchTimeline(),
        ]);
        setSummary(sum);
        setSources(src);
        setSeverities(sev);
        setTimeline(tl);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="h-6 w-6 text-cyan-400" />
          Analytics & Quality Metrics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Mathematical metrics, throughput statistics, and data quality validation formulas
        </p>
      </div>

      {/* Core Engineering Formulas Showcase Card (SIH Requirement) */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Data Engineering Quality Formulas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Formula 1 */}
          <div className="p-4 rounded-xl bg-[#06090f] border border-white/5 space-y-2">
            <div className="text-slate-400 font-sans font-bold">1. Processing Success Rate</div>
            <div className="text-cyan-300 text-sm font-bold">
              Success Rate = (Processed / Total) &times; 100
            </div>
            <div className="text-slate-400 font-sans text-[11px] pt-1 border-t border-white/5">
              Current: <span className="text-emerald-400 font-bold">{summary?.success_rate}%</span> ({summary?.processed_logs} / {summary?.total_logs} records)
            </div>
          </div>

          {/* Formula 2 */}
          <div className="p-4 rounded-xl bg-[#06090f] border border-white/5 space-y-2">
            <div className="text-slate-400 font-sans font-bold">2. System Error Rate</div>
            <div className="text-rose-300 text-sm font-bold">
              Error Rate = (Error Logs / Total) &times; 100
            </div>
            <div className="text-slate-400 font-sans text-[11px] pt-1 border-t border-white/5">
              Current: <span className="text-rose-400 font-bold">{summary?.error_rate}%</span> ({summary ? summary.error_logs + summary.critical_logs : 0} error logs)
            </div>
          </div>

          {/* Formula 3 */}
          <div className="p-4 rounded-xl bg-[#06090f] border border-white/5 space-y-2">
            <div className="text-slate-400 font-sans font-bold">3. Average Batch Latency</div>
            <div className="text-purple-300 text-sm font-bold">
              Avg Latency = &Sigma; Duration / Total Jobs
            </div>
            <div className="text-slate-400 font-sans text-[11px] pt-1 border-t border-white/5">
              Current: <span className="text-purple-400 font-bold">{summary?.avg_processing_time_ms} ms</span> ({summary?.total_jobs} total executions)
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Metrics Detailed */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            Telemetry Counts by Severity Class
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'CRITICAL', count: summary?.critical_logs || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'ERROR', count: summary?.error_logs || 0, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'WARNING', count: summary?.warning_logs || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'INFO', count: summary?.info_logs || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'DEBUG', count: summary?.debug_logs || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'TOTAL', count: summary?.total_logs || 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            ].map((item, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border border-white/5 ${item.bg}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </div>
                <div className={`text-2xl font-extrabold mt-1 font-mono ${item.color}`}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source System Contributions */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            Source System Volume Distribution
          </h3>

          <div className="space-y-3">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-100 border border-white/5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                  {s.source}
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{s.count} logs</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">
                    {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
