import React from 'react';
import { useApp } from '../../context/AppContext';
import type { SidebarPage } from '../../types';
import {
  LayoutDashboard,
  Network,
  RadioTower,
  Cpu,
  Activity,
  AlertOctagon,
  FileText,
  Settings,
  Radio,
  RadioReceiver
} from 'lucide-react';

interface NavItem {
  id: SidebarPage;
  label: string;
  badgeText?: string;
  Icon: React.FC<{ size: number; className?: string }>;
}

const PRIMARY_STATIONS: NavItem[] = [
  { id: 'station_a',   label: 'Base Station A', badgeText: '0xFA', Icon: RadioTower },
  { id: 'drone_relay', label: 'Drone Relay',     badgeText: 'RELAY', Icon: Cpu },
  { id: 'station_c',   label: 'Base Station C', badgeText: '0xFF', Icon: RadioReceiver },
];

const MISSION_TOOLS: NavItem[] = [
  { id: 'overview',     label: 'Mission Overview',   Icon: LayoutDashboard },
  { id: 'topology',     label: 'Network Topology',   Icon: Network },
  { id: 'telemetry',    label: 'Relay Telemetry',    Icon: Activity },
  { id: 'emergency',    label: 'Emergency Ops',      Icon: AlertOctagon },
  { id: 'logs',         label: 'Communications Log', Icon: FileText },
  { id: 'diagnostics',  label: 'Diagnostics',        Icon: Cpu },
  { id: 'settings',     label: 'Settings',           Icon: Settings },
];

function FridayLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="14" y="16" width="4" height="12" fill="#C00000" rx="1.5" />
      <rect x="9" y="14" width="14" height="3" fill="#C00000" rx="1.5" />
      <path d="M7 12 Q16 3 25 12" stroke="#C00000" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M3 8 Q16 -2 29 8" stroke="#800000" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
      <circle cx="16" cy="10.5" r="3.5" fill="#C00000" />
      <circle cx="16" cy="10.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function Sidebar() {
  const { state, navigate } = useApp();
  const { page, dashboard } = state;

  const unresolvedIncidents = dashboard.incidents.filter(i => !i.resolved).length;

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <FridayLogo size={28} />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, letterSpacing: '0.06em', color: '#F5F5F5', lineHeight: 1.2 }}>
            F.R.I.D.A.Y.
          </div>
          <div style={{ fontSize: '9.5px', fontWeight: 500, color: '#858585', letterSpacing: '0.10em', marginTop: '2px', textTransform: 'uppercase' }}>
            Aerial Relay Mission
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Station Control</div>

        {PRIMARY_STATIONS.map(({ id, label, badgeText, Icon }) => {
          const isActive = page === id;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon
                size={15}
                className={isActive ? 'text-[#FF6B6B]' : 'text-[#858585]'}
              />
              <span style={{ flex: 1, fontSize: '13px' }}>{label}</span>
              {badgeText && (
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(192,0,0,0.35)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#FFAAAA' : '#858585',
                    border: `1px solid ${isActive ? 'rgba(192,0,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '8px' }}>Mission Control</div>

        {MISSION_TOOLS.map(({ id, label, Icon }) => {
          const isActive = page === id;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon
                size={15}
                className={isActive ? 'text-[#FF6B6B]' : 'text-[#858585]'}
              />
              <span style={{ flex: 1, fontSize: '13px' }}>{label}</span>
              {id === 'emergency' && unresolvedIncidents > 0 && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    background: '#C00000',
                    color: '#FFF',
                    borderRadius: '99px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {unresolvedIncidents}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          margin: '12px',
          padding: '12px 14px',
          border: '1px solid var(--c-border)',
          borderRadius: '8px',
          background: 'var(--c-well)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            background: 'rgba(128, 0, 0, 0.3)',
            border: '1px solid rgba(192, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Radio size={13} className="text-[#FFAAAA]" />
        </div>
        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#F5F5F5', lineHeight: 1.2 }}>
            433.0 MHz LoRa
          </div>
          <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#858585', marginTop: '2px' }}>
            SX1262 · SF7 · 125 kHz
          </div>
        </div>
      </div>
    </aside>
  );
}
