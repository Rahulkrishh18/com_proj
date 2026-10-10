import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Clock, Activity, LogOut } from 'lucide-react';

const PAGE_META: Record<string, { title: string; breadcrumb: string }> = {
  station_a:           { title: 'Base Station A (Messages & Dispatch)',  breadcrumb: 'Station Alpha' },
  station_a_sent:      { title: 'Station A — Sent Messages',             breadcrumb: 'Station Alpha' },
  station_a_received:  { title: 'Station A — Received Messages',         breadcrumb: 'Station Alpha' },
  station_a_emergency: { title: 'Station A — Emergency Alerts',          breadcrumb: 'Station Alpha' },
  station_c:           { title: 'Base Station C (Messages & Replies)',   breadcrumb: 'Station Charlie' },
  station_c_received:  { title: 'Station C — Incoming from Alpha',       breadcrumb: 'Station Charlie' },
  station_c_replies:   { title: 'Station C — Sent Replies',              breadcrumb: 'Station Charlie' },
  station_c_emergency: { title: 'Station C — Emergency Directives',      breadcrumb: 'Station Charlie' },
  drone_relay:         { title: 'Drone Relay — Network Overview',        breadcrumb: 'Relay Command' },
  drone_monitor:       { title: 'Drone Relay — Live Message Monitor',    breadcrumb: 'Relay Command' },
  drone_ledger:        { title: 'Drone Relay — Unified Message Ledger',  breadcrumb: 'Relay Command' },
  drone_activity:      { title: 'Drone Relay — Station Activity Timeline', breadcrumb: 'Relay Command' },
  drone_audit:         { title: 'Drone Relay — Immutable Audit Log',     breadcrumb: 'Relay Command' },
  overview:            { title: 'Mission Overview',                      breadcrumb: 'Mission Control' },
  topology:            { title: 'Network Topology',                      breadcrumb: 'Mission Control' },
  telemetry:           { title: 'Relay Telemetry',                       breadcrumb: 'Mission Control' },
  emergency:           { title: 'Emergency Operations',                  breadcrumb: 'Mission Control' },
  logs:                { title: 'Communications Log',                    breadcrumb: 'Mission Control' },
  diagnostics:         { title: 'Diagnostics',                           breadcrumb: 'Mission Control' },
  settings:            { title: 'Settings',                              breadcrumb: 'Mission Control' },
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function Header() {
  const { state, logout } = useApp();
  const { page } = state;

  const [now, setNow] = useState(new Date());
  const [uptime, setUptime] = useState(14820);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const meta = PAGE_META[page] ?? PAGE_META.station_a;
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="app-header">
      {/* Left: Breadcrumb + Title */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#858585', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {meta.breadcrumb}
          </span>
          <ChevronRight style={{ width: '12px', height: '12px', color: '#555555', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>
            {meta.title}
          </span>
        </div>
      </div>

      {/* Right: Status items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Active Authenticated Station Badge */}
        {state.authenticatedStation && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '6px',
              background: state.authenticatedStation === 'BASE_A'
                ? 'rgba(192, 0, 0, 0.15)'
                : state.authenticatedStation === 'BASE_C'
                ? 'rgba(128, 0, 0, 0.25)'
                : 'rgba(255, 107, 107, 0.15)',
              border: '1px solid',
              borderColor: state.authenticatedStation === 'BASE_A'
                ? '#C00000'
                : state.authenticatedStation === 'BASE_C'
                ? '#800000'
                : '#FF6B6B',
              fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: state.authenticatedStation === 'BASE_A'
                ? '#FFAAAA'
                : state.authenticatedStation === 'BASE_C'
                ? '#FFCCCC'
                : '#FFFFFF',
            }}
          >
            <span className="status-dot online" />
            {state.authenticatedStation === 'BASE_A'
              ? 'STATION A (0xFA)'
              : state.authenticatedStation === 'BASE_C'
              ? 'STATION C (0xFF)'
              : 'DRONE RELAY MONITOR'}
          </div>
        )}

        {/* Cloud Realtime Status */}
        <div
          className="hide-mobile"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 11px', borderRadius: '99px',
            background: state.isCloudConnected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: '1px solid',
            borderColor: state.isCloudConnected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            fontSize: '11px', fontWeight: 600,
            color: state.isCloudConnected ? '#4ADE80' : '#FBBF24',
          }}
          title={state.isCloudConnected ? 'Connected to Supabase Realtime' : 'Running in local mode'}
        >
          <span className={`status-dot ${state.isCloudConnected ? 'online' : 'busy'}`} />
          {state.isCloudConnected ? 'CLOUD LIVE' : 'OFFLINE'}
        </div>

        {/* Uptime */}
        <div
          className="hide-tablet"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 13px',
            background: 'var(--c-well)', border: '1px solid var(--c-border)',
            borderRadius: '8px', fontSize: '11.5px', fontFamily: 'var(--font-mono)',
            color: '#B8B8B8',
          }}
        >
          <Activity style={{ width: '12px', height: '12px', color: '#C00000' }} />
          <span style={{ fontWeight: 600 }}>{formatUptime(uptime)}</span>
        </div>

        {/* Clock */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 13px',
            background: 'var(--c-well)', border: '1px solid var(--c-border)',
            borderRadius: '8px',
          }}
        >
          <Clock style={{ width: '12px', height: '12px', color: '#858585', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#F5F5F5', whiteSpace: 'nowrap' }}>
            {timeStr} UTC
          </span>
        </div>

        {/* Logout Button */}
        {state.authenticatedStation && (
          <button
            type="button"
            onClick={logout}
            title="Logout of Station"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px',
              background: 'var(--c-well)', border: '1px solid var(--c-border)',
              borderRadius: '8px', cursor: 'pointer', color: '#B8B8B8',
              fontSize: '12px', fontWeight: 600,
              transition: 'all 120ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C00000'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLElement).style.color = '#B8B8B8'; }}
          >
            <LogOut style={{ width: '13px', height: '13px' }} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
