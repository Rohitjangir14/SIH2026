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

interface NavGroup {
  label: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const groups: NavGroup[] = [
    {
      label: 'Observability',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'explorer', label: 'Universal Log Explorer', icon: SearchCode, badge: 'Dual View' },
        { id: 'analytics', label: 'Analytics & Benchmarks', icon: BarChart3 },
      ],
    },
    {
      label: 'Pipeline Engine',
      items: [
        { id: 'ingestion', label: 'Log Ingestion Studio', icon: UploadCloud, badge: 'Auto-Detect' },
        { id: 'jobs', label: 'Processing Jobs', icon: Cpu },
        { id: 'parsers', label: 'Parser Plugins', icon: Code2 },
      ],
    },
    {
      label: 'Security & Masking',
      items: [
        { id: 'security', label: 'Data Redaction & PII', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-60 border-r border-slate-800/80 bg-[#0c1018] flex flex-col justify-between py-4 px-2.5 min-h-[calc(100vh-3.5rem)] select-none shrink-0">
      <div className="space-y-5">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#151c2c] text-white font-semibold border-l-2 border-blue-500 rounded-l-none shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isActive
                          ? 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                      }`}>
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

      {/* Clean minimal footer badge */}
      <div className="p-3 rounded-lg bg-[#101522] border border-slate-800 text-[11px] text-slate-400 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-200 text-[11px]">Universal Schema</span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Pydantic v2
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Immutable Raw Storage &bull; UTC ISO-8601 &bull; Luhn Masking
        </p>
      </div>
    </aside>
  );
};

