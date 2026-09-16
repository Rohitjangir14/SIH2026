import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Layers,
  Code2,
  Cpu,
} from 'lucide-react';
import { detectFormat, uploadLogFile, pasteLogText } from '../services/api';
import { DetectionResult, ProcessingJob } from '../types';

interface IngestionViewProps {
  onNavigate: (tab: string) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onNavigate }) => {
  const [activeMode, setActiveMode] = useState<'paste' | 'upload'>('paste');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('prod_gateway');
  const [forcedFormat, setForcedFormat] = useState<string>('auto');

  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [jobResult, setJobResult] = useState<ProcessingJob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // 8 Comprehensive Real-World Test Datasets
  const SAMPLE_LOGS: Record<string, { label: string; tag: string; format: string; text: string }> = {
    syslog: {
      label: 'Linux Syslog (sshd)',
      tag: 'RFC 3164 / 5424',
      format: 'syslog',
      text: `Sep 16 10:32:21 server01 sshd[2841]: Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2
Sep 16 10:33:02 server01 sudo: ubuntu : TTY=pts/0 ; PWD=/home/ubuntu ; USER=root ; COMMAND=/bin/systemctl restart nginx
Sep 16 10:34:15 server01 kernel: [ 4512.102931] TCP: request_sock_TCP: Possible SYN flooding on port 80. Sending cookies.`,
    },
    apache: {
      label: 'Apache Web Access',
      tag: 'Combined Format',
      format: 'apache',
      text: `192.168.1.45 - ronak [16/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
10.0.0.12 - - [16/Sep/2026:10:33:02 +0000] "GET /dashboard/metrics HTTP/1.1" 200 5234 "https://example.com/dashboard" "Mozilla/5.0"
203.0.113.50 - hacker [16/Sep/2026:10:37:42 +0000] "GET /etc/passwd HTTP/1.1" 403 298 "-" "sqlmap/1.4"`,
    },
    nginx: {
      label: 'Nginx Error Log',
      tag: 'Standard Error',
      format: 'nginx',
      text: `2026/09/16 10:32:21 [error] 14202#14202: *1092 open() "/usr/share/nginx/html/favicon.ico" failed (2: No such file or directory), client: 192.168.1.45, server: api.internal, request: "GET /favicon.ico HTTP/1.1", host: "api.internal"
2026/09/16 10:35:10 [crit] 14202#14202: *1120 SSL_do_handshake() failed, client: 198.51.100.99, server: 0.0.0.0:443`,
    },
    windows: {
      label: 'Windows Event Log',
      tag: 'SID Safe Test',
      format: 'windows',
      text: `2026-09-16 10:32:21 [Security] EventID=4625 Level=Information Host=DC-PROD-01 Message="An account failed to log on. Subject: Security ID: S-1-5-21-397955417-626881126-18844144-1010, Account Name: -, Logon Type: 3, Account For Which Logon Failed: Account Name: ronak, Failure Reason: Unknown user name or bad password."
2026-09-16 10:33:05 [Security] EventID=4624 Level=Information Host=DC-PROD-01 Message="An account was successfully logged on. Target: Account Name: admin, Security ID: S-1-5-18, Logon Type: 2."`,
    },
    aws_json: {
      label: 'AWS CloudWatch JSON',
      tag: 'Structured Object',
      format: 'json',
      text: `[
  {
    "timestamp": "2026-09-16T10:32:21.412Z",
    "log_level": "ERROR",
    "service": "auth-service",
    "event_type": "authentication_failure",
    "message": "Failed login attempt detected from remote IP",
    "user": "ronak",
    "ip_address": "192.168.1.45",
    "environment": "production"
  },
  {
    "timestamp": "2026-09-16T10:35:50.000Z",
    "log_level": "CRITICAL",
    "service": "database-proxy",
    "event_type": "circuit_breaker_opened",
    "message": "Connection pool exhausted (500/500 active connections) to RDS Aurora primary",
    "host": "rds-cluster-prod.internal",
    "environment": "production"
  }
]`,
    },
    csv: {
      label: 'CSV App Telemetry',
      tag: 'Delimited Stream',
      format: 'csv',
      text: `timestamp,severity,service,message,user,ip_address,environment
2026-09-16 10:32:21,ERROR,auth_svc,Database timeout during credential lookup,ronak,192.168.1.45,production
2026-09-16 10:34:15,WARN,cache_mgr,Redis cache miss ratio exceeded 40%,system,127.0.0.1,production`,
    },
    sensitive: {
      label: 'PII & Token Masking',
      tag: 'Luhn & Secret Redaction',
      format: 'regex',
      text: `[2026-09-16 10:32:21] ERROR auth: Failed payment for card=4532 0150 1827 9210 and order_id=1234567890123 user=ronak password=SuperSecretPassword123!
[2026-09-16 10:33:10] WARNING api: Request authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_payload.signature and api_key=sk_live_51M089421AABBCC session=88291-30281-19283-11029`,
    },
    custom: {
      label: 'Custom App Log',
      tag: 'Bracketed Format',
      format: 'regex',
      text: `[2026-09-16 10:40:12] [payment-gw] [CRITICAL] [tx_99812] Gateway response code 504: upstream payment cluster timeout
[2026-09-16 10:41:00] [payment-gw] [INFO] [tx_99813] Health check acknowledged from consul-agent (10.0.4.12)`,
    },
  };

  // Auto-detection trigger
  useEffect(() => {
    const content = activeMode === 'paste' ? pastedText : (file ? file.name : '');
    if (!content || content.length < 10) {
      setDetection(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setDetecting(true);
        if (activeMode === 'paste') {
          const res = await detectFormat(pastedText);
          setDetection(res);
        } else if (file) {
          const textPreview = await file.slice(0, 3000).text();
          const res = await detectFormat(textPreview, file.name);
          setDetection(res);
        }
      } catch (e) {
        console.error('Detection error', e);
      } finally {
        setDetecting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pastedText, file, activeMode]);

  const handleSelectSample = (sampleKey: string) => {
    const sample = SAMPLE_LOGS[sampleKey];
    if (sample) {
      setActiveMode('paste');
      setPastedText(sample.text);
      setSourceName(`sample_${sampleKey}`);
    }
  };

  const handleStartPipeline = async () => {
    setErrorMsg(null);
    setJobResult(null);

    if (activeMode === 'paste' && !pastedText.trim()) {
      setErrorMsg('Please paste raw log content or choose a sample dataset.');
      return;
    }
    if (activeMode === 'upload' && !file) {
      setErrorMsg('Please choose a file to upload.');
      return;
    }

    try {
      setProcessing(true);
      let res: ProcessingJob;
      if (activeMode === 'paste') {
        res = await pasteLogText(pastedText, sourceName, forcedFormat);
      } else {
        res = await uploadLogFile(file!, sourceName, forcedFormat);
      }
      setJobResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Pipeline execution failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyJSON = () => {
    if (jobResult) {
      navigator.clipboard.writeText(JSON.stringify(jobResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <UploadCloud className="h-5 w-5 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Log Ingestion Studio
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Zero Configuration
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Ingest heterogeneous raw logs &bull; Heuristic format auto-detection (51k/sec) &bull; Immediate normalization pipeline
        </p>
      </div>

      {/* 1-Click Sample Preloader Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Pre-Loaded Industrial Datasets (1-Click Test):</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">8 Supported Formats</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(SAMPLE_LOGS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleSelectSample(key)}
              className="p-2.5 rounded-lg bg-[#111622] hover:bg-[#161d2c] text-left border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400 group-hover:text-blue-400 font-semibold">{item.tag}</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white mt-1 truncate">
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveMode('paste')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeMode === 'paste'
              ? 'bg-blue-600 text-white shadow-sm border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-[#111622] border border-slate-800'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Direct Raw Paste
        </button>
        <button
          onClick={() => setActiveMode('upload')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeMode === 'upload'
              ? 'bg-blue-600 text-white shadow-sm border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-[#111622] border border-slate-800'
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Batch File Upload (.log, .txt, .json, .csv)
        </button>
      </div>

      {/* Main Input Box */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        {activeMode === 'paste' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Raw Log Stream (Multi-line text or JSON array)
              </label>
              {pastedText && (
                <span className="text-[10px] font-mono text-slate-500">
                  {pastedText.split('\n').filter(Boolean).length} lines &bull; {pastedText.length} bytes
                </span>
              )}
            </div>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste raw log lines here... e.g. Sep 16 10:32:21 server01 sshd: Failed password for user ronak"
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 leading-relaxed shadow-inner"
            ></textarea>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select or Drop Log File
            </label>
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 text-center transition-all bg-[#090d15]/60">
              <UploadCloud className="h-9 w-9 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {file ? file.name : 'Drag and drop your raw log file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports .log, .txt, .json, .csv, and syslog streams</p>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Source System Identifier
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. prod_nginx_edge, server01, aws_lambda"
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Parser Plugin Selection
            </label>
            <select
              value={forcedFormat}
              onChange={(e) => setForcedFormat(e.target.value)}
              className="w-full bg-[#090d15] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Auto-Detect Format (Recommended &bull; 51k tests/s)</option>
              <option value="syslog">Linux Syslog (RFC 3164 / 5424)</option>
              <option value="apache">Apache Web Server Access Log</option>
              <option value="nginx">Nginx Access & Error Log</option>
              <option value="json">Structured JSON / AWS CloudWatch</option>
              <option value="csv">CSV Delimited Log</option>
              <option value="windows">Windows Event Log</option>
              <option value="regex">Generic Regex Bracketed Log</option>
            </select>
          </div>
        </div>

        {/* Live Auto-Detection Radar Banner */}
        {detecting ? (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            <span>Scanning log structure, timestamp signatures, and regex syntax heuristically...</span>
          </div>
        ) : detection ? (
          <div className="p-3.5 rounded-lg bg-[#111622] border border-slate-800 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-semibold text-white">
                  Detected Signature:
                  <span className="text-blue-400 uppercase font-mono ml-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[11px]">
                    {detection.detected_format}
                  </span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  {Math.round(detection.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Parser Assigned: <span className="text-slate-200 font-mono font-medium">{detection.recommended_parser}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Evidence: {detection.reason}
            </p>
          </div>
        ) : null}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center gap-2 text-xs text-rose-300 font-medium">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Pipeline Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleStartPipeline}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-50 border border-blue-500/30"
          >
            {processing ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Executing Ingestion Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Results Summary & Dual-View Transformation Card */}
      {jobResult && (
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Batch Pipeline Completed: Job {jobResult.id.slice(0, 8)}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Duration: <span className="text-slate-200 font-bold">{jobResult.duration_ms} ms</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Ingested</div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{jobResult.total_records}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Normalized to ULS</div>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">{jobResult.processed_records}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Validation Errors</div>
              <div className="text-lg font-bold text-rose-400 mt-1 font-mono">{jobResult.failed_records}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Success Rate</div>
              <div className="text-lg font-bold text-blue-400 mt-1 font-mono">{jobResult.success_rate}%</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Raw logs immutably stored &bull; Luhn-checked PII masked &bull; Universal Schema validated</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Telemetry'}</span>
              </button>

              <button
                onClick={() => onNavigate('explorer')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 text-xs font-semibold transition"
              >
                <span>Inspect in Log Explorer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
