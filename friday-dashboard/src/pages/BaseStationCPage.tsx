import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { SignalChart } from '../components/telemetry/SignalChart';
import type { EventCategory, TransmissionEvent } from '../types';
import {
  RadioTower, Send, AlertOctagon, HeartPulse, CheckCircle2,
  BarChart2, Search, Clock, Waves, Mountain, Wind, ShieldCheck,
  Inbox, CornerDownRight, Compass, Activity, RotateCcw, FileText,
  MessageSquare, List, MoreVertical, Cpu, ChevronRight
} from 'lucide-react';

const DIRECTIONS = ['South-West', 'West', 'North-West', 'South', 'North', 'South-East', 'East', 'North-East'] as const;

const QUICK_PRESETS = [
  { label: 'ACK & Rescue ETA', text: 'ACK confirmed. Emergency rescue unit mobilized, ETA 12 mins. Stand by on current channel.', category: 'ack' as EventCategory },
  { label: 'Stand By On Channel', text: 'Incoming packet logged at Command HQ. Maintain radio discipline. Stand by for orders.', category: 'message' as EventCategory },
  { label: 'Medevac En Route', text: 'Medevac dispatched with paramedic triage team. Clear landing coordinate zone.', category: 'medical' as EventCategory },
  { label: 'Sector All Clear', text: 'Sector hazard cleared and verified. All units authorized to resume normal operations.', category: 'all_clear' as EventCategory },
];

export function BaseStationCPage() {
  const { state, transmit, toast } = useApp();
  const { stations, events, telemetryHistory } = state.dashboard;
  const stationC = stations.BASE_C;
  const telemetry = stationC.telemetry;
  const latestIncoming = stationC.lastReceived;

  const [replyMsg, setReplyMsg] = useState('');
  const [direction, setDirection] = useState<string>('South-West');
  const [category, setCategory] = useState<EventCategory>('ack');
  const [isSending, setIsSending] = useState(false);
  const [txFeedback, setTxFeedback] = useState<{ status: 'idle' | 'pending' | 'success'; text: string }>({ status: 'idle', text: '' });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; type: EventCategory; title: string; description: string; isSimulation: boolean;
  }>({ open: false, type: 'sos', title: '', description: '', isSimulation: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'thread' | 'table'>('thread');

  const stationEvents = useMemo(() =>
    events.filter(e => e.sourceNodeId === 'BASE_C' || e.destinationNodeId === 'BASE_C'),
    [events]
  );

  const filteredEvents = useMemo(() =>
    stationEvents.filter(e => {
      const matchesSearch = e.message.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    }),
    [stationEvents, searchTerm, categoryFilter]
  );

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim()) return;
    setIsSending(true);
    setTxFeedback({ status: 'pending', text: 'Queueing response packet to SX1262 LoRa module (0xFF)...' });
    setTimeout(() => {
      transmit('BASE_C', 'BASE_A', category, replyMsg.trim(), direction);
      setIsSending(false);
      setTxFeedback({ status: 'success', text: `Response transmitted [${direction}] — Forwarded by Drone Relay` });
      setReplyMsg('');
    }, 450);
  };

  const handleQuickAck = () => {
    setIsSending(true);
    const ackPayload = 'ACK: SOS confirmed by Command HQ. Rescue Delta Team dispatched to Sector 4.';
    setTxFeedback({ status: 'pending', text: 'Transmitting 1-Click Verified Command ACK...' });
    setTimeout(() => {
      transmit('BASE_C', 'BASE_A', 'ack', ackPayload, 'South-West');
      setIsSending(false);
      setTxFeedback({ status: 'success', text: 'Command ACK Confirmed: Rescue Delta deployment logged.' });
      toast('Command ACK transmitted to Base Station A via Drone', 'success');
    }, 400);
  };

  const requestEmergency = (type: EventCategory, title: string, description: string, isSimulation = false) => {
    setConfirmModal({ open: true, type, title, description, isSimulation });
  };

  const executeEmergency = () => {
    const { type, isSimulation } = confirmModal;
    setConfirmModal(prev => ({ ...prev, open: false }));
    let payload = '';
    if (type === 'sos') payload = 'COMMAND SOS: Immediate evacuation order for Sector 4 zone.';
    else if (type === 'medical') payload = 'MEDEVAC Dispatch: Paramedic chopper airborne. ETA 5 minutes.';
    else if (type === 'all_clear') payload = 'Command All Clear: Perimeter secured. Stand down emergency posture.';
    else if (type === 'cap_flood') payload = 'SIMULATION [CAP]: Dam Floodgates 2 & 3 open. Downstream surge active.';
    else if (type === 'cap_earthquake') payload = 'SIMULATION [CAP]: Structural assessment team deployed.';
    else if (type === 'cap_landslide') payload = 'SIMULATION [CAP]: Route 9 blocked. Diverting rescue units.';
    else if (type === 'cap_tsunami') payload = 'SIMULATION [CAP]: Harbor clearance sirens active.';
    transmit('BASE_C', 'BASE_A', type, payload, direction);
    toast(`${isSimulation ? 'Simulation' : 'Command Alert'} dispatched`, type === 'sos' ? 'critical' : 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ─── 1. Station Summary ─── */}
      <div className="station-banner">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="station-banner-icon">
              <RadioTower style={{ width: '22px', height: '22px', color: '#FFAAAA' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.01em' }}>
                  Base Station C
                </h1>
                <span className="badge badge-burgundy">DESTINATION COMMAND HQ</span>
                <span className="badge badge-ok">
                  <span className="status-dot online" />
                  ONLINE · 0xFF
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#858585', marginTop: '5px', lineHeight: 1.5 }}>
                Incident Command HQ · Receives field alerts, dispatches verified acknowledgments via Drone Relay
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', background: 'var(--c-well)',
            border: '1px solid var(--c-border)', borderRadius: '8px',
            fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#B8B8B8',
            flexShrink: 0,
          }}>
            <RadioTower style={{ width: '13px', height: '13px', color: '#858585' }} />
            <span style={{ fontWeight: 600, color: '#F5F5F5' }}>433.0 MHz</span>
            <span style={{ color: '#555' }}>·</span>
            <span>SX1262</span>
            <span style={{ color: '#555' }}>·</span>
            <span>SF7</span>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="station-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="strip-item">
            <div className="strip-label">
              <Inbox style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Latest Incoming Alert
            </div>
            <div className="strip-value" style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {latestIncoming?.message ?? 'SOS — Flash Flood breach at Sector 4'}
            </div>
            <div className="strip-sub">
              {latestIncoming ? `From Base A · ${latestIncoming.timestamp.toLocaleTimeString()}` : 'From Base A · 14:01:06'}
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-label">
              <Send style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Last Command Dispatch
            </div>
            <div className="strip-value" style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stationC.lastTransmitted?.message ?? 'ACK: SOS confirmed by Command HQ'}
            </div>
            <div className="strip-sub">
              {stationC.lastTransmitted
                ? `${stationC.lastTransmitted.timestamp.toLocaleTimeString()} · Delivered`
                : '14:01:13 · Delivered'}
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-label">
              <BarChart2 style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Downlink RSSI
            </div>
            <div className="strip-value" style={{ fontSize: '18px' }}>
              {telemetry ? `${telemetry.rssiDbm} dBm` : '−76.8 dBm'}
            </div>
            <div className="strip-sub">
              Est. range: ~{telemetry ? telemetry.estimatedDistanceKm.toFixed(2) : '1.45'} km
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Incoming Alert + Downlink Diagnostics ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>

        {/* Incoming Alert Console */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Inbox style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Incoming Alert Console</div>
                <div className="card-subtitle">Latest received packet from Base Station A</div>
              </div>
            </div>
            <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>LATEST PACKET</span>
          </div>

          <div className="card-body">
            {latestIncoming ? (
              <div style={{
                padding: '20px', borderRadius: '10px',
                background: latestIncoming.category === 'sos' ? 'rgba(128, 0, 0, 0.10)' : 'var(--c-well)',
                border: `1px solid ${latestIncoming.category === 'sos' ? 'rgba(192, 0, 0, 0.35)' : 'var(--c-border)'}`,
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5' }}>
                      {latestIncoming.sourceNodeId === 'BASE_A' ? 'BASE STATION A (Disaster Zone)' : latestIncoming.sourceNodeId}
                    </span>
                    <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{latestIncoming.id}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#858585', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '11px', height: '11px' }} />
                    {latestIncoming.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {/* Message */}
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#F5F5F5', lineHeight: 1.55 }}>
                  "{latestIncoming.message}"
                </p>

                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {[
                    { label: 'Category', value: latestIncoming.category.replace('cap_', '').toUpperCase(), color: '#FFAAAA' },
                    { label: 'Vector', value: latestIncoming.direction ?? 'N/E' },
                    { label: 'RSSI', value: `${latestIncoming.rssiDbm ?? -72.4} dBm` },
                    { label: 'Est. Range', value: `~${latestIncoming.estimatedDistanceKm ?? 1.18} km` },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ color: '#858585', marginBottom: '3px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ fontWeight: 600, color: color ?? '#F5F5F5' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Quick ACK */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleQuickAck}
                    className="btn btn-primary"
                    style={{ fontSize: '13px' }}
                  >
                    <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                    Transmit Verified ACK to Base A
                  </button>
                  <span style={{ fontSize: '12px', color: '#858585' }}>
                    Confirms receipt and dispatches rescue teams
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#858585', fontSize: '13px', background: 'var(--c-well)', borderRadius: '8px', border: '1px solid var(--c-border)' }}>
                No incoming packets in reception queue.
              </div>
            )}
          </div>
        </div>

        {/* Downlink Diagnostics */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Downlink Diagnostics</div>
                <div className="card-subtitle">Drone Relay ⇄ Base Station C</div>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="signal-metric">
                <div className="signal-metric-label">RSSI</div>
                <div className="signal-metric-value">{telemetry ? telemetry.rssiDbm : '−76.8'}</div>
                <div className="signal-metric-unit">dBm</div>
              </div>
              <div className="signal-metric">
                <div className="signal-metric-label">SNR</div>
                <div className="signal-metric-value">{telemetry ? `+${telemetry.snrDb}` : '+9.8'}</div>
                <div className="signal-metric-unit">dB</div>
              </div>
              <div className="signal-metric">
                <div className="signal-metric-label">Range</div>
                <div className="signal-metric-value">{telemetry ? telemetry.estimatedDistanceKm.toFixed(2) : '1.45'}</div>
                <div className="signal-metric-unit">km</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ color: '#B8B8B8', fontWeight: 500 }}>Downlink Quality</span>
                <span style={{ color: '#4ADE80', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>92%</span>
              </div>
              <div className="lqi-bar">
                <div className="lqi-fill" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5' }}>Downlink Signal History</span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#C00000' }}>RSSI</span>
                  <span style={{ color: '#858585' }}>SNR</span>
                </div>
              </div>
              <div style={{ border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px', background: 'var(--c-well)' }}>
                <SignalChart data={telemetryHistory} height={150} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3 & 4. Command Operations: Reply Composer & Emergency Directives ─── */}
      <div className="cmd-split-grid">
        {/* Reply Composer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CornerDownRight style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Compose Command Reply</div>
                <div className="card-subtitle">Transmit directive to Base Station A via Drone Relay</div>
              </div>
            </div>
            <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>TARGET: BASE A (0xFA)</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
            <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Compass style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Transmission Vector
                  </label>
                  <select value={direction} onChange={e => setDirection(e.target.value)} className="select">
                    {DIRECTIONS.map(dir => <option key={dir} value={dir}>{dir}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Response Category
                  </label>
                  <select value={category} onChange={e => setCategory(e.target.value as EventCategory)} className="select">
                    <option value="ack">Command Acknowledgement (ACK)</option>
                    <option value="message">Direct Command Instruction</option>
                    <option value="medical">Medical / Medevac Directive</option>
                    <option value="all_clear">All Clear Authorization</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Templates */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#858585', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Quick Response Templates
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setReplyMsg(preset.text);
                        setCategory(preset.category);
                      }}
                      style={{
                        padding: '6px 11px',
                        fontSize: '11.5px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: replyMsg === preset.text ? '#C00000' : 'var(--c-border)',
                        background: replyMsg === preset.text ? 'rgba(192, 0, 0, 0.15)' : 'var(--c-well)',
                        color: replyMsg === preset.text ? '#F5F5F5' : '#B8B8B8',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    <MessageSquare style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Reply Payload
                  </label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585' }}>
                    {replyMsg.length} / 180
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={replyMsg}
                  onChange={e => setReplyMsg(e.target.value)}
                  maxLength={180}
                  placeholder="Enter command response, rescue team ETA, or evacuation instruction..."
                  className="input"
                  style={{ resize: 'none', flex: 1 }}
                />
              </div>

              {txFeedback.status !== 'idle' && (
                <div className={txFeedback.status === 'pending' ? 'feedback-pending' : 'feedback-success'}>
                  {txFeedback.status === 'pending'
                    ? <Clock style={{ width: '14px', height: '14px', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                    : <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  }
                  <span>{txFeedback.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: 'auto', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setReplyMsg(''); setTxFeedback({ status: 'idle', text: '' }); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  <RotateCcw style={{ width: '13px', height: '13px' }} />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!replyMsg.trim() || isSending}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', paddingLeft: '22px', paddingRight: '22px' }}
                >
                  <Send style={{ width: '14px', height: '14px' }} />
                  {isSending ? 'Transmitting...' : 'Send Command Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Emergency Controls (Directives) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertOctagon style={{ width: '16px', height: '16px', color: '#FF6B6B' }} />
              <div>
                <div className="card-title">Emergency Directives</div>
                <div className="card-subtitle">Command HQ broadcast overrides</div>
              </div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>HQ PROTOCOLS</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Command SOS */}
              <button
                type="button"
                onClick={() => requestEmergency('sos', 'Command SOS Directive', 'Confirm immediate high-priority command evacuation alarm.')}
                className="emergency-directive-card sos"
              >
                <div className="directive-icon-box sos">
                  <AlertOctagon style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B6B' }}>Command SOS</span>
                    <span className="badge badge-sos" style={{ fontSize: '9px', padding: '2px 6px' }}>CRITICAL</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B8B8B8' }}>Immediate Sector Evacuation Alarm</div>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', color: '#858585', flexShrink: 0 }} />
              </button>

              {/* Medevac Order */}
              <button
                type="button"
                onClick={() => requestEmergency('medical', 'Medical Evacuation Dispatch', 'Confirm Medevac deployment order.')}
                className="emergency-directive-card medical"
              >
                <div className="directive-icon-box medical">
                  <HeartPulse style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF9999' }}>Medevac Order</span>
                    <span className="badge badge-burgundy" style={{ fontSize: '9px', padding: '2px 6px' }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B8B8B8' }}>Dispatch Air Ambulance & Paramedics</div>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', color: '#858585', flexShrink: 0 }} />
              </button>

              {/* All Clear */}
              <button
                type="button"
                onClick={() => requestEmergency('all_clear', 'All Clear Authorization', 'Authorize sector all clear status.')}
                className="emergency-directive-card clear"
              >
                <div className="directive-icon-box clear">
                  <ShieldCheck style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80' }}>Sector All Clear</span>
                    <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '2px 6px', color: '#4ADE80', borderColor: 'rgba(74, 222, 128, 0.3)' }}>STAND DOWN</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B8B8B8' }}>Authorize Stand Down & Resume Normal Ops</div>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', color: '#858585', flexShrink: 0 }} />
              </button>
            </div>

            {/* Advisory note */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--c-well)', border: '1px solid var(--c-border)', fontSize: '11.5px', color: '#858585', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C00000', flexShrink: 0 }} />
              <span>Directives broadcast with preemption priority over standard mesh traffic via SX1262 LoRa.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Disaster Simulations + Hardware ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">CAP Drill Simulations</div>
                <div className="card-subtitle">Common Alerting Protocol test dispatches</div>
              </div>
            </div>
            <span className="sim-badge">SIMULATION</span>
          </div>
          <div className="card-body">
            <div className="disaster-grid">
              <button type="button" onClick={() => requestEmergency('cap_flood', 'Simulate Flood CAP', 'Simulate dam surge notification.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Waves style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Flood Surge</div>
                <div className="disaster-btn-sub">Dam overflow</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_earthquake', 'Simulate Earthquake CAP', 'Simulate structural seismic drill.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Activity style={{ width: '18px', height: '18px', color: '#FF6B6B' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Earthquake</div>
                <div className="disaster-btn-sub">M6.8 seismic</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_landslide', 'Simulate Landslide CAP', 'Simulate route obstruction.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Mountain style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Landslide</div>
                <div className="disaster-btn-sub">Route 9 blocked</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_tsunami', 'Simulate Tsunami CAP', 'Simulate coastal warning.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Wind style={{ width: '18px', height: '18px', color: '#2DD4BF' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Tsunami</div>
                <div className="disaster-btn-sub">Coastal warning</div>
              </button>
            </div>
          </div>
        </div>

        {/* Hardware Pinout */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Hardware Pinout</div>
                <div className="card-subtitle">ESP32 WROOM · SX1262</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {[
              { label: 'SPI NSS', value: 'GPIO 5' },
              { label: 'DIO1 IRQ', value: 'GPIO 35', ok: true },
              { label: 'NRST Reset', value: 'GPIO 4' },
              { label: 'BUSY Pin', value: 'GPIO 34', ok: true },
              { label: 'Web Server', value: 'Port 80 (HTTP)', ok: true },
              { label: 'Access Point', value: 'BASE_C' },
            ].map(({ label, value, ok }) => (
              <div className="diag-row" key={label}>
                <span className="diag-label">{label}</span>
                <span className="diag-value" style={{ color: ok ? '#4ADE80' : undefined }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 6. Communication Ledger ─── */}
      <div className="card">
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <List style={{ width: '16px', height: '16px', color: '#C00000' }} />
            <div>
              <div className="card-title">Command Ledger & Incident Log</div>
              <div className="card-subtitle">Chronological record of incoming alerts and command responses</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="tab-toggle">
              <button className={`tab-toggle-btn ${viewMode === 'thread' ? 'active' : ''}`} onClick={() => setViewMode('thread')}>Thread</button>
              <button className={`tab-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>Table</button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search style={{ width: '13px', height: '13px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
              <input type="text" placeholder="Search ledger..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input"
                style={{ paddingLeft: '32px', width: '200px', fontSize: '12.5px', padding: '8px 12px 8px 32px' }} />
            </div>

            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select"
              style={{ width: '160px', fontSize: '12.5px', padding: '8px 32px 8px 12px' }}>
              <option value="all">All Categories</option>
              <option value="sos">SOS Emergency</option>
              <option value="medical">Medical Priority</option>
              <option value="ack">Acknowledgements</option>
              <option value="message">Standard Messages</option>
              <option value="cap_flood">Flood Simulations</option>
              <option value="cap_earthquake">Earthquake Simulations</option>
              <option value="cap_landslide">Landslide Simulations</option>
              <option value="cap_tsunami">Tsunami Simulations</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {viewMode === 'thread' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#858585', fontSize: '13px' }}>No matching events recorded.</div>
              ) : (
                filteredEvents.map((evt: TransmissionEvent) => {
                  const isSentByC = evt.sourceNodeId === 'BASE_C';
                  const isSOS = evt.category === 'sos';
                  return (
                    <div key={evt.id} className="thread-item" style={{ alignItems: isSentByC ? 'flex-end' : 'flex-start' }}>
                      <div className={`thread-bubble ${isSOS ? 'sos' : isSentByC ? 'outgoing' : 'incoming'}`} style={{ width: '100%', maxWidth: '640px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSentByC ? '#FFAAAA' : '#4ADE80' }}>
                            {isSentByC ? 'BASE STATION C (Command Reply)' : 'BASE STATION A (Field Alert)'}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock style={{ width: '11px', height: '11px' }} />
                            {evt.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#F5F5F5', lineHeight: 1.55, marginBottom: '12px' }}>{evt.message}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="badge badge-burgundy" style={{ fontSize: '10px' }}>{evt.id}</span>
                            {evt.direction && <span>Vector: {evt.direction}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {evt.rssiDbm && <span style={{ color: '#C00000', fontWeight: 600 }}>{evt.rssiDbm} dBm</span>}
                            <span className="badge badge-ok" style={{ fontSize: '10px' }}>✓ {evt.status.replace('_', ' ').toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-time">Time</th>
                    <th className="col-id">Event ID</th>
                    <th className="col-src">Source</th>
                    <th className="col-dst">Destination</th>
                    <th className="col-cat">Category</th>
                    <th className="col-msg">Message</th>
                    <th className="col-rssi">RSSI</th>
                    <th className="col-status">Status</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#858585' }}>No records match the active filter.</td></tr>
                  ) : (
                    filteredEvents.map((ev: TransmissionEvent) => (
                      <tr key={ev.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#858585', whiteSpace: 'nowrap' }}>{ev.timestamp.toLocaleTimeString()}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#FFAAAA', fontWeight: 600, whiteSpace: 'nowrap' }}>{ev.id}</td>
                        <td style={{ fontSize: '12px', fontWeight: 600 }}>{ev.sourceNodeId === 'BASE_A' ? 'Base A' : 'Base C'}</td>
                        <td style={{ fontSize: '12px', fontWeight: 600 }}>{ev.destinationNodeId === 'BASE_A' ? 'Base A' : 'Base C'}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                            background: ev.category === 'sos' ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)',
                            color: ev.category === 'sos' ? '#FF6B6B' : '#B8B8B8' }}>
                            {ev.category === 'sos' ? 'Emergency' : ev.category.startsWith('cap_') ? 'Simulation' : ev.category === 'ack' ? 'ACK' : 'Tactical'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', lineHeight: 1.4 }}>{ev.message}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#C00000', whiteSpace: 'nowrap' }}>{ev.rssiDbm ? `${ev.rssiDbm} dBm` : '−76.2 dBm'}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Delivered
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <MoreVertical style={{ width: '14px', height: '14px', color: '#858585', cursor: 'pointer' }} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        title={confirmModal.title}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>Cancel</button>
            <button type="button" className={`btn ${confirmModal.type === 'sos' ? 'btn-danger' : 'btn-primary'}`} onClick={executeEmergency}>
              Confirm & Transmit
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#F5F5F5' }}>
          <p style={{ lineHeight: 1.6 }}>{confirmModal.description}</p>
          <div style={{
            padding: '14px 16px', borderRadius: '8px', fontSize: '12.5px', lineHeight: 1.6,
            background: confirmModal.isSimulation ? 'var(--c-well)' : 'rgba(128, 0, 0, 0.12)',
            border: `1px solid ${confirmModal.isSimulation ? 'var(--c-border)' : 'rgba(192, 0, 0, 0.35)'}`,
            color: '#B8B8B8',
          }}>
            <strong style={{ color: '#F5F5F5' }}>Protocol: </strong>
            {confirmModal.isSimulation
              ? 'This event will be marked [SIMULATION] in the shared ledger.'
              : 'This will transmit a high-priority packet via SX1262 LoRa to Base Station A.'}
          </div>
        </div>
      </Modal>
    </div>
  );
}
