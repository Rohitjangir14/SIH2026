import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Plus,
  CheckCircle2,
  AlertCircle,
  Puzzle,
  Sparkles,
  Terminal,
  X,
  Layers,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { fetchParsers, testParserSandbox, createCustomParser } from '../services/api';
import { ParserPlugin } from '../types';

export const ParsersView: React.FC = () => {
  const [parsers, setParsers] = useState<ParserPlugin[]>([]);
  const [loading, setLoading] = useState(true);

  // Sandbox state
  const [selectedParser, setSelectedParser] = useState('apache');
  const [sampleLine, setSampleLine] = useState(
    '192.168.1.45 - ronak [16/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128 "-" "Mozilla/5.0"'
  );
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  // New Plugin modal state
  const [showModal, setShowModal] = useState(false);
  const [newPluginName, setNewPluginName] = useState('');
  const [newFormatKey, setNewFormatKey] = useState('');
  const [newRegex, setNewRegex] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [pluginError, setPluginError] = useState<string | null>(null);

  const loadParsers = async () => {
    try {
      setLoading(true);
      const data = await fetchParsers();
      setParsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParsers();
  }, []);

  const handleTestSandbox = async () => {
    try {
      setTesting(true);
      const res = await testParserSandbox(selectedParser, sampleLine);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, error_message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleCreatePlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPluginError(null);
    try {
      await createCustomParser({
        name: newPluginName,
        format_key: newFormatKey.toLowerCase().trim(),
        regex_pattern: newRegex,
        description: newDesc,
      });
      setShowModal(false);
      setNewPluginName('');
      setNewFormatKey('');
      setNewRegex('');
      setNewDesc('');
      loadParsers();
    } catch (e: any) {
      setPluginError(e.message || 'Failed to create plugin');
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Code2 className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Parser Plugin Studio
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-mono">
              Open-Closed (SOLID)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Modular plugin architecture &bull; Pre-compiled engine &bull; Interactive live testing sandbox
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] border border-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          <span>Register Custom Plugin</span>
        </button>
      </div>

      {/* Active Parser Plugins Grid */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Installed Parser Plugins ({parsers.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {parsers.map((p) => (
            <div
              key={p.format_key}
              className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition">
                    {p.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium uppercase ${
                      p.is_builtin
                        ? 'bg-blue-950/40 text-blue-400 border border-blue-800/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {p.is_builtin ? 'Built-in' : 'Custom'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-mono text-slate-400">
                  key: {p.format_key} &bull; v{p.version || '1.0.0'}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {p.description || 'Log parser plugin'}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Active Pipeline
                </span>
                <button
                  onClick={() => {
                    setSelectedParser(p.format_key);
                    if (p.format_key === 'syslog') {
                      setSampleLine('Sep 16 10:32:21 server01 sshd[2841]: Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2');
                    } else if (p.format_key === 'apache') {
                      setSampleLine('192.168.1.45 - ronak [16/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128 "-" "Mozilla/5.0"');
                    } else if (p.format_key === 'nginx') {
                      setSampleLine('2026/09/16 10:32:21 [error] 14202#14202: *1092 open() "/favicon.ico" failed, client: 192.168.1.45');
                    } else if (p.format_key === 'json') {
                      setSampleLine('{"timestamp": "2026-09-16T10:32:21Z", "log_level": "ERROR", "message": "Auth failed", "user": "ronak"}');
                    } else if (p.format_key === 'windows') {
                      setSampleLine('2026-09-16 10:32:21 [Security] EventID=4625 Level=Information Host=DC-PROD-01 Message="Account failed logon"');
                    }
                  }}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Load into Sandbox</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Sandbox Test Bench */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-400" />
              Interactive Parser Sandbox
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate parser execution live and inspect extracted fields alongside normalized Universal Schema output
            </p>
          </div>
          <button
            onClick={handleTestSandbox}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition active:scale-[0.98] disabled:opacity-50 border border-blue-500/30"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{testing ? 'Testing Sandbox...' : 'Run Parser Sandbox'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Parser Plugin
            </label>
            <select
              value={selectedParser}
              onChange={(e) => setSelectedParser(e.target.value)}
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {parsers.map((p) => (
                <option key={p.format_key} value={p.format_key}>
                  {p.name} ({p.format_key})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sample Log Input String
            </label>
            <input
              type="text"
              value={sampleLine}
              onChange={(e) => setSampleLine(e.target.value)}
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Live Test Results Output */}
        {testResult && (
          <div className="p-3.5 rounded-lg bg-[#090d15] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                )}
                Execution Telemetry ({testResult.parser_name})
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                  testResult.success
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                }`}
              >
                {testResult.success ? 'PASSED' : 'PARSE ERROR'}
              </span>
            </div>

            {testResult.success ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <div className="text-[11px] text-slate-400 mb-1 font-sans font-semibold">
                    1. Raw Extracted Fields:
                  </div>
                  <pre className="p-3 rounded-lg bg-black/40 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {JSON.stringify(testResult.parsed_fields, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-[11px] text-blue-400 mb-1 font-sans font-semibold">
                    2. Universal Schema (Cleaned & Normalized):
                  </div>
                  <pre className="p-3 rounded-lg bg-black/40 border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {JSON.stringify(testResult.normalized_log, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/30 text-rose-300 text-xs font-mono">
                {testResult.error_message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Custom Parser Plugin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-xl p-5 border border-slate-700 shadow-2xl bg-[#0e131f]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Puzzle className="h-4 w-4 text-blue-400" />
                Register Custom Parser Plugin
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlugin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Plugin Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  placeholder="e.g. My Custom Microservice Parser"
                  className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Format Key (Unique slug)
                </label>
                <input
                  type="text"
                  required
                  value={newFormatKey}
                  onChange={(e) => setNewFormatKey(e.target.value)}
                  placeholder="e.g. custom_app"
                  className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Regex Pattern (With Named Groups)
                </label>
                <input
                  type="text"
                  required
                  value={newRegex}
                  onChange={(e) => setNewRegex(e.target.value)}
                  placeholder="^\[(?P<timestamp>[^\]]+)\] (?P<severity>[A-Z]+) (?P<message>.*)$"
                  className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explains what this parser handles..."
                  className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {pluginError && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
                  {pluginError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition border border-blue-500/30"
                >
                  Register Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
