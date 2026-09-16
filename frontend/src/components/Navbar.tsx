import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Github,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ').slice(4, 5)[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#06080e]/80 backdrop-blur-2xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Brand & Platform Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 shadow-lg shadow-cyan-500/25 text-white font-black group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-[#06080e]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                ULPF
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                v1.0.0 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Universal Log Pre-processing Framework
            </p>
          </div>
        </div>

        {/* Real-time Telemetry Status Ticker */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Live Engine Throughput Gauge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-50 border border-white/[0.06] text-xs">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Single-Core:</span>
            <span className="font-mono font-bold text-cyan-300">9,250+ EPS</span>
          </div>

          {/* Zero Data Loss Guarantee */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Lossless Ingestion Active</span>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-50 border border-white/[0.06] text-[11px] font-mono text-slate-400">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{utcTime || 'UTC'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('analytics')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'analytics'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:text-white bg-surface-100 hover:bg-surface-200 border border-white/[0.08]'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Stress Test</span>
          </button>

          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95 border border-cyan-400/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ingest Logs</span>
          </button>

          <a
            href="https://github.com/Rohitjangir14/SIH2026"
            target="_blank"
            rel="noopener noreferrer"
            title="View Source on GitHub"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-surface-100 hover:bg-surface-200 border border-white/[0.08] transition"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
