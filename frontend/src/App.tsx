import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { IngestionView } from './pages/IngestionView';
import { ExplorerView } from './pages/ExplorerView';
import { JobsView } from './pages/JobsView';
import { ParsersView } from './pages/ParsersView';
import { AnalyticsView } from './pages/AnalyticsView';
import { SecurityView } from './pages/SecurityView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentTab} />;
      case 'ingestion':
        return <IngestionView onNavigate={setCurrentTab} />;
      case 'explorer':
        return <ExplorerView />;
      case 'jobs':
        return <JobsView />;
      case 'parsers':
        return <ParsersView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'security':
        return <SecurityView />;
      default:
        return <DashboardView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar currentTab={currentTab} onNavigate={setCurrentTab} />

      <div className="flex-1 flex">
        <Sidebar currentTab={currentTab} onNavigate={setCurrentTab} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default App;
