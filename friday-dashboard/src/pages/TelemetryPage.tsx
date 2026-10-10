import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SignalChart } from '../components/telemetry/SignalChart';
import { Activity, Radio, Wifi, Zap, Gauge } from 'lucide-react';

export function TelemetryPage() {
  const { state } = useApp();
  const { telemetryHistory, stations } = state.dashboard;

  const [uplinkMetric, setUplinkMetric] = useState<'RSSI' | 'SNR'>('RSSI');
  const [downlinkMetric, setDownlinkMetric] = useState<'RSSI' | 'SNR'>('RSSI');

  const uplinkRSSI = stations.BASE_A.telemetry?.rssiDbm ?? -72.4;
  const uplinkSNR = stations.BASE_A.telemetry?.snrDb ?? 11.2;
  const downlinkRSSI = stations.BASE_C.telemetry?.rssiDbm ?? -76.8;
  const downlinkSNR = stations.BASE_C.telemetry?.snrDb ?? 8.8;
  const estRange = stations.BASE_A.telemetry?.estimatedDistanceKm ?? 0.04;

  return (
    <div className="space-y-6">
      {/* 5 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="card p-3.5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider">Uplink RSSI</span>
            <Wifi className="w-3.5 h-3.5 text-[#C00000]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#F5F5F5]">{uplinkRSSI}</span>
            <span className="text-xs font-mono text-[#858585]">dBm</span>
          </div>
        </div>

        <div className="card p-3.5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider">Uplink SNR</span>
            <Gauge className="w-3.5 h-3.5 text-[#C00000]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#F5F5F5]">+{uplinkSNR}</span>
            <span className="text-xs font-mono text-[#858585]">dB</span>
          </div>
        </div>

        <div className="card p-3.5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider">Downlink RSSI</span>
            <Wifi className="w-3.5 h-3.5 text-[#C00000]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#F5F5F5]">{downlinkRSSI}</span>
            <span className="text-xs font-mono text-[#858585]">dBm</span>
          </div>
        </div>

        <div className="card p-3.5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider">Downlink SNR</span>
            <Gauge className="w-3.5 h-3.5 text-[#C00000]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#F5F5F5]">+{downlinkSNR}</span>
            <span className="text-xs font-mono text-[#858585]">dB</span>
          </div>
        </div>

        <div className="card p-3.5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider">Est. Range</span>
            <Radio className="w-3.5 h-3.5 text-[#C00000]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#F5F5F5]">{estRange.toFixed(2)}</span>
            <span className="text-xs font-mono text-[#858585]">km</span>
          </div>
        </div>
      </div>

      {/* Middle Charts Row: Uplink Signal vs Downlink Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uplink Chart */}
        <div className="card p-4">
          <div className="card-header border-b border-[#303030] pb-3 mb-4">
            <h3 className="font-semibold text-sm text-[#F5F5F5] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C00000]" />
              Uplink Signal (Base A → Drone)
            </h3>
            <div className="flex items-center gap-1 bg-[#101010] p-0.5 rounded border border-[#303030]">
              <button
                type="button"
                onClick={() => setUplinkMetric('RSSI')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  uplinkMetric === 'RSSI' ? 'bg-[#800000] text-white' : 'text-[#858585]'
                }`}
              >
                RSSI
              </button>
              <button
                type="button"
                onClick={() => setUplinkMetric('SNR')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  uplinkMetric === 'SNR' ? 'bg-[#800000] text-white' : 'text-[#858585]'
                }`}
              >
                SNR
              </button>
            </div>
          </div>
          <SignalChart data={telemetryHistory} height={200} />
        </div>

        {/* Downlink Chart */}
        <div className="card p-4">
          <div className="card-header border-b border-[#303030] pb-3 mb-4">
            <h3 className="font-semibold text-sm text-[#F5F5F5] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C00000]" />
              Downlink Signal (Drone → Base C)
            </h3>
            <div className="flex items-center gap-1 bg-[#101010] p-0.5 rounded border border-[#303030]">
              <button
                type="button"
                onClick={() => setDownlinkMetric('RSSI')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  downlinkMetric === 'RSSI' ? 'bg-[#800000] text-white' : 'text-[#858585]'
                }`}
              >
                RSSI
              </button>
              <button
                type="button"
                onClick={() => setDownlinkMetric('SNR')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  downlinkMetric === 'SNR' ? 'bg-[#800000] text-white' : 'text-[#858585]'
                }`}
              >
                SNR
              </button>
            </div>
          </div>
          <SignalChart data={telemetryHistory} height={200} />
        </div>
      </div>

      {/* Bottom Section: Radio Diagnostics */}
      <div className="card p-5">
        <div className="card-header border-b border-[#303030] pb-3 mb-4">
          <h3 className="font-semibold text-sm text-[#F5F5F5] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#C00000]" />
            Radio Diagnostics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Uplink Radio */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#FF8080] uppercase tracking-wider">
              Uplink Radio (0xFA)
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">GPIO NSS</span>
                <span className="text-[#F5F5F5]">5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">GPIO RESET</span>
                <span className="text-[#F5F5F5]">4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">Status</span>
                <span className="text-[#4ADE80] font-bold">Listening</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">GPIO DIO1</span>
                <span className="text-[#F5F5F5]">35</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">DIO1 Pin</span>
                <span className="text-[#F5F5F5]">14</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#858585]">Last Packet</span>
                <span className="text-[#B8B8B8]">14:01:36</span>
              </div>
            </div>
          </div>

          {/* Downlink Radio */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#FF8080] uppercase tracking-wider">
              Downlink Radio (0xFF)
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">GPIO NSS</span>
                <span className="text-[#F5F5F5]">27</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">GPIO RESET</span>
                <span className="text-[#F5F5F5]">26</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">Status</span>
                <span className="text-[#4ADE80] font-bold">Listening</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">DIO1 Pin</span>
                <span className="text-[#F5F5F5]">37</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-[#858585]">BUSY Pin</span>
                <span className="text-[#F5F5F5]">32</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#858585]">Last Packet</span>
                <span className="text-[#B8B8B8]">14:01:33</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
