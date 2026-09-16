import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Clock,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#10141f]">
      <div className="flex h-14 items-center justify-between px-6 w-full">
        {/* Brand & Platform Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="h-8 w-8 rounded-lg overflow-hidden border border-blue-500/40 shadow-sm flex items-center justify-center bg-[#090d15] shrink-0">
            <img src="/logo.png" alt="ULPF Logo" className="h-full w-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight">
                ULPF
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                v1.0.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Live Tickers (Clean, Subdued Corporate) */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Gauge className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400">Throughput:</span>
            <span className="font-mono font-semibold text-slate-200">9,250+ EPS</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Pipeline Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{utcTime || 'UTC'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Ingest Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
