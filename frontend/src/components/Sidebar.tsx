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
      label: 'Pipeline & Ingestion',
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
    <aside className="w-64 border-r border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-4rem)] select-none shrink-0">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-sm shadow-cyan-400"></span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive
                            ? 'text-cyan-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                          item.badgeColor === 'purple'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                            : item.badgeColor === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
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

      {/* Modern Status Card at bottom of sidebar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Universal Schema
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
            ULS v1.0
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Standardizing heterogeneous logs into canonical UTC timestamps and verified schemas.
        </p>
      </div>
    </aside>
  );
};
