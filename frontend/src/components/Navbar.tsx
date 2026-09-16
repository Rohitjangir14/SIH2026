import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  Clock,
  Gauge,
  Activity,
  ShieldCheck,
  Terminal,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 w-full">
        {/* Brand & Platform Identity */}
        <div
          className="flex items-center gap-3.5 cursor-pointer group select-none"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 shadow-md shadow-cyan-500/25 text-white font-black group-hover:scale-105 transition-all">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 border-2 border-[#090d16]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                ULPF
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Enterprise SIH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-normal">
              Universal Log Pre-processing Framework
            </p>
          </div>
        </div>

        {/* Center Live Tickers */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          {/* Engine Speed Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 shadow-sm">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Engine Speed:</span>
            <span className="font-mono font-bold text-cyan-300">9,250+ EPS</span>
          </div>

          {/* Lossless Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Lossless Pipeline Active</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{utcTime || 'UTC'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('analytics')}
            className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              currentTab === 'analytics'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-850 border-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ingest Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
