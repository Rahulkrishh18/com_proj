import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkTopology } from '../components/network/NetworkTopology';
import type { TransmissionEvent } from '../types';
import {
  Cpu, Radio, Clock, Search,
  RefreshCw, RadioTower, RadioReceiver, Shield, FileText,
  Activity, Eye, X, Layers
} from 'lucide-react';

interface DroneRelayPageProps {
  activeTab?: 'overview' | 'monitor' | 'ledger' | 'activity' | 'audit';
}

export function DroneRelayPage({ activeTab = 'overview' }: DroneRelayPageProps) {
  const { state, dispatch, toast } = useApp();
  const { events } = state.dashboard;
  const { auditEvents } = state;

  const [tab, setTab] = useState<'overview' | 'monitor' | 'ledger' | 'activity' | 'audit'>(activeTab);

  // Ledger Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState<'ALL' | 'BASE_A' | 'BASE_C'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'A_TO_C' | 'C_TO_A'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING'>('ALL');
  const [ackFilter, setAckFilter] = useState<'ALL' | 'ACKED' | 'UNACKED'>('ALL');

  // Audit Filter states
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // Selected message for lifecycle inspector modal
  const [selectedMessage, setSelectedMessage] = useState<TransmissionEvent | null>(null);

  // Sync tab prop changes
  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  // Filtered messages for ledger
  const filteredMessages = useMemo(() => {
    return events.filter(e => {
      // Station
      if (stationFilter === 'BASE_A' && e.sourceNodeId !== 'BASE_A' && e.destinationNodeId !== 'BASE_A') return false;
      if (stationFilter === 'BASE_C' && e.sourceNodeId !== 'BASE_C' && e.destinationNodeId !== 'BASE_C') return false;
      // Direction
      if (directionFilter === 'A_TO_C' && e.sourceNodeId !== 'BASE_A') return false;
      if (directionFilter === 'C_TO_A' && e.sourceNodeId !== 'BASE_C') return false;
      // Category
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'EMERGENCY' && !(e.category === 'sos' || e.category === 'medical' || e.category.startsWith('cap_'))) return false;
        else if (categoryFilter === 'NORMAL' && e.category !== 'message') return false;
        else if (categoryFilter === 'ACK' && e.category !== 'ack') return false;
      }
      // Delivery status
      if (deliveryFilter === 'DELIVERED' && e.status !== 'rx_delivered' && e.status !== 'ack_received') return false;
      if (deliveryFilter === 'PENDING' && (e.status === 'rx_delivered' || e.status === 'ack_received')) return false;
      // ACK status
      if (ackFilter === 'ACKED' && e.status !== 'ack_received') return false;
      if (ackFilter === 'UNACKED' && e.status === 'ack_received') return false;
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!e.message.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, stationFilter, directionFilter, categoryFilter, deliveryFilter, ackFilter, searchTerm]);

  // Filtered audit events
  const filteredAudits = useMemo(() => {
    return auditEvents.filter(a => {
      if (auditRoleFilter !== 'ALL' && a.station_role !== auditRoleFilter) return false;
      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.toLowerCase();
        if (!a.action_type.toLowerCase().includes(q) && !a.details.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [auditEvents, auditRoleFilter, auditSearchTerm]);

  // Metrics calculations
  const totalAtoC = useMemo(() => events.filter(e => e.sourceNodeId === 'BASE_A').length, [events]);
  const totalCtoA = useMemo(() => events.filter(e => e.sourceNodeId === 'BASE_C').length, [events]);
  const totalEmergency = useMemo(() => events.filter(e => e.category === 'sos' || e.category === 'medical' || e.category.startsWith('cap_')).length, [events]);
  const pendingAcks = useMemo(() => events.filter(e => e.status !== 'ack_received').length, [events]);

  const lastActivityA = useMemo(() => {
    const ev = events.find(e => e.sourceNodeId === 'BASE_A' || e.destinationNodeId === 'BASE_A');
    return ev ? ev.timestamp.toLocaleTimeString() : 'Active';
  }, [events]);

  const lastActivityC = useMemo(() => {
    const ev = events.find(e => e.sourceNodeId === 'BASE_C' || e.destinationNodeId === 'BASE_C');
    return ev ? ev.timestamp.toLocaleTimeString() : 'Active';
  }, [events]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ─── Top Banner ─── */}
      <div className="station-banner">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="station-banner-icon">
              <Cpu style={{ width: '22px', height: '22px', color: '#FFAAAA' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.01em' }}>
                  Drone Relay — Unified Monitoring Station
                </h1>
                <span className="badge badge-burgundy">AIRBORNE RELAY</span>
                <span className="badge badge-neutral" style={{ color: '#FFAAAA', borderColor: 'rgba(192,0,0,0.4)' }}>
                  MONITORING-ONLY ROLE
                </span>
                <span className="badge badge-ok">
                  <span className="status-dot online" />
                  CLOUD LIVE DEMO
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#858585', marginTop: '5px', lineHeight: 1.5 }}>
                Unified oversight of bidirectional field communications between Base Station A (0xFA) and Base Station C (0xFF).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { dispatch({ type: 'REFRESH_TELEMETRY' }); toast('Relay RF metrics refreshed', 'info'); }}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              <RefreshCw style={{ width: '13px', height: '13px', color: '#C00000' }} />
              Sample Registers
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap'
        }}>
          {[
            { id: 'overview', label: 'Network Overview', Icon: Layers },
            { id: 'monitor', label: 'Live Message Monitor', Icon: Activity },
            { id: 'ledger', label: 'Unified Message Ledger', Icon: FileText, badge: String(events.length) },
            { id: 'activity', label: 'Station Activity', Icon: Radio },
            { id: 'audit', label: 'Immutable Audit Log', Icon: Shield, badge: String(auditEvents.length) },
          ].map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`tab-toggle-btn ${tab === id ? 'active' : ''}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', fontSize: '12.5px', borderRadius: '6px'
              }}
            >
              <Icon size={13} />
              <span>{label}</span>
              {badge && (
                <span style={{
                  fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.1)', color: '#F5F5F5'
                }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: Network Overview ─── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Station Trio Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Station A */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RadioTower size={16} className="text-[#FFAAAA]" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>Base Station Alpha</span>
                </div>
                <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>0xFA</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#B8B8B8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{ color: '#4ADE80', fontWeight: 600 }}>Online · Cloud Live</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Role:</span>
                  <span>Origin Ground Field</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last Activity:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{lastActivityA}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transmissions:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F5F5F5' }}>{totalAtoC} pkts</span>
                </div>
              </div>
            </div>

            {/* Drone Relay Node */}
            <div className="card" style={{ padding: '18px 20px', borderColor: 'rgba(192,0,0,0.4)', background: 'rgba(128,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} className="text-[#FF6B6B]" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>Drone Airborne Relay</span>
                </div>
                <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>RELAY</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#B8B8B8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{ color: '#4ADE80', fontWeight: 600 }}>Active · Forwarding</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>RF Bridge:</span>
                  <span>Dual SX1262 (0xFA ⇄ 0xFF)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hardware Link:</span>
                  <span style={{ color: '#FBBF24' }}>Cloud Demo (LoRa Pending)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Relayed:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFAAAA' }}>{events.length} pkts</span>
                </div>
              </div>
            </div>

            {/* Station C */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RadioReceiver size={16} className="text-[#FFAAAA]" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>Base Station Charlie</span>
                </div>
                <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>0xFF</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#B8B8B8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{ color: '#4ADE80', fontWeight: 600 }}>Online · Cloud Live</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Role:</span>
                  <span>Command HQ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last Activity:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{lastActivityC}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transmissions:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F5F5F5' }}>{totalCtoA} pkts</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Key Operational Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total Packets', value: String(events.length), sub: 'Shared Ledger', color: '#F5F5F5' },
              { label: 'Routed A → C', value: String(totalAtoC), sub: 'Field Uplinks', color: '#FFAAAA' },
              { label: 'Routed C → A', value: String(totalCtoA), sub: 'HQ Downlinks', color: '#FFAAAA' },
              { label: 'Cloud Delivery', value: '100%', sub: 'Cloud Delivered', color: '#4ADE80' },
              { label: 'Pending ACKs', value: String(pendingAcks), sub: 'Awaiting Confirm', color: pendingAcks > 0 ? '#FBBF24' : '#4ADE80' },
              { label: 'Emergency Alerts', value: String(totalEmergency), sub: 'SOS & Disasters', color: totalEmergency > 0 ? '#FF6B6B' : '#B8B8B8' },
            ].map(({ label, value, sub, color }) => (
              <div className="metric-card" key={label}>
                <div className="metric-label">{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
                  {value}
                </div>
                <div className="metric-sub">{sub}</div>
              </div>
            ))}
          </div>

          {/* Topology Visualization */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Network Topology — Multi-Hop Airborne Route</div>
                <div className="card-subtitle">Real-time simulation of RF relay link with dual SX1262 sync word translation</div>
              </div>
              <span className="badge badge-ok" style={{ fontSize: '10px' }}>CLOUD DEMO TRANSPORT</span>
            </div>
            <div className="card-body" style={{ padding: '20px' }}>
              <div className="topology-container" style={{ padding: '16px' }}>
                <NetworkTopology />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Live Message Monitor ─── */}
      {tab === 'monitor' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Live Message Stream — 3-Step Hop Progression</div>
              <div className="card-subtitle">Visualizing real-time reception, airborne translation, and endpoint delivery</div>
            </div>
            <span className="badge badge-burgundy" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              LIVE MONITOR
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '680px', overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#858585', fontSize: '13px' }}>
                No message transmissions recorded yet.
              </div>
            ) : (
              events.map((ev) => {
                const isAtoC = ev.sourceNodeId === 'BASE_A';
                const isSOS = ev.category === 'sos';
                return (
                  <div key={ev.id} style={{
                    borderRadius: '10px', border: '1px solid',
                    borderColor: isSOS ? 'rgba(192, 0, 0, 0.4)' : 'var(--c-border)',
                    background: isSOS ? 'rgba(128, 0, 0, 0.08)' : 'var(--c-well)',
                    padding: '16px 20px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: 700, color: '#F5F5F5' }}>Packet #{ev.id.slice(0, 8)}</span>
                        <span className="badge badge-burgundy" style={{ fontSize: '10px' }}>
                          {isAtoC ? 'UPLINK A → C' : 'DOWNLINK C → A'}
                        </span>
                        {ev.category === 'sos' && <span className="badge badge-sos" style={{ fontSize: '10px' }}>SOS</span>}
                        {ev.category === 'medical' && <span className="badge badge-burgundy" style={{ fontSize: '10px' }}>MEDICAL</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#858585', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={12} />
                        <span>{ev.timestamp.toLocaleTimeString()}</span>
                        <span className="badge badge-ok" style={{ fontSize: '10px' }}>
                          ✓ {ev.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* 3-Step Hop Progression */}
                    <div className="relay-hop">
                      {/* Step 1: Origin */}
                      <div className="relay-step">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700, color: '#F5F5F5' }}>1. {isAtoC ? 'BASE A (Field)' : 'BASE C (HQ)'}</span>
                          <span style={{ color: '#858585' }}>{ev.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#FFAAAA', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          Sync: {isAtoC ? '0xFA' : '0xFF'} · Cloud Submitted
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#F5F5F5', marginTop: '6px', lineHeight: 1.4 }}>
                          "{ev.message}"
                        </p>
                      </div>

                      {/* Step 2: Drone Relay */}
                      <div className="relay-step" style={{ borderColor: 'rgba(192,0,0,0.4)', background: 'rgba(128,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700, color: '#FFAAAA' }}>2. DRONE RELAY BRIDGE</span>
                          <span style={{ color: '#4ADE80' }}>Translated</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#B8B8B8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          Translation: {isAtoC ? '0xFA ➔ 0xFF' : '0xFF ➔ 0xFA'} · Re-transmitted
                        </div>
                        <div style={{ fontSize: '11px', color: '#858585', marginTop: '6px' }}>
                          Transport: Cloud Delivered (LoRa hardware pending)
                        </div>
                      </div>

                      {/* Step 3: Destination */}
                      <div className="relay-step">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700, color: '#F5F5F5' }}>3. {isAtoC ? 'BASE C (HQ)' : 'BASE A (Field)'}</span>
                          <span style={{ color: ev.status === 'ack_received' ? '#4ADE80' : '#FBBF24' }}>
                            {ev.status === 'ack_received' ? '✓ ACKED' : 'Delivered'}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#B8B8B8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          Sync: {isAtoC ? '0xFF' : '0xFA'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#858585', marginTop: '6px' }}>
                          Status: {ev.status === 'ack_received' ? 'Verified ACK confirmed' : 'Awaiting endpoint response'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Unified Message Ledger ─── */}
      {tab === 'ledger' && (
        <div className="card">
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--c-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={16} className="text-[#C00000]" />
              <div>
                <div className="card-title">Complete Message Ledger</div>
                <div className="card-subtitle">Permanent PostgreSQL database records from both stations</div>
              </div>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '32px', width: '160px', fontSize: '12px', padding: '6px 12px 6px 32px' }}
                />
              </div>

              <select
                value={stationFilter}
                onChange={e => setStationFilter(e.target.value as typeof stationFilter)}
                className="select"
                style={{ width: '120px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All Stations</option>
                <option value="BASE_A">Station Alpha</option>
                <option value="BASE_C">Station Charlie</option>
              </select>

              <select
                value={directionFilter}
                onChange={e => setDirectionFilter(e.target.value as typeof directionFilter)}
                className="select"
                style={{ width: '130px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All Routes</option>
                <option value="A_TO_C">A ➔ RELAY ➔ C</option>
                <option value="C_TO_A">C ➔ RELAY ➔ A</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="select"
                style={{ width: '125px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All Categories</option>
                <option value="NORMAL">Normal</option>
                <option value="EMERGENCY">Emergency (SOS)</option>
                <option value="ACK">Acknowledgements</option>
              </select>

              <select
                value={deliveryFilter}
                onChange={e => setDeliveryFilter(e.target.value as typeof deliveryFilter)}
                className="select"
                style={{ width: '125px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All Deliveries</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
              </select>

              <select
                value={ackFilter}
                onChange={e => setAckFilter(e.target.value as typeof ackFilter)}
                className="select"
                style={{ width: '125px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All ACK States</option>
                <option value="ACKED">Acknowledged</option>
                <option value="UNACKED">Unacknowledged</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="log-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>ID</th>
                  <th>Route</th>
                  <th>Category</th>
                  <th>Message Content</th>
                  <th>Delivery</th>
                  <th>ACK Status</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#858585' }}>
                      No messages matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map((ev) => {
                    const isAtoC = ev.sourceNodeId === 'BASE_A';
                    return (
                      <tr key={ev.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858585', whiteSpace: 'nowrap' }}>
                          {ev.timestamp.toLocaleTimeString()}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#B8B8B8' }}>
                          #{ev.id.slice(0, 8)}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            padding: '2px 6px', borderRadius: '4px',
                            background: isAtoC ? 'rgba(192,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                            color: isAtoC ? '#FFAAAA' : '#E5E5E5'
                          }}>
                            {isAtoC ? 'A ➔ RELAY ➔ C' : 'C ➔ RELAY ➔ A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${ev.category === 'sos' ? 'badge-sos' : 'badge-burgundy'}`} style={{ fontSize: '10px' }}>
                            {ev.category.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: '#F5F5F5', maxWidth: '300px' }}>
                          {ev.message}
                        </td>
                        <td>
                          <span className="badge badge-ok" style={{ fontSize: '9.5px' }}>
                            Cloud Delivered
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: 600,
                            color: ev.status === 'ack_received' ? '#4ADE80' : '#FBBF24'
                          }}>
                            {ev.status === 'ack_received' ? '✓ ACKED' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(ev)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <Eye size={12} />
                            Lifecycle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Station Activity Timeline ─── */}
      {tab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Station Activity Timeline</div>
              <div className="card-subtitle">Comparative chronological activity of Base Station A vs Base Station C</div>
            </div>
            <span className="badge badge-burgundy" style={{ fontSize: '10px' }}>DUAL STATION AUDIT</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '640px', overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#858585' }}>No activity recorded yet.</div>
            ) : (
              events.map((ev) => {
                const isStationA = ev.sourceNodeId === 'BASE_A';
                return (
                  <div key={ev.id} style={{
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    padding: '14px 16px', borderRadius: '8px',
                    background: 'var(--c-well)', border: '1px solid var(--c-border)',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '6px',
                      background: isStationA ? 'rgba(192,0,0,0.2)' : 'rgba(128,0,0,0.3)',
                      border: `1px solid ${isStationA ? '#C00000' : '#800000'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isStationA ? <RadioTower size={14} className="text-[#FFAAAA]" /> : <RadioReceiver size={14} className="text-[#FFCCCC]" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#F5F5F5' }}>
                          {isStationA ? 'Base Station Alpha (0xFA)' : 'Base Station Charlie (0xFF)'}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#858585' }}>
                          {ev.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#B8B8B8', lineHeight: 1.4 }}>
                        {ev.message}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#777' }}>
                        <span>Target: {ev.destinationNodeId}</span>
                        <span>·</span>
                        <span>Status: {ev.status}</span>
                        {ev.direction && <><span>·</span><span>Direction: {ev.direction}</span></>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Immutable Audit Log ─── */}
      {tab === 'audit' && (
        <div className="card">
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--c-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={16} className="text-[#C00000]" />
              <div>
                <div className="card-title">Station Activity Audit Log (Append-Only)</div>
                <div className="card-subtitle">Cryptographically enforced append-only audit trail in PostgreSQL</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-ok" style={{ fontSize: '10px' }}>
                RLS: APPEND-ONLY ENFORCED
              </span>

              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
                <input
                  type="text"
                  placeholder="Filter audit..."
                  value={auditSearchTerm}
                  onChange={e => setAuditSearchTerm(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '32px', width: '160px', fontSize: '12px', padding: '6px 12px 6px 32px' }}
                />
              </div>

              <select
                value={auditRoleFilter}
                onChange={e => setAuditRoleFilter(e.target.value)}
                className="select"
                style={{ width: '140px', fontSize: '12px', padding: '6px 28px 6px 10px' }}
              >
                <option value="ALL">All Roles</option>
                <option value="BASE_A">Station Alpha</option>
                <option value="BASE_C">Station Charlie</option>
                <option value="DRONE_RELAY">Drone Relay</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="log-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Station Role</th>
                  <th>Action Type</th>
                  <th>Audit Details</th>
                  <th>Linked Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#858585' }}>
                      No audit events found. (Perform station actions to populate).
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858585', whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at).toLocaleTimeString()}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                          padding: '2px 6px', borderRadius: '4px',
                          background: item.station_role === 'BASE_A' ? 'rgba(192,0,0,0.2)' : item.station_role === 'BASE_C' ? 'rgba(128,0,0,0.3)' : 'rgba(255,255,255,0.06)',
                          color: '#F5F5F5'
                        }}>
                          {item.station_role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                          color: item.action_type.includes('SOS') || item.action_type.includes('FAILED') ? '#FF6B6B' : item.action_type.includes('ACK') ? '#4ADE80' : '#FFAAAA'
                        }}>
                          {item.action_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#E5E5E5' }}>
                        {item.details}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858585' }}>
                        {item.message_id ? `#${item.message_id.slice(0, 8)}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal: Message Lifecycle Inspector ─── */}
      {selectedMessage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#141414', border: '1px solid #282828', borderRadius: '12px',
            width: '100%', maxWidth: '600px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} className="text-[#C00000]" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
                  Packet Lifecycle Inspector: #{selectedMessage.id.slice(0, 8)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                style={{ background: 'none', border: 'none', color: '#858585', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#1A1A1A', padding: '12px 14px', borderRadius: '8px', border: '1px solid #2D2D2D' }}>
                <div style={{ fontSize: '11px', color: '#858585', marginBottom: '4px' }}>PAYLOAD CONTENT</div>
                <div style={{ fontSize: '14px', color: '#F5F5F5', fontWeight: 500 }}>
                  "{selectedMessage.message}"
                </div>
              </div>

              {/* Lifecycle Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '99px', background: '#4ADE80', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                      Message Created & Dispatched by {selectedMessage.sourceNodeId}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#858585' }}>
                      Timestamp: {selectedMessage.timestamp.toLocaleString()} · Destination: {selectedMessage.destinationNodeId}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '99px', background: '#4ADE80', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                      Cloud Persistence & Realtime Broadcast Confirmed
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#858585' }}>
                      PostgreSQL record created · Supabase Realtime WebSocket event emitted
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '99px', background: '#FFAAAA', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                      Forwarded Across Airborne Relay Bridge
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#858585' }}>
                      Route: {selectedMessage.sourceNodeId === 'BASE_A' ? '0xFA (Field) ➔ 0xFF (HQ)' : '0xFF (HQ) ➔ 0xFA (Field)'} · Status: Cloud Delivered
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '99px',
                    background: selectedMessage.status === 'ack_received' ? '#4ADE80' : '#FBBF24',
                    color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0
                  }}>
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                      {selectedMessage.status === 'ack_received' ? 'Acknowledged by Recipient' : 'Awaiting Acknowledgment'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#858585' }}>
                      {selectedMessage.status === 'ack_received'
                        ? 'Confirmed receipt verified in database ledger'
                        : 'Destination has received packet; ACK pending operator action'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
