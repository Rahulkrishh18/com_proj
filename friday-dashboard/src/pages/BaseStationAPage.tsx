import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { SignalChart } from '../components/telemetry/SignalChart';
import type { EventCategory, TransmissionEvent } from '../types';
import {
  RadioTower, Send, AlertOctagon, HeartPulse, CheckCircle2,
  BarChart2, RotateCcw, Search, Clock, Waves, Activity,
  Mountain, Wind, ShieldCheck, Compass, FileText, MessageSquare,
  List, MoreVertical, Download, Cpu
} from 'lucide-react';

const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'] as const;

export function BaseStationAPage() {
  const { state, transmit, toast } = useApp();
  const { stations, events, telemetryHistory } = state.dashboard;
  const stationA = stations.BASE_A;
  const telemetry = stationA.telemetry;

  const [msg, setMsg] = useState('');
  const [direction, setDirection] = useState<string>('North-East');
  const [category, setCategory] = useState<EventCategory>('message');
  const [isSending, setIsSending] = useState(false);
  const [txFeedback, setTxFeedback] = useState<{ status: 'idle' | 'pending' | 'success'; text: string }>({ status: 'idle', text: '' });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; type: EventCategory; title: string; description: string; isSimulation: boolean;
  }>({ open: false, type: 'sos', title: '', description: '', isSimulation: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'thread' | 'table'>('thread');

  const stationEvents = useMemo(() =>
    events.filter(e => e.sourceNodeId === 'BASE_A' || e.destinationNodeId === 'BASE_A'),
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setIsSending(true);
    setTxFeedback({ status: 'pending', text: 'Queueing LoRa packet to SX1262...' });
    setTimeout(() => {
      transmit('BASE_A', 'BASE_C', category, msg.trim(), direction);
      setIsSending(false);
      setTxFeedback({ status: 'success', text: `Packet transmitted [${direction}] — Forwarded by Drone Relay` });
      setMsg('');
    }, 450);
  };

  const requestEmergency = (type: EventCategory, title: string, description: string, isSimulation = false) => {
    setConfirmModal({ open: true, type, title, description, isSimulation });
  };

  const executeEmergency = () => {
    const { type, isSimulation } = confirmModal;
    setConfirmModal(prev => ({ ...prev, open: false }));
    let payload = '';
    if (type === 'sos') payload = 'SOS — Flash Flood breach at Sector 4 perimeter. Immediate rescue required.';
    else if (type === 'medical') payload = 'Medical Priority: 3 casualties stabilized. Requesting paramedic triage.';
    else if (type === 'all_clear') payload = 'All Clear: Incident resolved. Sector perimeter stabilized.';
    else if (type === 'cap_flood') payload = 'Flood Alert — River basin overflow';
    else if (type === 'cap_earthquake') payload = 'Earthquake — M6.8 Richter Scale';
    else if (type === 'cap_landslide') payload = 'Landslide — Hillside instability';
    else if (type === 'cap_tsunami') payload = 'Tsunami — Coastal inundation';
    transmit('BASE_A', 'BASE_C', type, payload, direction);
    toast(`${isSimulation ? 'Simulation' : 'Emergency'} broadcast dispatched`, type === 'sos' ? 'critical' : 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ─── Section A: Station Summary ─── */}
      <div className="station-banner">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="station-banner-icon">
              <RadioTower style={{ width: '22px', height: '22px', color: '#FFAAAA' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.01em' }}>
                  Base Station A
                </h1>
                <span className="badge badge-burgundy">ORIGIN GROUND CONTROL</span>
                <span className="badge badge-ok">
                  <span className="status-dot online" />
                  ONLINE · 0xFA
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#858585', marginTop: '5px', lineHeight: 1.5 }}>
                Disaster epicenter terminal · Outgoing LoRa bridge to Base Station C via Drone Relay
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
              <Send style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Latest Transmission
            </div>
            <div className="strip-value" style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stationA.lastTransmitted?.message ?? 'SOS — Flash Flood breach at Sector 4'}
            </div>
            <div className="strip-sub">
              {stationA.lastTransmitted
                ? `${stationA.lastTransmitted.timestamp.toLocaleTimeString()} · ${stationA.lastTransmitted.status}`
                : '14:01:06 · ack_received'}
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-label">
              <Download style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Latest Reply Received
            </div>
            <div className="strip-value" style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stationA.lastReceived?.message ?? 'ACK: SOS confirmed by Command HQ'}
            </div>
            <div className="strip-sub">
              {stationA.lastReceived
                ? `From Base C · ${stationA.lastReceived.timestamp.toLocaleTimeString()}`
                : 'From Base C · 14:01:13'}
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-label">
              <BarChart2 style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
              Uplink RSSI
            </div>
            <div className="strip-value" style={{ fontSize: '18px' }}>
              {telemetry ? `${telemetry.rssiDbm} dBm` : '−75.3 dBm'}
            </div>
            <div className="strip-sub">
              Est. range: ~{telemetry ? telemetry.estimatedDistanceKm.toFixed(2) : '0.05'} km
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section B: Main Workspace ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>

        {/* Left: Message Composer */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Send style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Compose & Transmit Message</div>
                <div className="card-subtitle">LoRa → Drone Relay → Base Station C</div>
              </div>
            </div>
            <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>433.0 MHz</span>
          </div>

          <div className="card-body">
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Selectors row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Compass style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Antenna Direction
                  </label>
                  <select value={direction} onChange={e => setDirection(e.target.value)} className="select">
                    {DIRECTIONS.map(dir => <option key={dir} value={dir}>{dir}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Message Category
                  </label>
                  <select value={category} onChange={e => setCategory(e.target.value as EventCategory)} className="select">
                    <option value="message">Standard Tactical</option>
                    <option value="medical">Medical Priority</option>
                    <option value="all_clear">All Clear</option>
                    <option value="ack">Acknowledgement</option>
                  </select>
                </div>
              </div>

              {/* Message textarea */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    <MessageSquare style={{ width: '13px', height: '13px', display: 'inline', marginRight: '5px', color: '#C00000' }} />
                    Message Payload
                  </label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585' }}>
                    {msg.length} / 180
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  maxLength={180}
                  placeholder="Enter field message to broadcast across 433 MHz LoRa channel..."
                  className="input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Feedback */}
              {txFeedback.status !== 'idle' && (
                <div className={txFeedback.status === 'pending' ? 'feedback-pending' : 'feedback-success'}>
                  {txFeedback.status === 'pending'
                    ? <Clock style={{ width: '14px', height: '14px', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                    : <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  }
                  <span>{txFeedback.text}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setMsg(''); setTxFeedback({ status: 'idle', text: '' }); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  <RotateCcw style={{ width: '13px', height: '13px' }} />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!msg.trim() || isSending}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', paddingLeft: '24px', paddingRight: '24px' }}
                >
                  <Send style={{ width: '14px', height: '14px' }} />
                  {isSending ? 'Transmitting...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Signal Diagnostics */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Signal Diagnostics</div>
                <div className="card-subtitle">Uplink: A → Drone Relay</div>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="signal-metric">
                <div className="signal-metric-label">RSSI</div>
                <div className="signal-metric-value">{telemetry ? telemetry.rssiDbm : '−75.3'}</div>
                <div className="signal-metric-unit">dBm</div>
              </div>
              <div className="signal-metric">
                <div className="signal-metric-label">SNR</div>
                <div className="signal-metric-value">{telemetry ? `+${telemetry.snrDb}` : '+10.7'}</div>
                <div className="signal-metric-unit">dB</div>
              </div>
              <div className="signal-metric">
                <div className="signal-metric-label">Range</div>
                <div className="signal-metric-value">{telemetry ? telemetry.estimatedDistanceKm.toFixed(2) : '0.05'}</div>
                <div className="signal-metric-unit">km</div>
              </div>
            </div>

            {/* LQI Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ color: '#B8B8B8', fontWeight: 500 }}>Link Quality Index</span>
                <span style={{ color: '#4ADE80', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>94%</span>
              </div>
              <div className="lqi-bar">
                <div className="lqi-fill" style={{ width: '94%' }} />
              </div>
            </div>

            {/* Signal Chart */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5' }}>Signal History</span>
                <div style={{ display: 'flex', gap: '12px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C00000' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C00000', display: 'inline-block' }} />
                    RSSI
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#858585' }}>
                    <span style={{ width: '10px', height: '2px', background: '#858585', display: 'inline-block' }} />
                    SNR
                  </span>
                </div>
              </div>
              <div style={{ border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px', background: 'var(--c-well)' }}>
                <SignalChart data={telemetryHistory} height={160} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section C: Emergency Controls ─── */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon style={{ width: '16px', height: '16px', color: '#FF6B6B' }} />
            <div>
              <div className="card-title">Emergency Controls</div>
              <div className="card-subtitle">High-priority transmissions via SX1262 LoRa</div>
            </div>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>PREEMPTIVE PRIORITY</span>
        </div>

        <div className="card-body">
          <div className="emergency-row">
            <button
              type="button"
              onClick={() => requestEmergency('sos', 'SOS Emergency Alert', 'Confirm high-priority emergency broadcast across the LoRa network.')}
              className="emergency-action sos"
            >
              <div className="emergency-action-icon">
                <AlertOctagon style={{ width: '24px', height: '24px' }} />
              </div>
              <div className="emergency-action-label">SOS Emergency</div>
              <div className="emergency-action-sub">Immediate Rescue Alarm</div>
            </button>

            <button
              type="button"
              onClick={() => requestEmergency('medical', 'Medical Priority Alert', 'Confirm medical evacuation and triage request.')}
              className="emergency-action medical"
            >
              <div className="emergency-action-icon">
                <HeartPulse style={{ width: '24px', height: '24px' }} />
              </div>
              <div className="emergency-action-label">Medical Emergency</div>
              <div className="emergency-action-sub">Paramedic Triage</div>
            </button>

            <button
              type="button"
              onClick={() => requestEmergency('all_clear', 'All Clear Notice', 'Confirm all clear status update.')}
              className="emergency-action clear"
            >
              <div className="emergency-action-icon">
                <ShieldCheck style={{ width: '24px', height: '24px' }} />
              </div>
              <div className="emergency-action-label">All Clear</div>
              <div className="emergency-action-sub">Perimeter Stabilized</div>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section D: Disaster Simulation + Pinout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Disaster Simulations */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity style={{ width: '16px', height: '16px', color: '#C00000' }} />
              <div>
                <div className="card-title">Disaster Simulation</div>
                <div className="card-subtitle">Common Alerting Protocol (CAP) multi-hazard alerts</div>
              </div>
            </div>
            <span className="sim-badge">SIMULATION</span>
          </div>

          <div className="card-body">
            <div className="disaster-grid">
              <button type="button" onClick={() => requestEmergency('cap_flood', 'Simulate Flood Alert', 'Execute simulated Flash Flood CAP alert.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Waves style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Flood Alert</div>
                <div className="disaster-btn-sub">River basin overflow</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_earthquake', 'Simulate Earthquake', 'Execute simulated M6.8 Seismic Event.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Activity style={{ width: '18px', height: '18px', color: '#FF6B6B' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Earthquake</div>
                <div className="disaster-btn-sub">M6.8 Richter Scale</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_landslide', 'Simulate Landslide', 'Execute simulated Hillside Landslide CAP alert.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Mountain style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Landslide</div>
                <div className="disaster-btn-sub">Hillside instability</div>
              </button>

              <button type="button" onClick={() => requestEmergency('cap_tsunami', 'Simulate Tsunami Alert', 'Execute simulated Coastal Tsunami alert.', true)} className="disaster-btn">
                <div className="disaster-btn-header">
                  <Wind style={{ width: '18px', height: '18px', color: '#2DD4BF' }} />
                  <span className="sim-badge">SIM</span>
                </div>
                <div className="disaster-btn-label">Tsunami</div>
                <div className="disaster-btn-sub">Coastal inundation</div>
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
            <div>
              {[
                { label: 'SPI NSS', value: 'GPIO 5' },
                { label: 'DIO1 IRQ', value: 'GPIO 35', ok: true },
                { label: 'NRST Reset', value: 'GPIO 4' },
                { label: 'BUSY Pin', value: 'GPIO 34', ok: true },
                { label: 'SW-420 Sensor', value: 'GPIO 32', warn: true },
                { label: 'Access Point', value: 'BASE_A' },
              ].map(({ label, value, ok, warn }) => (
                <div className="diag-row" key={label}>
                  <span className="diag-label">{label}</span>
                  <span className="diag-value" style={{ color: ok ? '#4ADE80' : warn ? '#FF6B6B' : undefined }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Communication Ledger ─── */}
      <div className="card">
        {/* Ledger Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <List style={{ width: '16px', height: '16px', color: '#C00000' }} />
            <div>
              <div className="card-title">Communication Ledger</div>
              <div className="card-subtitle">Outgoing transmissions, incoming replies and emergency events</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="tab-toggle">
              <button className={`tab-toggle-btn ${viewMode === 'thread' ? 'active' : ''}`} onClick={() => setViewMode('thread')}>
                Thread
              </button>
              <button className={`tab-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                Table
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search style={{ width: '13px', height: '13px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input"
                style={{ paddingLeft: '32px', width: '200px', fontSize: '12.5px', padding: '8px 12px 8px 32px' }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="select"
              style={{ width: '160px', fontSize: '12.5px', padding: '8px 32px 8px 12px' }}
            >
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
                <div style={{ textAlign: 'center', padding: '48px', color: '#858585', fontSize: '13px' }}>
                  No matching messages in ledger.
                </div>
              ) : (
                filteredEvents.map((evt: TransmissionEvent) => {
                  const isSentByA = evt.sourceNodeId === 'BASE_A';
                  const isSOS = evt.category === 'sos';
                  return (
                    <div key={evt.id} className="thread-item" style={{ alignItems: isSentByA ? 'flex-end' : 'flex-start' }}>
                      <div
                        className={`thread-bubble ${isSOS ? 'sos' : isSentByA ? 'outgoing' : 'incoming'}`}
                        style={{ width: '100%', maxWidth: '640px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSentByA ? '#FFAAAA' : '#4ADE80' }}>
                            {isSentByA ? 'BASE STATION A (Outgoing)' : 'BASE STATION C (Incoming Reply)'}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock style={{ width: '11px', height: '11px' }} />
                            {evt.timestamp.toLocaleTimeString()}
                          </span>
                        </div>

                        <p style={{ fontSize: '13.5px', color: '#F5F5F5', lineHeight: 1.55, marginBottom: '12px' }}>
                          {evt.message}
                        </p>

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
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#858585' }}>
                        No records match the active filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev: TransmissionEvent) => {
                      const isSOS = ev.category === 'sos';
                      const isSim = ev.category.startsWith('cap_');
                      const isAck = ev.category === 'ack';
                      return (
                        <tr key={ev.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#858585', whiteSpace: 'nowrap' }}>
                            {ev.timestamp.toLocaleTimeString()}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#FFAAAA', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {ev.id}
                          </td>
                          <td style={{ fontSize: '12px', fontWeight: 600 }}>
                            {ev.sourceNodeId === 'BASE_A' ? 'Base A' : 'Base C'}
                          </td>
                          <td style={{ fontSize: '12px', fontWeight: 600 }}>
                            {ev.destinationNodeId === 'BASE_A' ? 'Base A' : 'Base C'}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                              background: isSOS ? 'rgba(255,0,0,0.1)' : isSim ? 'rgba(255,255,255,0.05)' : isAck ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)',
                              color: isSOS ? '#FF6B6B' : isSim ? '#858585' : isAck ? '#38BDF8' : '#B8B8B8',
                            }}>
                              {isSOS ? 'Emergency' : isSim ? 'Simulation' : isAck ? 'ACK' : 'Tactical'}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', lineHeight: 1.4, maxWidth: '320px' }}>
                            {ev.message}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#C00000', whiteSpace: 'nowrap' }}>
                            {ev.rssiDbm ? `${ev.rssiDbm} dBm` : '−75.2 dBm'}
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                              Delivered
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <MoreVertical style={{ width: '14px', height: '14px', color: '#858585', cursor: 'pointer' }} />
                          </td>
                        </tr>
                      );
                    })
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
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
              Cancel
            </button>
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
            <strong style={{ color: '#F5F5F5' }}>Operational Protocol: </strong>
            {confirmModal.isSimulation
              ? 'This event will be marked [SIMULATION] in the shared ledger and will not trigger live emergency dispatch.'
              : 'This will transmit an authenticated high-priority packet via SX1262 LoRa to Base Station C Command HQ.'}
          </div>
        </div>
      </Modal>
    </div>
  );
}
