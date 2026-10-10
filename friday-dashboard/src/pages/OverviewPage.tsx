import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { NetworkTopology } from '../components/network/NetworkTopology';
import { SignalChart } from '../components/telemetry/SignalChart';
import type { NodeId, EventCategory, TransmissionEvent } from '../types';
import { Activity, ArrowUpRight, Zap, Radio, CheckCircle2, AlertOctagon, Send } from 'lucide-react';

const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function OverviewPage() {
  const { state, transmit } = useApp();
  const { dashboard } = state;

  const [composeMsg, setComposeMsg] = useState('');
  const [composeDir, setComposeDir] = useState('North-East');
  const [composeOrigin, setComposeOrigin] = useState<NodeId>('BASE_A');
  const [composeCategory, setComposeCategory] = useState<EventCategory>('message');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const latestTelemetry = dashboard.stations.BASE_A.telemetry;
  const relayStats = dashboard.relayStats;
  const recentEvents = useMemo(() => dashboard.events.slice(0, 8), [dashboard.events]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!composeMsg.trim()) return;
    setIsPending(true);
    setTimeout(() => {
      const dest: NodeId = composeOrigin === 'BASE_A' ? 'BASE_C' : 'BASE_A';
      transmit(composeOrigin, dest, composeCategory, composeMsg.trim(), composeDir);
      setComposeMsg('');
      setIsPending(false);
    }, 450);
  }

  function handleSOS() {
    setSosModalOpen(false);
    const dest: NodeId = composeOrigin === 'BASE_A' ? 'BASE_C' : 'BASE_A';
    transmit(composeOrigin, dest, 'sos', 'SOS — Immediate assistance required. Emergency dispatch activated.', composeDir);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ─── 4 KPI Metrics ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          {
            label: 'Network Nodes',
            value: '3 / 3',
            sub: 'All nodes online',
            Icon: Radio,
            iconColor: '#4ADE80',
          },
          {
            label: 'Uplink Signal',
            value: latestTelemetry?.rssiDbm ?? '−73.9',
            unit: 'dBm',
            sub: latestTelemetry ? `SNR: +${latestTelemetry.snrDb} dB` : 'SNR: +11 dB',
            Icon: Activity,
            iconColor: '#C00000',
          },
          {
            label: 'Total Relayed',
            value: relayStats.totalRelayedAtoC + relayStats.totalRelayedCtoA,
            unit: 'packets',
            sub: '0% packet drops',
            Icon: Zap,
            iconColor: '#C00000',
          },
          {
            label: 'Estimated Range',
            value: latestTelemetry?.estimatedDistanceKm ? latestTelemetry.estimatedDistanceKm.toFixed(2) : '0.04',
            unit: 'km',
            sub: 'Path loss (n=2.7)',
            Icon: ArrowUpRight,
            iconColor: '#858585',
          },
        ].map(({ label, value, unit, sub, Icon, iconColor }) => (
          <div className="metric-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="metric-label">{label}</div>
              <Icon size={15} color={iconColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <div className="metric-value">{value}</div>
              {unit && <span className="metric-unit">{unit}</span>}
            </div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Network Topology + RF Signal History ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
        {/* Topology */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Network Topology</div>
              <div className="card-subtitle">Live mesh architecture · Base A ⇄ Drone ⇄ Base C</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '99px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: '11px', fontWeight: 600, color: '#4ADE80', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              LIVE
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div className="topology-container" style={{ padding: '12px' }}>
              <NetworkTopology />
            </div>
          </div>
        </div>

        {/* RF Signal History */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">RF Signal History</div>
              <div className="card-subtitle">433.0 MHz — Last 30 telemetry points</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>RSSI</span>
              <span className="badge badge-neutral" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>SNR</span>
            </div>
          </div>
          <div className="card-body">
            <SignalChart data={dashboard.telemetryHistory} height={220} />
          </div>
        </div>
      </div>

      {/* ─── Recent Transmissions + Quick Transmit ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
        {/* Recent Transmissions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Transmissions</div>
              <div className="card-subtitle">Real-time cross-station packet log</div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>LAST 8</span>
          </div>
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--c-border)' }}>
            <table className="data-table" style={{ minWidth: '400px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Time</th>
                  <th>Message</th>
                  <th style={{ width: '120px' }}>Route</th>
                  <th style={{ width: '90px' }}>RSSI</th>
                  <th style={{ width: '90px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#858585' }}>
                      No activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((ev: TransmissionEvent) => (
                    <tr key={ev.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#858585', whiteSpace: 'nowrap' }}>
                        {formatRelative(ev.timestamp)}
                      </td>
                      <td style={{ fontSize: '13px', color: '#F5F5F5', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.message}
                      </td>
                      <td style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: '#B8B8B8', whiteSpace: 'nowrap' }}>
                        {ev.sourceNodeId === 'BASE_A' ? 'A' : 'C'} → {ev.destinationNodeId === 'BASE_A' ? 'A' : 'C'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#C00000', whiteSpace: 'nowrap' }}>
                        {ev.rssiDbm ? `${ev.rssiDbm} dBm` : '−73.9 dBm'}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#4ADE80', whiteSpace: 'nowrap' }}>
                          <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Transmit */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Transmit</div>
              <div className="card-subtitle">433.0 MHz LoRa Channel</div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="select" value={composeOrigin} onChange={e => setComposeOrigin(e.target.value as NodeId)}>
                    <option value="BASE_A">Base A (Ground)</option>
                    <option value="BASE_C">Base C (Command)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="select" value={composeCategory} onChange={e => setComposeCategory(e.target.value as EventCategory)}>
                    <option value="message">Standard Tactical</option>
                    <option value="medical">Medical Triage</option>
                    <option value="all_clear">All Clear</option>
                    <option value="ack">ACK Response</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Direction</label>
                <select className="select" value={composeDir} onChange={e => setComposeDir(e.target.value)}>
                  {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payload</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Broadcast payload over 433 MHz..."
                  value={composeMsg}
                  onChange={e => setComposeMsg(e.target.value)}
                  maxLength={240}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '13px' }} disabled={!composeMsg.trim() || isPending}>
                  <Send style={{ width: '13px', height: '13px' }} />
                  {isPending ? 'Sending...' : 'Send Message'}
                </button>
                <button type="button" className="btn btn-sos" style={{ padding: '10px 14px' }} onClick={() => setSosModalOpen(true)} title="SOS Emergency">
                  <AlertOctagon style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      <Modal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        title="Confirm SOS Broadcast"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setSosModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleSOS}>Confirm — Dispatch SOS</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#F5F5F5' }}>
          <p style={{ lineHeight: 1.6 }}>
            You are about to transmit an <strong style={{ color: '#FF6B6B' }}>SOS EMERGENCY</strong> packet
            from <strong>{composeOrigin === 'BASE_A' ? 'Base Station A' : 'Base Station C'}</strong> through the drone relay.
          </p>
          <div style={{ padding: '14px 16px', background: 'rgba(128, 0, 0, 0.12)', border: '1px solid rgba(192, 0, 0, 0.35)', borderRadius: '8px', fontSize: '12.5px', color: '#FFAAAA', lineHeight: 1.6 }}>
            <strong style={{ color: '#F5F5F5' }}>Operational Notice: </strong>
            This will transmit an un-throttled high-priority LoRa packet triggering immediate incident escalation.
          </div>
        </div>
      </Modal>
    </div>
  );
}
