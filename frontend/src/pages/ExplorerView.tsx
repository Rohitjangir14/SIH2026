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
  const [copied, setCopied] = useState(false);

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

  const handleCopyJSON = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'ERROR':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'INFO':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'DEBUG':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Search className="h-6 w-6 text-cyan-400" />
            Universal Log Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search normalized records &bull; Dual-view inspection &bull; Immutable raw log auditing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExportUrl('json', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </a>
          <a
            href={getExportUrl('csv', severity, sourceType)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword in message, user, IP, or host (e.g. 'login failed', 'ronak', '401')..."
              className="w-full bg-[#070b13] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition active:scale-95"
          >
            Search Logs
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
          {/* Severity filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Severity:</span>
            {['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  severity === sev
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Source filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Source Format:</span>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="bg-[#070b13] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="ALL">All Sources</option>
              <option value="apache">Apache</option>
              <option value="nginx">Nginx</option>
              <option value="syslog">Syslog</option>
              <option value="windows">Windows</option>
              <option value="json">AWS JSON</option>
              <option value="csv">CSV</option>
              <option value="regex">Generic Regex</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0b101c]/80 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Host / IP</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Normalized Message</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Sparkles className="h-5 w-5 text-cyan-400 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-surface-200 text-slate-300">
                        {log.source_type || 'generic'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      <div>{log.host || '—'}</div>
                      {log.ip_address && (
                        <div className="text-[10px] text-cyan-400">{log.ip_address}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-medium">
                      {log.user ? (
                        <span className="text-indigo-300 font-semibold">{log.user}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-md truncate font-mono text-xs text-slate-200">
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-surface-200 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No matching logs found for the selected query and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual-View Modal: Raw Input Log vs Universal Schema JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-5xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col max-h-[90vh] bg-[#0c121e]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white">Log Record Dual-View</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                      selectedLog.severity
                    )}`}
                  >
                    {selectedLog.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {selectedLog.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Side-by-side comparison: Original Raw Ingested Log vs. Standardized Universal Schema
                </p>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl bg-surface-200 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Dual-Pane Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-y-auto flex-1">
              {/* Left Pane: Immutable Raw Log */}
              <div className="p-4 rounded-2xl bg-[#06090f] border border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    1. Original Raw Ingested Log
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    IMMUTABLE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Preserved exactly as received from origin for auditing & reprocessing.
                </p>
                <pre className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {selectedLog.raw_content || 'Raw content preserved in storage.'}
                </pre>
              </div>

              {/* Right Pane: Universal Log Schema */}
              <div className="p-4 rounded-2xl bg-[#06090f] border border-cyan-500/30 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    2. Universal Schema (Normalized)
                  </span>
                  <button
                    onClick={() => handleCopyJSON(selectedLog)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-200 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-[10px] font-semibold transition"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Standardized UTC ISO timestamp, normalized severities, masked secrets & GeoIP tags.
                </p>
                <pre className="flex-1 p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 text-xs font-mono text-cyan-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(
                    {
                      id: selectedLog.id,
                      timestamp: selectedLog.timestamp,
                      source: {
                        type: selectedLog.source_type,
                        name: selectedLog.source_name,
                      },
                      severity: selectedLog.severity,
                      event_type: selectedLog.event_type,
                      message: selectedLog.message,
                      host: selectedLog.host,
                      user: selectedLog.user,
                      ip_address: selectedLog.ip_address,
                      application: selectedLog.application,
                      environment: selectedLog.environment,
                      metadata: selectedLog.metadata_json,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span>GeoIP Status: {selectedLog.metadata_json?.ip_geo?.country || 'Internal / Local'}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-bold transition"
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
