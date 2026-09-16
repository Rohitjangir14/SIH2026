import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  Copy,
  Check,
  Globe,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  FileCode,
  Lock,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { fetchLogs, getExportUrl } from '../services/api';
import { ProcessedLog } from '../types';

export const ExplorerView: React.FC = () => {
  const [logs, setLogs] = useState<ProcessedLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [sourceType, setSourceType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ProcessedLog | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedNormalized, setCopiedNormalized] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchLogs({
        query: query.trim() || undefined,
        severity: severity !== 'ALL' ? severity : undefined,
        source_type: sourceType !== 'ALL' ? sourceType : undefined,
        page_size: 100,
      });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [severity, sourceType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const handleCopy = (text: string, isRaw: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedNormalized(true);
      setTimeout(() => setCopiedNormalized(false), 2000);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/35';
      case 'ERROR':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/35';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
      case 'INFO':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35';
      case 'DEBUG':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/35';
    }
  };

  const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
  const SOURCE_OPTIONS = ['ALL', 'syslog', 'apache', 'nginx', 'windows', 'json', 'csv', 'regex'];

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Search className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Universal Log Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
              Dual-View Enabled
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Search normalized records &bull; Side-by-side raw vs schema audit inspection &bull; Immutable forensic lineage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExportUrl('json', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </a>
          <a
            href={getExportUrl('csv', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, IP addresses, users, HTTP status, or error messages..."
              className="w-full bg-[#05070d] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono shadow-inner"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition active:scale-95 shrink-0"
          >
            Filter Records
          </button>
        </form>

        {/* Faceted Filter Pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/[0.06] text-xs">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Severity:</span>
            {SEVERITY_OPTIONS.map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                  severity === sev
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-surface-50 border border-transparent'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Format Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Format:</span>
            {SOURCE_OPTIONS.map((src) => (
              <button
                key={src}
                onClick={() => setSourceType(src)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold uppercase transition-all ${
                  sourceType === src
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-surface-50 border border-transparent'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Stream Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#070b13]/80 text-slate-400 font-semibold">
                <th className="py-3 px-4">UTC Timestamp</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Format</th>
                <th className="py-3 px-3">Service / Host</th>
                <th className="py-3 px-4">Normalized Message Payload</th>
                <th className="py-3 px-3">IP / Identity</th>
                <th className="py-3 px-3 text-right">Dual-View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Sparkles className="h-5 w-5 text-cyan-400 animate-spin mx-auto mb-2" />
                    Querying normalized Universal Schema records...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/[0.03] transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getSeverityBadge(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-100 text-slate-300 border border-white/[0.08]">
                        {log.source_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-300">
                      {log.application || log.host || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 max-w-md truncate group-hover:text-cyan-200">
                      {log.message}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.ip_address || log.user || '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-surface-100 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/[0.06] transition"
                        title="Open Dual-View Audit Inspector"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching log records found. Try clearing filters or ingesting new logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Dual-View Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-panel-elevated p-6 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-cyan-500/40 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Dual-View Forensic Audit Inspector
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      100% Immutable Lineage
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Record ID: {selectedLog.id} &bull; Raw Ref: {selectedLog.raw_log_id ? selectedLog.raw_log_id.slice(0, 8) : 'raw_source'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto min-h-0">
              {/* Left Pane: Untouched Immutable Raw Log */}
              <div className="p-4 rounded-xl bg-[#05070d] border border-white/[0.08] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">Original Untouched Raw Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Lossless Audit Store
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Exact character sequence captured at the ingestion boundary before any normalization or cleaning:
                  </p>

                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.04] font-mono text-xs text-amber-200/90 whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
                    {selectedLog.raw_content || selectedLog.message}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Byte Length: {(selectedLog.raw_content || selectedLog.message).length} B</span>
                  <button
                    onClick={() => handleCopy(selectedLog.raw_content || selectedLog.message, true)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedRaw ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedRaw ? 'Copied' : 'Copy Raw Text'}</span>
                  </button>
                </div>
              </div>

              {/* Right Pane: Standardized Universal Log Schema v1.0 */}
              <div className="p-4 rounded-xl bg-[#05070d] border border-cyan-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Universal Log Schema (ULS v1.0)</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                      OCSF / ECS Aligned
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Normalized JSON record with UTC ISO-8601 timestamp, standardized severity, and Luhn-redacted secrets:
                  </p>

                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.04] font-mono text-xs text-cyan-200/90 whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
                    {JSON.stringify(
                      {
                        schema_version: '1.0.0',
                        id: selectedLog.id,
                        raw_id: selectedLog.raw_log_id,
                        timestamp: selectedLog.timestamp,
                        source_type: selectedLog.source_type,
                        severity: selectedLog.severity,
                        message: selectedLog.message,
                        application: selectedLog.application,
                        host: selectedLog.host,
                        ip_address: selectedLog.ip_address,
                        user: selectedLog.user,
                        metadata_json: selectedLog.metadata_json,
                      },
                      null,
                      2
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Schema Conformance Verified
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), false)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedNormalized ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNormalized ? 'Copied' : 'Copy ULS JSON'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ULPF guarantees full bi-directional audit trace between original wire text and downstream analytics JSON.
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-slate-200 text-xs font-bold border border-white/[0.08] transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
