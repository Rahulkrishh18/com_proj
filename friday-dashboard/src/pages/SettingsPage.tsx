import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Radio, Wifi, Save } from 'lucide-react';

export function SettingsPage() {
  const { toast } = useApp();

  const [frequency, setFrequency] = useState('868.0');
  const [bandwidth, setBandwidth] = useState('125.0');
  const [sf, setSf] = useState('7');
  const [cr, setCr] = useState('5');
  const [power, setPower] = useState('22');
  const [baseAIp, setBaseAIp] = useState('192.168.4.1');
  const [baseCIp, setBaseCIp] = useState('192.168.4.1');
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoAck, setAutoAck] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Mission Control parameters applied successfully', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--c-border)' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon style={{ width: '20px', height: '20px', color: '#C00000' }} />
            System Configuration
          </h1>
          <p className="page-description">RF radio modulation parameters, hardware endpoint bridges, and alert preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* RF Parameters Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Radio style={{ width: '16px', height: '16px', color: '#C00000', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>SX1262 LoRa Modulation Profile</div>
                <div style={{ fontSize: '12px', color: '#858585', marginTop: '2px' }}>Carrier frequency, bandwidth, and spreading factor</div>
              </div>
            </div>

            <div className="settings-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Carrier Frequency (MHz)</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="select">
                  <option value="433.0">433.000 MHz — ISM Asia / Europe</option>
                  <option value="868.0">868.000 MHz — EU ISM Band</option>
                  <option value="915.0">915.000 MHz — US915 Band</option>
                </select>
                <p className="form-hint">Matched to antenna length on all 3 nodes.</p>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Signal Bandwidth</label>
                  <select value={bandwidth} onChange={e => setBandwidth(e.target.value)} className="select">
                    <option value="125.0">125.0 kHz (Default)</option>
                    <option value="250.0">250.0 kHz</option>
                    <option value="500.0">500.0 kHz (High Throughput)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Spreading Factor</label>
                  <select value={sf} onChange={e => setSf(e.target.value)} className="select">
                    <option value="7">SF7 — Fast / Normal Range</option>
                    <option value="8">SF8</option>
                    <option value="9">SF9</option>
                    <option value="10">SF10 — Extended Range</option>
                    <option value="12">SF12 — Ultra Long Range</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Coding Rate</label>
                  <select value={cr} onChange={e => setCr(e.target.value)} className="select">
                    <option value="5">4/5 — Standard</option>
                    <option value="6">4/6</option>
                    <option value="7">4/7</option>
                    <option value="8">4/8 — Max Resilience</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transmit Power (dBm)</label>
                  <select value={power} onChange={e => setPower(e.target.value)} className="select">
                    <option value="14">+14 dBm — 25 mW</option>
                    <option value="17">+17 dBm — 50 mW</option>
                    <option value="20">+20 dBm — 100 mW</option>
                    <option value="22">+22 dBm — 160 mW Max</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Network & IP Bridge */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Wifi style={{ width: '16px', height: '16px', color: '#C00000', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>ESP32 Wi-Fi AP Endpoints</div>
                <div style={{ fontSize: '12px', color: '#858585', marginTop: '2px' }}>Network bridge IP configuration and alert preferences</div>
              </div>
            </div>

            <div className="settings-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Base Station A — Endpoint IP</label>
                <input
                  type="text"
                  value={baseAIp}
                  onChange={e => setBaseAIp(e.target.value)}
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <p className="form-hint">SSID: BASE_A &nbsp;·&nbsp; WPA2: friday123</p>
              </div>

              <div className="form-group">
                <label className="form-label">Base Station C — Endpoint IP</label>
                <input
                  type="text"
                  value={baseCIp}
                  onChange={e => setBaseCIp(e.target.value)}
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <p className="form-hint">SSID: BASE_C &nbsp;·&nbsp; WPA2: friday123</p>
              </div>

              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={audioAlerts}
                    onChange={e => setAudioAlerts(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#C00000', width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#F5F5F5' }}>Audio Beacon & Synth Sirens</div>
                    <div style={{ fontSize: '12px', color: '#858585', marginTop: '2px' }}>Enable audio alerts on critical SOS events</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoAck}
                    onChange={e => setAutoAck(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#C00000', width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#F5F5F5' }}>Automatic Command Acknowledgment (ACK)</div>
                    <div style={{ fontSize: '12px', color: '#858585', marginTop: '2px' }}>Auto-send ACK response on incoming CAP events</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--c-border)' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '13px' }}>
            Reset to Defaults
          </button>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '13px' }}>
            <Save style={{ width: '14px', height: '14px' }} />
            Apply & Save Parameters
          </button>
        </div>
      </form>
    </div>
  );
}
