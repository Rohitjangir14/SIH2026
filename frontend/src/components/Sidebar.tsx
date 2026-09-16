import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  SearchCode,
  Cpu,
  Code2,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'ingestion', label: 'Ingestion Studio', icon: UploadCloud, badge: 'Auto-Detect' },
    { id: 'explorer', label: 'Universal Log Explorer', icon: SearchCode },
    { id: 'jobs', label: 'Processing Jobs', icon: Cpu },
    { id: 'parsers', label: 'Parser Studio', icon: Code2 },
    { id: 'analytics', label: 'Analytics Deep Dive', icon: BarChart3 },
    { id: 'security', label: 'Security & Redaction', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0c121e]/60 backdrop-blur-md flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Platform Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-surface-100/90 to-surface-200/90 border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-200">Universal Schema</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Heterogeneous logs standardized to UTC ISO-8601 timestamps & verified schemas.
        </p>
      </div>
    </aside>
  );
};
