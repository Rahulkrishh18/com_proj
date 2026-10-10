/**
 * F.R.I.D.A.Y. - Mission Control & Telemetry Ground Station
 * Professional Enterprise Frontend Engine
 */

// Global State
const appState = {
  mode: 'simulation', // 'simulation' | 'esp32_live'
  audioEnabled: true,
  activeTab: 'overview',
  packetCounter: 0,
  relayAtoC: 0,
  relayCtoA: 0,
  uptimeSeconds: 0,

  // RF Metrics & Calibration
  txRefRSSI: -30.0,
  pathLossN: 2.7,
  lastRSSI: -68.4,
  lastSNR: 9.2,
  lastDist: 1.45,

  // Seismic Sensor State
  isSeismicTriggered: false,
  peakAccel: 0.04,

  // Geo Coordinates
  geo: {
    baseA: [12.9716, 77.5946],
    drone: [12.9780, 77.6010],
    baseC: [12.9850, 77.6120]
  },

  // ESP32 IP Endpoints
  endpoints: {
    baseA: 'http://192.168.4.1',
    drone: 'http://192.168.4.1',
    baseC: 'http://192.168.4.1',
    pollRate: 1200
  },

  logs: [],
  capAlerts: []
};

// Canvas & Map Objects
let rfChartInstance = null;
let seismicScopeInstance = null;
let mapInstance = null;
let mapLayers = {};

// Clean Web Audio Telemetry Synthesizer
class TelemetryAudio {
  constructor() {
    this.ctx = null;
    this.init = false;
  }

  getAudioContext() {
    if (!this.init) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.init = true;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTxPing() {
    if (!appState.audioEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch(e) {}
  }

  playRxChime() {
    if (!appState.audioEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.setValueAtTime(2637, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch(e) {}
  }

  playEmergencyAlert() {
    if (!appState.audioEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.linearRampToValueAtTime(700, now + 0.3);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch(e) {}
  }
}

const audio = new TelemetryAudio();

// Log-Distance Path Loss Model Calculation
function calcDistanceKm(rssi) {
  const distM = Math.pow(10.0, (appState.txRefRSSI - rssi) / (10.0 * appState.pathLossN));
  return parseFloat((distM / 1000.0).toFixed(2));
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initMap();
  startClocks();
  seedInitialData();

  // Subtle telemetry jitter loop
  setInterval(ambientTelemetryJitter, 4000);
});

function initCharts() {
  rfChartInstance = new RFSignalChart('rf-chart-canvas');
  seismicScopeInstance = new SeismicOscilloscope('seismic-scope-canvas');
}

function initMap() {
  const el = document.getElementById('gis-map');
  if (!el) return;

  mapInstance = L.map('gis-map', {
    center: appState.geo.drone,
    zoom: 14,
    zoomControl: false,
    attributionControl: false
  });

  // Dark Map Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(mapInstance);

  const createMarker = (icon, colorClass, label) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="map-node-marker ${colorClass}">
          <div class="marker-core"><i class="${icon}"></i></div>
          <div class="marker-label">${label}</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  mapLayers.markerA = L.marker(appState.geo.baseA, {
    icon: createMarker('fa-solid fa-house-chimney-crack', 'marker-base-a', 'BASE A')
  }).addTo(mapInstance).bindPopup("<b>Base Station A (Alpha)</b><br>Disaster Epicenter Node (0xFA)");

  mapLayers.markerDrone = L.marker(appState.geo.drone, {
    icon: createMarker('fa-solid fa-helicopter', 'marker-drone', 'DRONE RELAY')
  }).addTo(mapInstance).bindPopup("<b>Drone Relay Unit (FRIDAY-1)</b><br>Airborne SX1262 Bridge (Alt: 120m)");

  mapLayers.markerC = L.marker(appState.geo.baseC, {
    icon: createMarker('fa-solid fa-building-shield', 'marker-base-c', 'BASE C')
  }).addTo(mapInstance).bindPopup("<b>Base Station C (Bravo)</b><br>Incident Command HQ (0xFF)");

  mapLayers.coverageCircle = L.circle(appState.geo.drone, {
    radius: 1950,
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.05,
    weight: 1.2,
    dashArray: '4, 6'
  }).addTo(mapInstance);

  mapLayers.linkA = L.polyline([appState.geo.baseA, appState.geo.drone], {
    color: '#38bdf8',
    weight: 2,
    dashArray: '5, 5'
  }).addTo(mapInstance);

  mapLayers.linkC = L.polyline([appState.geo.drone, appState.geo.baseC], {
    color: '#10b981',
    weight: 2,
    dashArray: '5, 5'
  }).addTo(mapInstance);
}

function startClocks() {
  setInterval(() => {
    const now = new Date();
    document.getElementById('utc-clock').textContent = now.toUTCString().split(' ')[4] + ' UTC';

    appState.uptimeSeconds++;
    const hrs = String(Math.floor(appState.uptimeSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((appState.uptimeSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(appState.uptimeSeconds % 60).padStart(2, '0');
    document.getElementById('kpi-uptime').textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

function seedInitialData() {
  addLogMessage('BASE_A', '#0 [North]: Initial Ground Station Online (Sync 0xFA)', 'ROUTINE', -68.4, 9.2);
  addLogMessage('DRONE', 'Relay Bridge Synchronized: 0xFA (Uplink) <-> 0xFF (Downlink)', 'ROUTINE');
  addLogMessage('BASE_C', '#0 [South]: Incident Command Listening on 0xFF', 'ROUTINE', -72.1, 8.8);
}

// ==========================================================================
// NAVIGATION & VIEW SWITCHER
// ==========================================================================
function switchView(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

  const activeTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  const activeView = document.getElementById(`view-${tabId}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');
  if (activeView) activeView.classList.add('active');

  if (tabId === 'overview' && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 150);
  }
}

function toggleAudio() {
  appState.audioEnabled = !appState.audioEnabled;
  const icon = document.getElementById('audio-icon');
  icon.className = appState.audioEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  if (appState.audioEnabled) audio.playTxPing();
}

function recenterMap() {
  if (mapInstance) {
    mapInstance.setView(appState.geo.drone, 14, { animate: true });
  }
}

function toggleMapCoverage() {
  if (!mapInstance || !mapLayers.coverageCircle) return;
  if (mapInstance.hasLayer(mapLayers.coverageCircle)) {
    mapInstance.removeLayer(mapLayers.coverageCircle);
  } else {
    mapLayers.coverageCircle.addTo(mapInstance);
  }
}

// ==========================================================================
// TRANSMISSION & TELEMETRY FLOW
// ==========================================================================

function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('composer-text');
  const dir = document.getElementById('composer-direction').value;
  const origin = document.getElementById('composer-origin').value;
  const msg = input.value.trim();

  if (!msg) return;
  input.value = '';

  transmitLoRa(msg, dir, origin, 'STANDARD');
}

function sendPreset(msg, dir = 'Unknown', priority = 'ROUTINE') {
  const origin = document.getElementById('composer-origin').value;
  transmitLoRa(msg, dir, origin, priority);
}

function transmitLoRa(msg, dir, origin, priority = 'ROUTINE') {
  appState.packetCounter++;
  document.getElementById('kpi-total-tx').innerHTML = `${appState.packetCounter} <span class="kpi-unit">PKTS</span>`;

  // Realistic RF variation
  const jitter = (Math.random() * 3.5 - 1.75);
  const rssi = parseFloat((-68.0 + jitter).toFixed(1));
  const snr = parseFloat((9.0 + (Math.random() * 1.5 - 0.75)).toFixed(1));
  const dist = calcDistanceKm(rssi);

  appState.lastRSSI = rssi;
  appState.lastSNR = snr;
  appState.lastDist = dist;

  updateKPIs(rssi, snr, dist);
  audio.playTxPing();

  if (origin === 'BASE_A') {
    animateTransmissionAtoC(msg, dir, priority, rssi, snr, dist);
  } else {
    animateTransmissionCtoA(msg, dir, priority, rssi, snr, dist);
  }
}

function animateTransmissionAtoC(msg, dir, priority, rssi, snr, dist) {
  addLogMessage('BASE_A', `[TX #${appState.packetCounter}] [${dir}]: ${msg}`, priority, rssi, snr);
  
  const bulletA = document.getElementById('bullet-a2drone');
  bulletA.className = 'packet-bullet anim-forward';

  setTimeout(() => {
    bulletA.className = 'packet-bullet';
    appState.relayAtoC++;
    document.getElementById('stat-a2c').textContent = appState.relayAtoC;
    document.getElementById('kpi-relayed-count').textContent = `${appState.relayAtoC + appState.relayCtoA} pkts`;

    const bulletC = document.getElementById('bullet-drone2c');
    bulletC.className = 'packet-bullet anim-forward';

    setTimeout(() => {
      bulletC.className = 'packet-bullet';
      audio.playRxChime();
      addLogMessage('BASE_C', `[RX via Drone] #${appState.packetCounter} [${dir}]: ${msg}`, priority, rssi, snr);
    }, 450);

  }, 350);
}

function animateTransmissionCtoA(msg, dir, priority, rssi, snr, dist) {
  addLogMessage('BASE_C', `[TX #${appState.packetCounter}] [${dir}]: ${msg}`, priority, rssi, snr);

  const bulletC = document.getElementById('bullet-c2drone');
  bulletC.className = 'packet-bullet anim-backward';

  setTimeout(() => {
    bulletC.className = 'packet-bullet';
    appState.relayCtoA++;
    document.getElementById('stat-c2a').textContent = appState.relayCtoA;
    document.getElementById('kpi-relayed-count').textContent = `${appState.relayAtoC + appState.relayCtoA} pkts`;

    const bulletA = document.getElementById('bullet-drone2a');
    bulletA.className = 'packet-bullet anim-backward';

    setTimeout(() => {
      bulletA.className = 'packet-bullet';
      audio.playRxChime();
      addLogMessage('BASE_A', `[RX via Drone] #${appState.packetCounter} [${dir}]: ${msg}`, priority, rssi, snr);
    }, 450);

  }, 350);
}

function updateKPIs(rssi, snr, dist) {
  document.getElementById('kpi-rssi').innerHTML = `${rssi} <span class="kpi-unit">dBm</span>`;
  document.getElementById('kpi-snr').textContent = `${snr > 0 ? '+' : ''}${snr} dB`;
  document.getElementById('kpi-dist').textContent = `~${dist} km`;

  document.getElementById('link-up-metrics').textContent = `${rssi} dBm | ~${dist} km`;

  if (rfChartInstance) {
    rfChartInstance.addDataPoint(rssi, snr);
  }
}

// ==========================================================================
// SEISMIC SENSOR & CAP DISASTER ALERTS
// ==========================================================================

function triggerSeismicSimulation() {
  seismicScopeInstance.triggerShock(1.6);
  audio.playEmergencyAlert();

  const alertBar = document.getElementById('critical-alert-bar');
  document.getElementById('alert-bar-title').textContent = 'SEISMIC EVENT DETECTED (GPIO 32)';
  document.getElementById('alert-bar-msg').textContent = 'Vibration threshold exceeded at Base A. Auto SOS packet transmitted via airborne relay.';
  alertBar.classList.add('show');

  document.getElementById('kpi-seismic-status').innerHTML = '<span class="badge badge-red" style="font-size:16px;">TRIGGERED</span>';
  document.getElementById('kpi-accel').textContent = '2.45 g';
  document.getElementById('node-a-seismic').innerHTML = 'Vib: <b class="text-danger">SHOCK</b>';
  document.getElementById('seismic-badge-indicator').innerHTML = '<span class="badge badge-red">SHOCK DETECTED</span>';

  transmitLoRa('AUTO-ALERT: Seismic Activity Detected - Auto SOS Triggered', 'Unknown', 'BASE_A', 'CRITICAL');
}

function acknowledgeAlert() {
  document.getElementById('critical-alert-bar').classList.remove('show');
  document.getElementById('kpi-seismic-status').textContent = 'NORMAL';
  document.getElementById('kpi-accel').textContent = '0.04 g';
  document.getElementById('node-a-seismic').innerHTML = 'Vib: <b>Safe</b>';
  document.getElementById('seismic-badge-indicator').innerHTML = '<span class="badge badge-success">ARMED &amp; SAFE</span>';
}

function broadcastCapEvent(type, detail) {
  audio.playEmergencyAlert();

  const alertPayload = `AUTO-ALERT: ${type} Detected via National CAP System [Severity: Severe] - ${detail}`;
  addLogMessage('CAP-ALERT', alertPayload, 'CRITICAL');
  
  // Also add to CAP history table
  appState.capAlerts.push({
    time: new Date().toLocaleTimeString(),
    type,
    detail
  });
  renderCapHistory();

  transmitLoRa(alertPayload, 'Unknown', 'BASE_A', 'CRITICAL');
}

function handleCustomCapAlert(e) {
  e.preventDefault();
  const headline = document.getElementById('cap-headline').value;
  const urgency = document.getElementById('cap-urgency').value;
  const severity = document.getElementById('cap-severity').value;
  const instructions = document.getElementById('cap-instructions').value;

  const capMsg = `CAP-ALERT: [${severity.toUpperCase()}] ${headline} (${urgency}) - ${instructions}`;
  broadcastCapEvent(headline, capMsg);

  document.getElementById('cap-headline').value = '';
  document.getElementById('cap-instructions').value = '';
}

function renderCapHistory() {
  const container = document.getElementById('cap-history-list');
  if (!container) return;
  if (appState.capAlerts.length === 0) {
    container.innerHTML = '<div class="empty-state">No national CAP alerts recorded in this session.</div>';
    return;
  }
  container.innerHTML = appState.capAlerts.map(a => `
    <div style="background:var(--bg-app); border:1px solid var(--border-color); padding:10px; border-radius:6px; margin-bottom:8px; font-family:var(--font-mono); font-size:11px;">
      <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:10px; margin-bottom:4px;">
        <span style="color:#f87171; font-weight:bold;">[${a.type}]</span>
        <span>${a.time}</span>
      </div>
      <div>${a.detail}</div>
    </div>
  `).reverse().join('');
}

// ==========================================================================
// LOG MANAGEMENT
// ==========================================================================

function addLogMessage(node, message, priority = 'ROUTINE', rssi = null, snr = null) {
  const time = new Date().toTimeString().split(' ')[0];
  const item = { time, node, message, priority, rssi, snr };
  appState.logs.push(item);

  const feed = document.getElementById('terminal-log-feed');
  const audit = document.getElementById('audit-log-feed');
  if (!feed) return;

  const isCritical = priority === 'CRITICAL' || message.includes('SOS') || message.includes('ALERT');
  const isRx = message.startsWith('[RX');
  const isTx = message.startsWith('[TX');

  let typeClass = '';
  if (isCritical) typeClass = 'critical';
  else if (isRx) typeClass = 'rx';
  else if (isTx) typeClass = 'tx';

  let badgeColor = 'node-drone';
  if (node === 'BASE_A') badgeColor = 'node-a';
  else if (node === 'BASE_C') badgeColor = 'node-c';
  else if (node === 'CAP-ALERT') badgeColor = 'alert';

  const div = document.createElement('div');
  div.className = `terminal-msg-item ${typeClass}`;
  div.innerHTML = `
    <div class="msg-header-row">
      <span class="node-badge ${badgeColor}">[${node}]</span>
      <span>${time}</span>
    </div>
    <div class="msg-text-row">${message}</div>
    ${rssi ? `<div class="msg-telemetry-row"><span>RSSI: ${rssi} dBm</span><span>SNR: ${snr} dB</span></div>` : ''}
  `;

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;

  if (audit) {
    const auditDiv = div.cloneNode(true);
    audit.appendChild(auditDiv);
    audit.scrollTop = audit.scrollHeight;
  }
}

function clearLogs() {
  appState.logs = [];
  document.getElementById('terminal-log-feed').innerHTML = '';
  const audit = document.getElementById('audit-log-feed');
  if (audit) audit.innerHTML = '';
}

function exportLogs() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.logs, null, 2));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `friday_tactical_telemetry_${Date.now()}.json`);
  a.click();
}

// Ambient RF jitter for realism
function ambientTelemetryJitter() {
  if (appState.mode !== 'simulation') return;
  const jitter = (Math.random() * 1.0 - 0.5);
  const curRSSI = parseFloat((appState.lastRSSI + jitter).toFixed(1));
  const curSNR = parseFloat((appState.lastSNR + (Math.random() * 0.3 - 0.15)).toFixed(1));

  if (rfChartInstance) {
    rfChartInstance.addDataPoint(curRSSI, curSNR);
  }
}

// Modal controls
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function toggleHardwareFields() {
  const mode = document.getElementById('setting-mode').value;
  document.getElementById('hardware-ip-fields').style.display = (mode === 'esp32_live') ? 'block' : 'none';
}

function saveSettings() {
  appState.mode = document.getElementById('setting-mode').value;
  appState.endpoints.baseA = document.getElementById('ip-base-a').value;
  appState.endpoints.drone = document.getElementById('ip-drone').value;
  appState.endpoints.baseC = document.getElementById('ip-base-c').value;
  appState.endpoints.pollRate = parseInt(document.getElementById('poll-rate').value) || 1200;

  const label = document.getElementById('connection-mode-label');
  if (appState.mode === 'esp32_live') {
    label.textContent = 'ESP32 LIVE BRIDGE';
    addLogMessage('SYSTEM', `Hardware Bridge Active (${appState.endpoints.drone})`, 'ROUTINE');
  } else {
    label.textContent = 'SIMULATION MODE';
    addLogMessage('SYSTEM', 'Simulation Sandbox Active', 'ROUTINE');
  }
  closeModal('settings-modal');
}

// Export functions to global window for HTML inline handlers
window.switchView = switchView;
window.toggleAudio = toggleAudio;
window.recenterMap = recenterMap;
window.toggleMapCoverage = toggleMapCoverage;
window.handleSendMessage = handleSendMessage;
window.sendPreset = sendPreset;
window.triggerSeismicSimulation = triggerSeismicSimulation;
window.acknowledgeAlert = acknowledgeAlert;
window.broadcastCapEvent = broadcastCapEvent;
window.handleCustomCapAlert = handleCustomCapAlert;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleHardwareFields = toggleHardwareFields;
window.saveSettings = saveSettings;
