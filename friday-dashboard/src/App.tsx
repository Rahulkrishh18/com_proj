import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toaster } from './components/ui/Toaster';

// Station Dashboards
import { BaseStationAPage } from './pages/BaseStationAPage';
import { DroneRelayPage } from './pages/DroneRelayPage';
import { BaseStationCPage } from './pages/BaseStationCPage';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { TopologyPage } from './pages/TopologyPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { LogsPage } from './pages/LogsPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { SettingsPage } from './pages/SettingsPage';

function DashboardContent() {
  const { state } = useApp();
  const { page } = state;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          {page === 'station_a' && <BaseStationAPage />}
          {page === 'drone_relay' && <DroneRelayPage />}
          {page === 'station_c' && <BaseStationCPage />}
          {page === 'overview' && <OverviewPage />}
          {page === 'topology' && <TopologyPage />}
          {page === 'telemetry' && <TelemetryPage />}
          {page === 'emergency' && <EmergencyPage />}
          {page === 'logs' && <LogsPage />}
          {page === 'diagnostics' && <DiagnosticsPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
