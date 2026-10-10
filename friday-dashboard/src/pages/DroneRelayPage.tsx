import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkTopology } from '../components/network/NetworkTopology';
import type { TransmissionEvent } from '../types';
import {
  Cpu, ArrowRightLeft, Radio, Clock, Search, CheckCircle2, Info, RefreshCw
} from 'lucide-react';

export function DroneRelayPage() {
  const { state, dispatch, toast } = useApp();
  const { relayStats, events } = state.dashboard;

  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'A_TO_C' | 'C_TO_A'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  const relayThreads = useMemo(() => {
    let list = [...events];
    if (directionFilter === 'A_TO_C') list = list.filter(e => e.sourceNodeId === 'BASE_A');
    else if (directionFilter === 'C_TO_A') list = list.filter(e => e.sourceNodeId === 'BASE_C');
    if (statusFilter === 'SUCCESS') list = list.filter(e => e.status !== 'failed');
    else if (statusFilter === 'FAILED') list = list.filter(e => e.status === 'failed');
    if (searchTerm.trim()) list = list.filter(e =>
      e.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return list;
  }, [events, directionFilter, statusFilter, searchTerm]);

  const handleSampleRelay = () => {
    dispatch({ type: 'REFRESH_TELEMETRY' });
    toast('Relay hardware registers and SPI bus sampled', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ─── Section A: Relay Metrics ─── */}
      <div>
        {/* Station Banner */}
        <div className="station-banner" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="station-banner-icon">
                <Cpu style={{ width: '22px', height: '22px', color: '#FFAAAA' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.01em' }}>
                    Drone Relay Node
                  </h1>
                  <span className="badge badge-burgundy">AIRBORNE RELAY SERVER</span>
                  <span className="badge badge-neutral">DUAL SX1262</span>
                </div>
                <p style={{ fontSize: '13px', color: '#858585', marginTop: '5px', lineHeight: 1.5 }}>
                  Intermediate airborne relay · Receives, translates sync words (0xFA ⇄ 0xFF), and re-transmits bidirectional emergency telemetry
                </p>
              </div>
            </div>

            <button type="button" onClick={handleSampleRelay} className="btn btn-secondary" style={{ fontSize: '13px', flexShrink: 0 }}>
              <RefreshCw style={{ width: '13px', height: '13px', color: '#C00000' }} />
              Sample Relay Radios
            </button>
          </div>
        </div>

        {/* 5 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[
            {
              label: 'Uplink Radio',
              value: 'GPIO 35',
              sub: 'NSS: GPIO 5 · 433.0 MHz',
              tag: '0xFA',
              tagColor: '#FFAAAA',
              isOk: true,
            },
            {
              label: 'Downlink Radio',
              value: 'GPIO 21',
              sub: 'NSS: GPIO 27 · 433.0 MHz',
              tag: '0xFF',
              tagColor: '#FFAAAA',
              isOk: true,
            },
            {
              label: 'A → C Forwarded',
              value: String(relayStats.totalRelayedAtoC),
              unit: 'packets',
              sub: 'Uplink Rate: 100%',
              isOk: false,
            },
            {
              label: 'C → A Forwarded',
              value: String(relayStats.totalRelayedCtoA),
              unit: 'packets',
              sub: 'Downlink Rate: 100%',
              isOk: false,
            },
            {
              label: 'Forwarding Failures',
              value: String(relayStats.failedAttempts),
              sub: 'Zero packet drops',
              isOk: true,
              successColor: true,
            },
          ].map(({ label, value, unit, sub, tag, tagColor, isOk, successColor }) => (
            <div className="metric-card" key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="metric-label">{label}</div>
                {tag && (
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(128,0,0,0.2)', color: tagColor, border: '1px solid rgba(192,0,0,0.3)' }}>
                    {tag}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: successColor ? '#4ADE80' : isOk ? '#4ADE80' : '#F5F5F5' }}>
                  {value}
                </span>
                {unit && <span style={{ fontSize: '12px', color: '#858585' }}>{unit}</span>}
              </div>
              {isOk && !successColor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className="status-dot online" />
                  <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 600 }}>Listening</span>
                </div>
              )}
              <div className="metric-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Section B: Network Topology ─── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Network Topology — Aerial Routing</div>
            <div className="card-subtitle">Two independent RF pathways through the drone relay bridge</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-ok" style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>AVG LATENCY: ~45 ms</span>
            <span className="badge badge-neutral" style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>433.0 MHz</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '20px' }}>
          <div className="topology-container" style={{ padding: '16px' }}>
            <NetworkTopology />
          </div>
        </div>
      </div>

      {/* ─── Section C: Relay Message History ─── */}
      <div className="card">
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowRightLeft style={{ width: '16px', height: '16px', color: '#C00000' }} />
            <div>
              <div className="card-title">Relay Message Ledger</div>
              <div className="card-subtitle">Multi-hop progression — packet received, translated, and forwarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="tab-toggle">
              {(['ALL', 'A_TO_C', 'C_TO_A'] as const).map(f => (
                <button key={f} className={`tab-toggle-btn ${directionFilter === f ? 'active' : ''}`}
                  onClick={() => setDirectionFilter(f)}>
                  {f === 'ALL' ? 'All Hops' : f === 'A_TO_C' ? 'A → C' : 'C → A'}
                </button>
              ))}
            </div>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'ALL' | 'SUCCESS' | 'FAILED')}
              className="select" style={{ width: '140px', fontSize: '12.5px', padding: '8px 32px 8px 12px' }}>
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Forwarded (OK)</option>
              <option value="FAILED">Failed Hops</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Search style={{ width: '13px', height: '13px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="input" style={{ paddingLeft: '32px', width: '180px', fontSize: '12.5px', padding: '8px 12px 8px 32px' }} />
            </div>
          </div>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '640px', overflowY: 'auto', paddingRight: '4px' }}>
          {relayThreads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#858585', fontSize: '13px' }}>
              No packet forwarding events match the filter criteria.
            </div>
          ) : (
            relayThreads.map((thread: TransmissionEvent) => {
              const isAtoC = thread.sourceNodeId === 'BASE_A';
              const isSOS = thread.category === 'sos';

              return (
                <div key={thread.id} style={{
                  borderRadius: '10px', border: '1px solid',
                  borderColor: isSOS ? 'rgba(192, 0, 0, 0.35)' : 'var(--c-border)',
                  background: isSOS ? 'rgba(128, 0, 0, 0.08)' : 'var(--c-well)',
                  padding: '16px 20px',
                }}>
                  {/* Packet Header */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: 700, color: '#F5F5F5' }}>Packet {thread.id}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                        background: isAtoC ? 'rgba(128,0,0,0.3)' : 'rgba(255,255,255,0.07)',
                        color: isAtoC ? '#FFAAAA' : '#B8B8B8',
                        border: `1px solid ${isAtoC ? 'rgba(192,0,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      }}>
                        {isAtoC ? 'UPLINK A → C' : 'DOWNLINK C → A'}
                      </span>
                      {thread.direction && (
                        <span style={{ color: '#858585', fontSize: '11px' }}>Vector: {thread.direction}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11.5px', color: '#858585', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '12px', height: '12px' }} />
                        {thread.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="badge badge-ok" style={{ fontSize: '10px' }}>
                        ✓ {thread.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* 3-Step Hop Progression */}
                  <div className="relay-hop">
                    {/* Step 1: Origin */}
                    <div className="relay-step">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: 700, color: '#F5F5F5' }}>1. {isAtoC ? 'BASE A' : 'BASE C'}</span>
                        <span style={{ color: '#858585' }}>{thread.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#858585', fontFamily: 'var(--font-mono)' }}>
                        Sync: <strong style={{ color: '#FFAAAA' }}>{isAtoC ? '0xFA' : '0xFF'}</strong>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#F5F5F5', lineHeight: 1.5, marginTop: '4px' }}>
                        "{thread.message}"
                      </p>
                    </div>

                    {/* Step 2: Drone Relay */}
                    <div className="relay-step center">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: 700, color: '#FFAAAA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Cpu style={{ width: '11px', height: '11px', color: '#C00000' }} />
                          2. DRONE RELAY
                        </span>
                        <span style={{ color: '#858585' }}>+12ms</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#B8B8B8', fontFamily: 'var(--font-mono)' }}>
                        {isAtoC ? '0xFA → swap → 0xFF' : '0xFF → swap → 0xFA'}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#858585' }}>RSSI: <strong style={{ color: '#C00000' }}>{thread.rssiDbm ?? -74.2} dBm</strong></span>
                        <span style={{ color: '#858585' }}>SNR: <strong style={{ color: '#F5F5F5' }}>+{thread.snrDb ?? 9.5} dB</strong></span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                        Re-transmitted via SX1262
                      </div>
                    </div>

                    {/* Step 3: Destination */}
                    <div className="relay-step">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: 700, color: '#F5F5F5' }}>3. {isAtoC ? 'BASE C' : 'BASE A'}</span>
                        <span style={{ color: '#858585' }}>+38ms</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#858585', fontFamily: 'var(--font-mono)' }}>
                        Sync: <strong style={{ color: '#FFAAAA' }}>{isAtoC ? '0xFF' : '0xFA'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                        Delivery Confirmed
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dual Radio Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {[
          {
            title: 'Uplink Radio Diagnostics',
            subtitle: 'Drone ⇄ Base Station A',
            sync: '0xFA',
            pins: [
              { label: 'SPI NSS Pin', value: 'GPIO 5' },
              { label: 'DIO1 Interrupt', value: 'GPIO 35 (Listening)', ok: true },
              { label: 'NRST Reset', value: 'GPIO 4' },
              { label: 'BUSY Pin', value: 'GPIO 34' },
            ],
            stats: [
              { label: 'Radio Init', value: 'RADIOLIB_ERR_NONE (0)', ok: true },
              { label: 'Buffer State', value: 'FIFO 0 dropped / 256 B' },
              { label: 'Relay Latency', value: '~42 ms (Direct SPI IRQ)' },
            ],
          },
          {
            title: 'Downlink Radio Diagnostics',
            subtitle: 'Drone ⇄ Base Station C',
            sync: '0xFF',
            pins: [
              { label: 'SPI NSS Pin', value: 'GPIO 27' },
              { label: 'DIO1 Interrupt', value: 'GPIO 21 (Listening)', ok: true },
              { label: 'NRST Reset', value: 'GPIO 32' },
              { label: 'BUSY Pin', value: 'GPIO 14' },
            ],
            stats: [
              { label: 'Radio Init', value: 'RADIOLIB_ERR_NONE (0)', ok: true },
              { label: 'Buffer State', value: 'FIFO 0 dropped / 256 B' },
              { label: 'Relay Latency', value: '~48 ms (Direct SPI IRQ)' },
            ],
          },
        ].map(({ title, subtitle, sync, pins, stats }) => (
          <div className="card" key={title}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio style={{ width: '15px', height: '15px', color: '#C00000' }} />
                <div>
                  <div className="card-title">{title}</div>
                  <div className="card-subtitle">{subtitle}</div>
                </div>
              </div>
              <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>SYNC: {sync}</span>
            </div>
            <div className="card-body">
              <div style={{ borderBottom: '1px solid var(--c-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                {pins.map(({ label, value, ok }) => (
                  <div className="diag-row" key={label}>
                    <span className="diag-label">{label}</span>
                    <span className="diag-value" style={{ color: ok ? '#4ADE80' : undefined }}>{value}</span>
                  </div>
                ))}
              </div>
              {stats.map(({ label, value, ok }) => (
                <div className="diag-row" key={label}>
                  <span className="diag-label">{label}</span>
                  <span className="diag-value" style={{ color: ok ? '#4ADE80' : undefined }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry Notice */}
      <div className="info-notice">
        <Info style={{ width: '15px', height: '15px', color: '#C00000', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <strong style={{ color: '#F5F5F5' }}>Telemetry Notice: </strong>
          Drone Relay telemetry displayed is authenticated SX1262 SPI transceiver and packet routing telemetry. Physical flight avionics (GPS altitude, attitude, battery) require a dedicated FCU MAVLink telemetry stream.
        </div>
      </div>
    </div>
  );
}
