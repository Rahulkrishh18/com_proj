import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { EventCategory, NodeId } from '../types';
import { Search, CheckCircle2, Filter } from 'lucide-react';

const CATEGORY_LABELS: Record<EventCategory, string> = {
  message: 'Message', sos: 'Emergency', medical: 'Medical', all_clear: 'All Clear',
  ack: 'ACK', cap_earthquake: 'Earthquake', cap_flood: 'Flood',
  cap_landslide: 'Landslide', cap_tsunami: 'Tsunami', cap_cyclone: 'Cyclone',
  seismic_trigger: 'Seismic', relay: 'Relay', system: 'System',
};

const CATEGORY_COLORS: Partial<Record<EventCategory, string>> = {
  sos: '#FF6B6B', medical: '#FFAAAA', all_clear: '#4ADE80', ack: '#38BDF8',
};

function formatTimestamp(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function LogsPage() {
  const { state } = useApp();
  const { events } = state.dashboard;

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<EventCategory | 'all'>('all');
  const [filterNode, setFilterNode] = useState<NodeId | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) list = list.filter(e => e.message.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'all') list = list.filter(e => e.category === filterCat);
    if (filterNode !== 'all') list = list.filter(e => e.sourceNodeId === filterNode || e.destinationNodeId === filterNode);
    if (filterStatus !== 'all') list = list.filter(e => filterStatus === 'success' ? e.status !== 'failed' : e.status === 'failed');
    return list;
  }, [events, search, filterCat, filterNode, filterStatus]);

  const nodeLabel = (id: string) =>
    id === 'BASE_A' ? 'Base A' : id === 'BASE_C' ? 'Base C' : 'Drone';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="page-title">Communications Log & Ledger</h1>
          <p className="page-description">Persistent multi-station packet audit synchronized across Supabase PostgreSQL</p>
        </div>
        {state.isCloudConnected ? (
          <span className="badge badge-ok" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '4px' }}>
            <span className="status-dot online" />
            CLOUD SYNCED (POSTGRESQL)
          </span>
        ) : (
          <span className="badge badge-burgundy" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '4px' }}>
            LOCAL BUFFER
          </span>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card">
        <div className="filter-bar">
          <Filter style={{ width: '14px', height: '14px', color: '#858585', flexShrink: 0 }} />

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search style={{ width: '13px', height: '13px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#858585' }} />
            <input
              className="input"
              style={{ paddingLeft: '32px', fontSize: '13px' }}
              placeholder="Search messages, packet IDs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category */}
          <select className="select" style={{ width: '160px', fontSize: '13px' }} value={filterCat}
            onChange={e => setFilterCat(e.target.value as EventCategory | 'all')}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Station */}
          <select className="select" style={{ width: '160px', fontSize: '13px' }} value={filterNode}
            onChange={e => setFilterNode(e.target.value as NodeId | 'all')}>
            <option value="all">All Stations</option>
            <option value="BASE_A">Base Station A</option>
            <option value="DRONE_RELAY">Drone Relay</option>
            <option value="BASE_C">Base Station C</option>
          </select>

          {/* Status */}
          <select className="select" style={{ width: '140px', fontSize: '13px' }} value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'success' | 'failed')}>
            <option value="all">All Statuses</option>
            <option value="success">Delivered</option>
            <option value="failed">Failed</option>
          </select>

          <span style={{ fontSize: '12px', color: '#858585', marginLeft: 'auto', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
            {filtered.length} records
          </span>
        </div>

        {/* Table */}
        <div className="table-wrap" style={{ borderRadius: 0, border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-time">Time</th>
                <th className="col-id">Event ID</th>
                <th className="col-src">Source</th>
                <th className="col-dst">Destination</th>
                <th className="col-cat">Category</th>
                <th className="col-msg">Message</th>
                <th>Transport</th>
                <th>ACK State</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#858585' }}>
                    No matching packet logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((ev, idx) => {
                  const catColor = CATEGORY_COLORS[ev.category];
                  const isAcked = ev.status === 'ack_received' || ev.category === 'ack';
                  return (
                    <tr key={ev.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#858585', whiteSpace: 'nowrap' }}>
                        {formatTimestamp(ev.timestamp)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858585', whiteSpace: 'nowrap' }}>
                        {ev.id.length > 12 ? `PKT-${ev.id.slice(0, 8)}` : `PKT-${98404 + idx}`}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {nodeLabel(ev.sourceNodeId)}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {nodeLabel(ev.destinationNodeId)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600,
                          background: catColor ? `${catColor}18` : 'rgba(255,255,255,0.05)',
                          color: catColor ?? '#B8B8B8',
                          border: `1px solid ${catColor ? `${catColor}35` : 'rgba(255,255,255,0.08)'}`,
                        }}>
                          {CATEGORY_LABELS[ev.category] || ev.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#F5F5F5', lineHeight: 1.5, maxWidth: '340px' }}>
                        {ev.message}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px',
                          background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)',
                          fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                        }}>
                          Cloud Delivered
                        </span>
                      </td>
                      <td>
                        {isAcked ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#4ADE80', whiteSpace: 'nowrap' }}>
                            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                            ACK Confirmed
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#858585', whiteSpace: 'nowrap' }}>
                            Unacknowledged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
