import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Clock,
  Search,
  BookOpen,
  ExternalLink,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0e121b]/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-5 w-full">
        {/* Brand & Platform Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="h-8 w-8 rounded flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="ULPF Logo" className="h-full w-full object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white tracking-tight group-hover:text-blue-400 transition-colors">
              ULPF
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-2.5 border-l border-slate-800">
              Universal Log Platform
            </span>
          </div>
        </div>

        {/* Center Live Search & Observability Status */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onNavigate('explorer')}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all w-60 justify-between group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-[11px]">Search logs or schemas...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
              /
            </kbd>
          </button>


          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Pipeline Healthy</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80 font-mono text-[11px] text-slate-400">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{utcTime || 'UTC'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-[11px] font-medium text-slate-300 transition"
          >
            <BookOpen className="h-3 w-3 text-slate-400" />
            <span>API Docs</span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
          </a>

          <button
            onClick={() => onNavigate('ingestion')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Ingest Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};

