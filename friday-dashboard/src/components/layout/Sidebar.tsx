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
  RadioReceiver,
  Send,
  Inbox,
  Shield,
} from 'lucide-react';

interface NavItem {
  id: SidebarPage;
  label: string;
  badgeText?: string;
  Icon: React.FC<{ size: number; className?: string }>;
}

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
  const { page, authenticatedStation } = state;

  // Build role-specific navigation structure
  let sectionTitle = 'Station Control';
  let primaryNav: NavItem[] = [];
  let secondaryNav: NavItem[] = [];

  if (authenticatedStation === 'BASE_A') {
    sectionTitle = 'Base Station Alpha (0xFA)';
    primaryNav = [
      { id: 'station_a', label: 'Messages & Dispatch', badgeText: '0xFA', Icon: RadioTower },
      { id: 'station_a_sent', label: 'Sent History', Icon: Send },
      { id: 'station_a_received', label: 'Received from Charlie', Icon: Inbox },
      { id: 'station_a_emergency', label: 'Emergency Alerts', badgeText: 'SOS', Icon: AlertOctagon },
    ];
    secondaryNav = [
      { id: 'overview', label: 'Mission Overview', Icon: LayoutDashboard },
    ];
  } else if (authenticatedStation === 'BASE_C') {
    sectionTitle = 'Base Station Charlie (0xFF)';
    primaryNav = [
      { id: 'station_c', label: 'Messages & Reply', badgeText: '0xFF', Icon: RadioReceiver },
      { id: 'station_c_received', label: 'Received from Alpha', Icon: Inbox },
      { id: 'station_c_replies', label: 'Sent Replies', Icon: Send },
      { id: 'station_c_emergency', label: 'Emergency Directives', badgeText: 'SOS', Icon: AlertOctagon },
    ];
    secondaryNav = [
      { id: 'overview', label: 'Mission Overview', Icon: LayoutDashboard },
    ];
  } else {
    // DRONE_RELAY or monitoring
    sectionTitle = 'Airborne Relay Monitor';
    primaryNav = [
      { id: 'drone_relay', label: 'Network Overview', badgeText: 'RELAY', Icon: Cpu },
      { id: 'drone_monitor', label: 'Live Message Monitor', Icon: Activity },
      { id: 'drone_ledger', label: 'Unified Message Ledger', Icon: FileText },
      { id: 'drone_activity', label: 'Station Activity', Icon: Radio },
      { id: 'drone_audit', label: 'Audit Log (Append-Only)', Icon: Shield },
    ];
    secondaryNav = [
      { id: 'overview', label: 'Mission Overview', Icon: LayoutDashboard },
      { id: 'topology', label: 'Network Topology', Icon: Network },
      { id: 'telemetry', label: 'Relay Telemetry', Icon: Activity },
      { id: 'diagnostics', label: 'Radio Diagnostics', Icon: Cpu },
      { id: 'settings', label: 'Station Settings', Icon: Settings },
    ];
  }

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
            {authenticatedStation === 'DRONE_RELAY' ? 'Relay Monitoring' : 'Emergency Mission'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{sectionTitle}</div>

        {primaryNav.map(({ id, label, badgeText, Icon }) => {
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

        <div className="nav-section-label" style={{ marginTop: '12px' }}>Mission Tools</div>

        {secondaryNav.map(({ id, label, Icon }) => {
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
            868.0 MHz LoRa
          </div>
          <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#858585', marginTop: '2px' }}>
            SX1262 · SF7 · 125 kHz
          </div>
        </div>
      </div>
    </aside>
  );
}
