import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import type { NodeId, EventCategory } from '../types';
import {
  RadioTower,
  Send,
  AlertTriangle,
  HeartPulse,
  Activity,
  RefreshCw,
  Zap,
  Layers,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';

export function GroundStationsPage() {
  const { state, transmit, toast } = useApp();
  const { stations } = state.dashboard;

  // Station A message state
  const [msgA, setMsgA] = useState('');
  const [dirA, setDirA] = useState('DIR_C');
  const [isSendingA, setIsSendingA] = useState(false);

  // Station C message state
  const [msgC, setMsgC] = useState('');
  const [dirC, setDirC] = useState('DIR_A');
  const [isSendingC, setIsSendingC] = useState(false);

  // Modal confirm states
  const [emergencyModal, setEmergencyModal] = useState<{
    open: boolean;
    type: EventCategory;
    nodeId: NodeId;
    title: string;
    description: string;
  }>({
    open: false,
    type: 'sos',
    nodeId: 'BASE_A',
    title: '',
    description: '',
  });

  const handleSendA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgA.trim()) return;
    setIsSendingA(true);
    transmit('BASE_A', 'BASE_C', 'message', msgA.trim(), dirA);
    setTimeout(() => {
      setIsSendingA(false);
      setMsgA('');
    }, 400);
  };

  const handleSendC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgC.trim()) return;
    setIsSendingC(true);
    transmit('BASE_C', 'BASE_A', 'message', msgC.trim(), dirC);
    setTimeout(() => {
      setIsSendingC(false);
      setMsgC('');
    }, 400);
  };

  const openEmergencyModal = (type: EventCategory, nodeId: NodeId, title: string, description: string) => {
    setEmergencyModal({
      open: true,
      type,
      nodeId,
      title,
      description,
    });
  };

  const confirmEmergencyAction = () => {
    const dest = emergencyModal.nodeId === 'BASE_A' ? 'BASE_C' : 'BASE_A';
    transmit(emergencyModal.nodeId, dest, emergencyModal.type, emergencyModal.title, emergencyModal.nodeId === 'BASE_A' ? 'DIR_C' : 'DIR_A');
    toast(`Confirmed & Dispatched: ${emergencyModal.title}`, emergencyModal.type === 'sos' ? 'critical' : 'warning');
    setEmergencyModal(prev => ({ ...prev, open: false }));
  };

  const handleSimulateVibration = () => {
    transmit('BASE_A', 'BASE_C', 'seismic_trigger', 'EARTHQUAKE DETECTED (Vibration Sensor SW-420 Triggered)', 'DIR_C');
    toast('Seismic SW-420 Sensor pulse triggered on Base Station A', 'critical');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <RadioTower className="w-6 h-6 text-[#C00000]" />
            Ground Station Control &amp; Command
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Direct operational interfaces for Base Station A (Transmitter/Origin) and Base Station C (Receiver/Command).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#161618] border border-[rgba(255,255,255,0.12)] text-[#D0D0D0]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Dual Transceivers Synced
          </span>
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BASE STATION A PANEL */}
        <div className="bg-[#0D0D0E] rounded-lg border border-[rgba(255,255,255,0.08)] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#121214] text-white p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#800000] flex items-center justify-center text-white font-mono font-bold text-sm">
                A
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                  BASE STATION A
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    ONLINE
                  </span>
                </h3>
                <p className="text-xs text-[#808080] font-mono">ESP32 + SX1262 LoRa | AP: BASE_A (192.168.4.1)</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-[#A0A0A0]">
              <div>Sync: <span className="text-[#FF4D4D] font-bold">0xFA</span></div>
              <div>Freq: 433.0 MHz</div>
            </div>
          </div>

          <div className="grid grid-cols-3 bg-[#161618] border-b border-[rgba(255,255,255,0.06)] p-3 text-center divide-x divide-[rgba(255,255,255,0.06)]">
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">TX Power</span>
              <span className="font-mono font-bold text-sm text-white">22 dBm</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">Last RSSI</span>
              <span className="font-mono font-bold text-sm text-white">
                {stations.BASE_A.telemetry?.rssiDbm ? `${stations.BASE_A.telemetry.rssiDbm} dBm` : '-78 dBm'}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">Est. Range</span>
              <span className="font-mono font-bold text-sm text-white">
                {stations.BASE_A.telemetry?.estimatedDistanceKm ? `${stations.BASE_A.telemetry.estimatedDistanceKm.toFixed(2)} km` : '1.42 km'}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-6 flex-1">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C00000]" />
                Recent Node Traffic
              </h4>
              <div className="bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md p-3 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#808080]">Last Transmitted:</span>
                  <span className="font-medium text-white truncate max-w-[240px]">
                    {stations.BASE_A.lastTransmitted?.message || 'Ready for transmission'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#808080]">Last Received:</span>
                  <span className="font-medium text-white truncate max-w-[240px]">
                    {stations.BASE_A.lastReceived?.message || 'ACK: Drone Relay Synced'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C00000]" />
                Emergency Preset Triggers (Base A)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openEmergencyModal('sos', 'BASE_A', 'CRITICAL SOS ALERT: Station A In Distress', 'Emergency SOS signal will be broad-relayed via Drone to Base C with high priority.')}
                  className="px-3 py-2 bg-[#800000] hover:bg-[#C00000] text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Dispatch SOS
                </button>
                <button
                  type="button"
                  onClick={() => openEmergencyModal('medical', 'BASE_A', 'MEDICAL EMERGENCY: Request Evacuation & First Aid', 'Immediate paramedic triage and aerial supply drop requested.')}
                  className="px-3 py-2 bg-[#1C1C20] hover:bg-[#28282E] border border-[rgba(255,255,255,0.12)] text-[#FF8080] rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-[#FF4D4D]" />
                  Medical Alert
                </button>
                <button
                  type="button"
                  onClick={() => openEmergencyModal('all_clear', 'BASE_A', 'ALL CLEAR: Sector Safe & Operations Normal', 'Cancels active emergency protocols on Base A.')}
                  className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  All Clear
                </button>
                <button
                  type="button"
                  onClick={handleSimulateVibration}
                  className="px-3 py-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Trigger Vibration SW-420
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#C00000]" />
                Direct Packet Composer (A → C)
              </h4>
              <form onSubmit={handleSendA} className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={dirA}
                    onChange={(e) => setDirA(e.target.value)}
                    aria-label="Direction Selector"
                    className="bg-[#161618] border border-[rgba(255,255,255,0.12)] rounded-md px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C00000]"
                  >
                    <option value="DIR_C">Target: DIR_C</option>
                    <option value="DIR_BROADCAST">Broadcast</option>
                  </select>
                  <input
                    type="text"
                    value={msgA}
                    onChange={(e) => setMsgA(e.target.value)}
                    placeholder="Enter payload message (max 120 chars)..."
                    maxLength={120}
                    className="flex-1 bg-[#161618] border border-[rgba(255,255,255,0.12)] rounded-md px-3 py-1.5 text-xs text-white placeholder:text-[#606060] focus:outline-none focus:border-[#C00000]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingA || !msgA.trim()}
                    className="px-4 py-1.5 bg-[#800000] hover:bg-[#C00000] disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSendingA ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#808080]">
              <div className="font-semibold text-[#D0D0D0] mb-1">Hardware Map (ESP32):</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
                <div>NSS: <span className="text-white">GPIO 5</span></div>
                <div>DIO1: <span className="text-white">GPIO 35</span></div>
                <div>NRST: <span className="text-white">GPIO 4</span></div>
                <div>BUSY: <span className="text-white">GPIO 34</span></div>
                <div>SW-420 Sensor: <span className="text-white">GPIO 32</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* BASE STATION C PANEL */}
        <div className="bg-[#0D0D0E] rounded-lg border border-[rgba(255,255,255,0.08)] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#121214] text-white p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#800000] flex items-center justify-center text-white font-mono font-bold text-sm">
                C
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                  BASE STATION C
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    ONLINE
                  </span>
                </h3>
                <p className="text-xs text-[#808080] font-mono">ESP32 + SX1262 LoRa | AP: BASE_C (192.168.4.1)</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-[#A0A0A0]">
              <div>Sync: <span className="text-[#FF4D4D] font-bold">0xFF</span></div>
              <div>Freq: 433.0 MHz</div>
            </div>
          </div>

          <div className="grid grid-cols-3 bg-[#161618] border-b border-[rgba(255,255,255,0.06)] p-3 text-center divide-x divide-[rgba(255,255,255,0.06)]">
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">TX Power</span>
              <span className="font-mono font-bold text-sm text-white">22 dBm</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">Last RSSI</span>
              <span className="font-mono font-bold text-sm text-white">
                {stations.BASE_C.telemetry?.rssiDbm ? `${stations.BASE_C.telemetry.rssiDbm} dBm` : '-84 dBm'}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#808080] block">Est. Range</span>
              <span className="font-mono font-bold text-sm text-white">
                {stations.BASE_C.telemetry?.estimatedDistanceKm ? `${stations.BASE_C.telemetry.estimatedDistanceKm.toFixed(2)} km` : '1.85 km'}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-6 flex-1">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C00000]" />
                Recent Node Traffic
              </h4>
              <div className="bg-[#161618] border border-[rgba(255,255,255,0.06)] rounded-md p-3 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#808080]">Last Received:</span>
                  <span className="font-medium text-white truncate max-w-[240px]">
                    {stations.BASE_C.lastReceived?.message || 'Awaiting incoming packet...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#808080]">Last Transmitted:</span>
                  <span className="font-medium text-white truncate max-w-[240px]">
                    {stations.BASE_C.lastTransmitted?.message || 'ACK: Sector Normal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#C00000]" />
                Command Responses &amp; CAP Injections (Base C)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    transmit('BASE_C', 'BASE_A', 'ack', 'ACK: Emergency Packet Acknowledged by Command', 'DIR_A');
                    toast('Acknowledgment sent from Base C to Base A', 'info');
                  }}
                  className="px-3 py-2 bg-[#1C1C20] hover:bg-[#28282E] border border-[rgba(255,255,255,0.12)] text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#FF4D4D]" />
                  Send ACK to A
                </button>
                <button
                  type="button"
                  onClick={() => openEmergencyModal('cap_earthquake', 'BASE_C', 'CAP ALERT: Severe Earthquake Warning (M 6.4)', 'Common Alerting Protocol broadcast from Base Station C.')}
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-red-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  CAP Earthquake
                </button>
                <button
                  type="button"
                  onClick={() => openEmergencyModal('cap_flood', 'BASE_C', 'CAP ALERT: Flash Flood Advisory (Level 3)', 'Evacuation routes highlighted.')}
                  className="px-3 py-2 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-700/60 text-sky-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  CAP Flood
                </button>
                <button
                  type="button"
                  onClick={() => openEmergencyModal('cap_landslide', 'BASE_C', 'CAP ALERT: Landslide Hazard Detected in Sector 4', 'Terrain instability detected.')}
                  className="px-3 py-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  CAP Landslide
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#C00000]" />
                Direct Packet Composer (C → A)
              </h4>
              <form onSubmit={handleSendC} className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={dirC}
                    onChange={(e) => setDirC(e.target.value)}
                    aria-label="Direction Selector"
                    className="bg-[#161618] border border-[rgba(255,255,255,0.12)] rounded-md px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C00000]"
                  >
                    <option value="DIR_A">Target: DIR_A</option>
                    <option value="DIR_BROADCAST">Broadcast</option>
                  </select>
                  <input
                    type="text"
                    value={msgC}
                    onChange={(e) => setMsgC(e.target.value)}
                    placeholder="Enter command response (max 120 chars)..."
                    maxLength={120}
                    className="flex-1 bg-[#161618] border border-[rgba(255,255,255,0.12)] rounded-md px-3 py-1.5 text-xs text-white placeholder:text-[#606060] focus:outline-none focus:border-[#C00000]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingC || !msgC.trim()}
                    className="px-4 py-1.5 bg-[#800000] hover:bg-[#C00000] disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSendingC ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#808080]">
              <div className="font-semibold text-[#D0D0D0] mb-1">Hardware Map (ESP32):</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
                <div>NSS: <span className="text-white">GPIO 5</span></div>
                <div>DIO1: <span className="text-white">GPIO 35</span></div>
                <div>NRST: <span className="text-white">GPIO 4</span></div>
                <div>BUSY: <span className="text-white">GPIO 34</span></div>
                <div>Web Server: <span className="text-white">Port 80 (HTTP)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={emergencyModal.open}
        onClose={() => setEmergencyModal(prev => ({ ...prev, open: false }))}
        title={`Confirm Dispatch: ${emergencyModal.title}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-950/80 border border-red-800 rounded text-xs text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#FF4D4D] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-white">Emergency Radio Transmission Confirmation</p>
              <p className="mt-1">{emergencyModal.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#161618] p-3 rounded border border-[rgba(255,255,255,0.12)]">
            <div>Origin: <span className="font-bold text-white">{emergencyModal.nodeId}</span></div>
            <div>Frequency: <span className="font-bold text-white">433.0 MHz</span></div>
            <div>Sync Word: <span className="font-bold text-[#FF4D4D]">{emergencyModal.nodeId === 'BASE_A' ? '0xFA' : '0xFF'}</span></div>
            <div>Relay Path: <span className="font-bold text-white">via DRONE_RELAY</span></div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
            <button
              type="button"
              onClick={() => setEmergencyModal(prev => ({ ...prev, open: false }))}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-[rgba(255,255,255,0.12)] hover:bg-[#1E1E22] text-[#D0D0D0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmEmergencyAction}
              className="px-4 py-1.5 rounded-md text-xs font-bold bg-[#800000] hover:bg-[#C00000] text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Confirm &amp; Transmit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
