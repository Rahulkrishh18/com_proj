import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import type { EventCategory, EmergencyIncident } from '../types';
import { AlertOctagon, CheckCircle2, Waves, Activity, Mountain, Wind, ShieldCheck, Clock } from 'lucide-react';

export function EmergencyPage() {
  const { state, transmit, dispatch, toast } = useApp();
  const { dashboard } = state;

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    label: string;
    category: EventCategory;
    message: string;
    severity: 'critical' | 'high' | 'moderate';
  } | null>(null);

  const activeIncidents = dashboard.incidents.filter((i: EmergencyIncident) => !i.resolved);
  const resolvedIncidents = dashboard.incidents.filter((i: EmergencyIncident) => i.resolved);

  function triggerPreset(label: string, category: EventCategory, message: string, severity: 'critical' | 'high' | 'moderate') {
    setSelectedAction({ label, category, message, severity });
    setConfirmModalOpen(true);
  }

  function handleConfirmDispatch() {
    if (!selectedAction) return;
    transmit('BASE_A', 'BASE_C', selectedAction.category, selectedAction.message, 'North-East');

    if (selectedAction.severity !== 'moderate' && selectedAction.category !== 'all_clear') {
      const incident: EmergencyIncident = {
        id: Math.random().toString(36).slice(2),
        createdAt: new Date(),
        updatedAt: new Date(),
        type: selectedAction.category,
        severity: selectedAction.severity,
        sourceNodeId: 'BASE_A',
        title: selectedAction.label,
        description: selectedAction.message,
        resolved: false,
        events: [],
        isSimulated: true,
      };
      dispatch({ type: 'ADD_INCIDENT', incident });
    }

    setConfirmModalOpen(false);
    setSelectedAction(null);
    toast(`Dispatched ${selectedAction.label} alert`, 'success');
  }

  function handleResolve(id: string) {
    dispatch({ type: 'RESOLVE_INCIDENT', id });
    toast('Incident marked as resolved', 'info');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="page-title">Emergency Operations</h1>
          <p className="page-description">CAP event lifecycle management and incident triage center</p>
        </div>
        <span className="badge badge-burgundy" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '4px' }}>
          DEMO MODE
        </span>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'start' }}>

        {/* Left: Preset Dispatcher */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertOctagon style={{ width: '16px', height: '16px', color: '#FF6B6B' }} />
              <div>
                <div className="card-title">Emergency Preset Dispatcher</div>
                <div className="card-subtitle">Transmit pre-defined emergency alerts over the 433 MHz LoRa network</div>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Primary Emergency Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                type="button"
                onClick={() => triggerPreset('SOS Emergency', 'sos', 'SOS — Immediate assistance required. Emergency rescue alarm.', 'critical')}
                className="emergency-action sos"
                style={{ minHeight: '90px' }}
              >
                <div className="emergency-action-icon">
                  <AlertOctagon style={{ width: '26px', height: '26px' }} />
                </div>
                <div className="emergency-action-label" style={{ fontSize: '13px' }}>SOS EMERGENCY</div>
                <div className="emergency-action-sub">Immediate Rescue Alarm</div>
              </button>

              <button
                type="button"
                onClick={() => triggerPreset('Medical Emergency', 'medical', 'Medical Emergency — Paramedic triage requested.', 'high')}
                className="emergency-action medical"
                style={{ minHeight: '90px' }}
              >
                <div className="emergency-action-icon">
                  <Activity style={{ width: '26px', height: '26px' }} />
                </div>
                <div className="emergency-action-label" style={{ fontSize: '13px' }}>MEDICAL EMERGENCY</div>
                <div className="emergency-action-sub">Paramedic Triage</div>
              </button>
            </div>

            {/* CAP Simulations */}
            <div>
              <div className="section-title" style={{ marginBottom: '12px' }}>CAP Simulation Drills</div>
              <div className="disaster-grid">
                <button type="button" onClick={() => triggerPreset('Earthquake (CAP)', 'cap_earthquake', 'CAP ALERT: Earthquake M7.2 detected.', 'critical')} className="disaster-btn">
                  <div className="disaster-btn-header">
                    <Mountain style={{ width: '16px', height: '16px', color: '#C00000' }} />
                    <span className="sim-badge">CAP</span>
                  </div>
                  <div className="disaster-btn-label">Earthquake</div>
                  <div className="disaster-btn-sub">M7.2 Seismic event</div>
                </button>

                <button type="button" onClick={() => triggerPreset('Flood (CAP)', 'cap_flood', 'CAP ALERT: Flash Flood warning issued.', 'high')} className="disaster-btn">
                  <div className="disaster-btn-header">
                    <Waves style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
                    <span className="sim-badge">CAP</span>
                  </div>
                  <div className="disaster-btn-label">Flash Flood</div>
                  <div className="disaster-btn-sub">River basin overflow</div>
                </button>

                <button type="button" onClick={() => triggerPreset('Landslide (CAP)', 'cap_landslide', 'CAP ALERT: Landslide risk on northern routes.', 'high')} className="disaster-btn">
                  <div className="disaster-btn-header">
                    <Mountain style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                    <span className="sim-badge">CAP</span>
                  </div>
                  <div className="disaster-btn-label">Landslide</div>
                  <div className="disaster-btn-sub">Debris flow risk</div>
                </button>

                <button type="button" onClick={() => triggerPreset('Tsunami (CAP)', 'cap_tsunami', 'CAP ALERT: Tsunami coastal warning.', 'critical')} className="disaster-btn">
                  <div className="disaster-btn-header">
                    <Wind style={{ width: '16px', height: '16px', color: '#06B6D4' }} />
                    <span className="sim-badge">CAP</span>
                  </div>
                  <div className="disaster-btn-label">Tsunami</div>
                  <div className="disaster-btn-sub">Coastal evacuation</div>
                </button>
              </div>
            </div>

            {/* All Clear */}
            <button
              type="button"
              onClick={() => triggerPreset('All Clear', 'all_clear', 'All Clear — Sector stabilised. Personnel accounted for.', 'moderate')}
              className="emergency-action clear"
              style={{ width: '100%', minHeight: '52px' }}
            >
              <div className="emergency-action-icon">
                <ShieldCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="emergency-action-label">ALL CLEAR — SECTOR STABILISED</div>
            </button>
          </div>
        </div>

        {/* Right: Active + Resolved Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Active Incidents */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div className="card-title">Active Incidents</div>
                  <div className="card-subtitle">{activeIncidents.length} unresolved</div>
                </div>
              </div>
              {activeIncidents.length > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                  background: 'rgba(255, 0, 0, 0.1)', color: '#FF6B6B',
                  border: '1px solid rgba(255, 0, 0, 0.25)',
                }}>
                  {activeIncidents.length} ACTIVE
                </span>
              )}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeIncidents.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#858585', fontSize: '13px', background: 'var(--c-well)', borderRadius: '8px', border: '1px solid var(--c-border)' }}>
                  No active incidents. Sector clear.
                </div>
              ) : (
                activeIncidents.map((i: EmergencyIncident) => (
                  <div key={i.id} className="incident-card active">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FF6B6B' }}>{i.title}</div>
                      <span style={{
                        fontSize: '9.5px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                        padding: '2px 7px', borderRadius: '4px',
                        background: 'rgba(192, 0, 0, 0.3)', color: '#FFAAAA',
                        border: '1px solid rgba(192,0,0,0.4)', flexShrink: 0,
                      }}>
                        {i.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#B8B8B8', lineHeight: 1.5, marginBottom: '12px' }}>{i.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#858585', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '10px', height: '10px' }} />
                        {i.createdAt.toLocaleTimeString()}
                      </span>
                      <button type="button" onClick={() => handleResolve(i.id)} className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '5px 12px' }}>
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resolved Incidents */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Resolved Incidents</div>
                <div className="card-subtitle">{resolvedIncidents.length} resolved</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resolvedIncidents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#858585', fontSize: '12.5px' }}>
                  No resolved history.
                </div>
              ) : (
                resolvedIncidents.slice(0, 4).map((i: EmergencyIncident) => (
                  <div key={i.id} className="incident-card resolved" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#B8B8B8' }}>{i.title}</span>
                      <span style={{ fontSize: '11px', color: '#858585', fontFamily: 'var(--font-mono)' }}>
                        {i.resolvedAt?.toLocaleTimeString() ?? i.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#4ADE80', flexShrink: 0 }}>
                      <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                      Resolved
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedAction && (
        <Modal
          open={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title="Confirm Emergency Broadcast"
          footer={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
              <button type="button"
                className={`btn ${selectedAction.severity === 'critical' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmDispatch}>
                Confirm & Broadcast
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#F5F5F5' }}>
            <p style={{ lineHeight: 1.6 }}>
              Broadcast <strong style={{ color: '#FFAAAA' }}>{selectedAction.label}</strong> over the 433 MHz LoRa channel?
            </p>
            <div style={{ padding: '14px 16px', background: 'var(--c-well)', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '12.5px', color: '#B8B8B8', lineHeight: 1.6 }}>
              {selectedAction.message}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
