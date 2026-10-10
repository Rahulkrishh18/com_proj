import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toaster } from './components/ui/Toaster';
import { LoginPage } from './components/auth/LoginPage';

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

function MainApp() {
  const { state, login } = useApp();
  const { authenticatedStation, page } = state;

  // Protect all views behind Station Authentication
  if (!authenticatedStation) {
    return (
      <>
        <LoginPage onLoginSuccess={login} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          {page === 'station_a' && <BaseStationAPage activeTab="messages" />}
          {page === 'station_a_sent' && <BaseStationAPage activeTab="sent" />}
          {page === 'station_a_received' && <BaseStationAPage activeTab="received" />}
          {page === 'station_a_emergency' && <BaseStationAPage activeTab="emergency" />}

          {page === 'station_c' && <BaseStationCPage activeTab="messages" />}
          {page === 'station_c_received' && <BaseStationCPage activeTab="received" />}
          {page === 'station_c_replies' && <BaseStationCPage activeTab="replies" />}
          {page === 'station_c_emergency' && <BaseStationCPage activeTab="emergency" />}

          {page === 'drone_relay' && <DroneRelayPage activeTab="overview" />}
          {page === 'drone_monitor' && <DroneRelayPage activeTab="monitor" />}
          {page === 'drone_ledger' && <DroneRelayPage activeTab="ledger" />}
          {page === 'drone_activity' && <DroneRelayPage activeTab="activity" />}
          {page === 'drone_audit' && <DroneRelayPage activeTab="audit" />}

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
      <MainApp />
    </AppProvider>
  );
}
