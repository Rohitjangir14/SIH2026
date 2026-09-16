import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  SearchCode,
  Cpu,
  Code2,
  BarChart3,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Server,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

interface NavGroup {
  label: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const groups: NavGroup[] = [
    {
      label: 'Core Observability',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'explorer', label: 'Universal Log Explorer', icon: SearchCode, badge: 'Dual View', badgeColor: 'cyan' },
        { id: 'analytics', label: 'Analytics & Benchmarks', icon: BarChart3, badge: '9.2k EPS', badgeColor: 'purple' },
      ],
    },
    {
      label: 'Ingestion & Pipeline',
      items: [
        { id: 'ingestion', label: 'Log Ingestion Studio', icon: UploadCloud, badge: 'Auto-Detect', badgeColor: 'cyan' },
        { id: 'jobs', label: 'Processing Jobs Engine', icon: Cpu },
        { id: 'parsers', label: 'Parser Plugin Studio', icon: Code2, badge: '7 Plugins', badgeColor: 'emerald' },
      ],
    },
    {
      label: 'Governance & Security',
      items: [
        { id: 'security', label: 'Data Masking & Privacy', icon: ShieldCheck, badge: 'Luhn Verified', badgeColor: 'emerald' },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#080c16]/75 backdrop-blur-xl flex flex-col justify-between py-5 px-3.5 min-h-[calc(100vh-4rem)] select-none">
      <div className="space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-200 border border-cyan-500/35 shadow-sm shadow-cyan-500/15'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r-full shadow-sm shadow-cyan-400"></span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive
                            ? 'text-cyan-400'
                            : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider ${
                          item.badgeColor === 'purple'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : item.badgeColor === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cluster Health & Pipeline Spec Card */}
      <div className="p-3.5 rounded-2xl bg-surface-50/90 border border-white/[0.08] shadow-inner space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-200">Pipeline Engine</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            HEALTHY
          </span>
        </div>

        <div className="space-y-1 text-[10px] font-mono text-slate-400">
          <div className="flex justify-between">
            <span>Schema Spec:</span>
            <span className="text-cyan-300 font-semibold">ULS v1.0 (OCSF)</span>
          </div>
          <div className="flex justify-between">
            <span>Detection:</span>
            <span className="text-emerald-300 font-semibold">51.4k tests/s</span>
          </div>
          <div className="flex justify-between">
            <span>Raw Immutability:</span>
            <span className="text-slate-200 font-semibold">Enforced (Lossless)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
