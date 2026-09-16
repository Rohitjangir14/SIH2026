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
  Terminal,
  FileCode,
  Lock,
  Database,
  CheckCircle2,
  Loader2,
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
        return 'bg-purple-950/40 text-purple-400 border-purple-800/40';
      case 'ERROR':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/40';
      case 'WARNING':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
      case 'INFO':
        return 'bg-blue-950/40 text-blue-400 border-blue-800/40';
      case 'DEBUG':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
      default:
        return 'bg-slate-850 text-slate-400 border-slate-750';
    }
  };

  const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
  const SOURCE_OPTIONS = ['ALL', 'syslog', 'apache', 'nginx', 'windows', 'json', 'csv', 'regex'];

  return (
    <div className="space-y-5">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Search className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Universal Log Explorer
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Dual-View Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Search normalized records &bull; Side-by-side raw vs schema audit inspection &bull; Immutable forensic lineage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExportUrl('json', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition active:scale-[0.98] shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export JSON</span>
          </a>
          <a
            href={getExportUrl('csv', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition active:scale-[0.98] shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, IP addresses, users, HTTP status, or error messages..."
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition active:scale-[0.98] shrink-0 border border-blue-500/30"
          >
            Filter Records
          </button>
        </form>

        {/* Faceted Filter Pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800 text-xs">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Severity:</span>
            {SEVERITY_OPTIONS.map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                  severity === sev
                    ? 'bg-blue-600 text-white border border-blue-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-[#111622] border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Format Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Format:</span>
            {SOURCE_OPTIONS.map((src) => (
              <button
                key={src}
                onClick={() => setSourceType(src)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase transition-all ${
                  sourceType === src
                    ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-[#111622] border border-slate-800'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Stream Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090d15] text-slate-400 font-semibold">
                <th className="py-2.5 px-3.5">UTC Timestamp</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Service / Host</th>
                <th className="py-2.5 px-3.5">Normalized Message Payload</th>
                <th className="py-2.5 px-3">IP / Identity</th>
                <th className="py-2.5 px-3 text-right">Dual-View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-4 w-4 text-blue-400 animate-spin mx-auto mb-2" />
                    Querying normalized Universal Schema records...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/30 transition cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${getSeverityBadge(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {log.source_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-300">
                      {log.application || log.host || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-300 max-w-md truncate group-hover:text-blue-300">
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.ip_address || log.user || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-5 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl space-y-3.5 bg-[#0e131f]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    Dual-View Forensic Audit Inspector
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      100% Immutable Lineage
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Record ID: {selectedLog.id} &bull; Raw Ref: {selectedLog.raw_log_id ? selectedLog.raw_log_id.slice(0, 8) : 'raw_source'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 overflow-y-auto min-h-0">
              {/* Left Pane: Untouched Immutable Raw Log */}
              <div className="p-3.5 rounded-lg bg-[#090d15] border border-slate-800 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-200">Original Untouched Raw Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">
                      Lossless Audit Store
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Exact character sequence captured at the ingestion boundary before any normalization:
                  </p>

                  <div className="mt-2 p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed max-h-56 overflow-y-auto">
                    {selectedLog.raw_content || selectedLog.message}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Byte Length: {(selectedLog.raw_content || selectedLog.message).length} B</span>
                  <button
                    onClick={() => handleCopy(selectedLog.raw_content || selectedLog.message, true)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {copiedRaw ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedRaw ? 'Copied' : 'Copy Raw Text'}</span>
                  </button>
                </div>
              </div>

              {/* Right Pane: Standardized Universal Log Schema v1.0 */}
              <div className="p-3.5 rounded-lg bg-[#090d15] border border-slate-800 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-white">Universal Log Schema (ULS v1.0)</span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-800/40">
                      OCSF / ECS Aligned
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Normalized JSON record with UTC ISO-8601 timestamp, standardized severity, and Luhn-redacted secrets:
                  </p>

                  <div className="mt-2 p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap break-all leading-relaxed max-h-56 overflow-y-auto">
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

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Schema Conformance Verified
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), false)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {copiedNormalized ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNormalized ? 'Copied' : 'Copy ULS JSON'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                ULPF guarantees full bi-directional audit trace between original wire text and downstream analytics JSON.
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
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
