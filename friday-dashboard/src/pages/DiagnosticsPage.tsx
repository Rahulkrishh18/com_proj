import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, Radio, Zap, Save, RefreshCw } from 'lucide-react';

export function DiagnosticsPage() {
  const { toast } = useApp();

  const [frequency, setFrequency] = useState('868.000 MHz');
  const [bandwidth, setBandwidth] = useState('125.0 kHz');
  const [sf, setSf] = useState('SF7');
  const [cr, setCr] = useState('4/5');
  const [power, setPower] = useState('+22 dBm');
  const [syncWord, setSyncWord] = useState('0xFA');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast('LoRa radio configuration saved to EEPROM', 'success');
  }

  function handleReset() {
    setFrequency('868.000 MHz');
    setBandwidth('125.0 kHz');
    setSf('SF7');
    setCr('4/5');
    setPower('+22 dBm');
    setSyncWord('0xFA');
    toast('Radio settings reset to factory defaults', 'info');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#303030] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#C00000]" />
            Radio &amp; System Diagnostics
          </h1>
          <p className="text-xs text-[#858585] mt-0.5">
            Hardware status, SPI transceiver registers, and LoRa radio configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#800000]/20 text-[#FF8080] border border-[#800000]/60 rounded">
            DEMO MODE
          </span>
        </div>
      </div>

      {/* Main Grid: Left Diagnostics, Right Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Radio Diagnostics + System Diagnostics */}
        <div className="lg:col-span-6 space-y-6">
          {/* Radio Diagnostics */}
          <div className="card p-5 space-y-4">
            <div className="card-header border-b border-[#303030] pb-3">
              <h2 className="card-title text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#C00000]" />
                Radio Diagnostics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Uplink Radio */}
              <div className="p-3 bg-[#181818] rounded border border-[#303030] space-y-2">
                <div className="text-[11px] font-bold text-[#FF8080]">Uplink Radio (0xFA)</div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">GPIO NSS</span><span className="text-[#F5F5F5]">5</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">GPIO RESET</span><span className="text-[#F5F5F5]">26</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">Status</span><span className="text-[#4ADE80]">Listening</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">DIO1 Pin</span><span className="text-[#F5F5F5]">14</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">Last Packet</span><span className="text-[#B8B8B8]">14:01:36</span></div>
              </div>

              {/* Downlink Radio */}
              <div className="p-3 bg-[#181818] rounded border border-[#303030] space-y-2">
                <div className="text-[11px] font-bold text-[#FF8080]">Downlink Radio (0xFF)</div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">GPIO NSS</span><span className="text-[#F5F5F5]">27</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">GPIO RESET</span><span className="text-[#F5F5F5]">26</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">Status</span><span className="text-[#4ADE80]">Listening</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">DIO1 Pin</span><span className="text-[#F5F5F5]">37</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">BUSY Pin</span><span className="text-[#F5F5F5]">32</span></div>
                <div className="flex justify-between py-0.5"><span className="text-[#858585]">Last Packet</span><span className="text-[#B8B8B8]">14:01:33</span></div>
              </div>
            </div>
          </div>

          {/* System Diagnostics */}
          <div className="card p-5 space-y-4">
            <div className="card-header border-b border-[#303030] pb-3">
              <h2 className="card-title text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C00000]" />
                System Diagnostics
              </h2>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#181818] rounded border border-[#303030] space-y-1.5">
                <div className="text-[11px] font-bold text-[#F5F5F5] font-sans">SX1262 System</div>
                <div className="flex justify-between"><span className="text-[#858585]">Board</span><span className="text-[#B8B8B8]">ESP32-WROOM</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">Web Server</span><span className="text-[#B8B8B8]">Port 80 (HTTP)</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">API Entity</span><span className="text-[#B8B8B8]">BASE_A</span></div>
              </div>

              <div className="p-3 bg-[#181818] rounded border border-[#303030] space-y-1.5">
                <div className="text-[11px] font-bold text-[#F5F5F5] font-sans">US3242 Radio</div>
                <div className="flex justify-between"><span className="text-[#858585]">Frequency</span><span className="text-[#B8B8B8]">868.0 MHz</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">Bandwidth</span><span className="text-[#B8B8B8]">125.0 kHz</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">Spreading Factor</span><span className="text-[#B8B8B8]">SF7</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">Coding Rate</span><span className="text-[#B8B8B8]">4/5</span></div>
                <div className="flex justify-between"><span className="text-[#858585]">Sync Word</span><span className="text-[#FF8080]">0xFA</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: LoRa Radio Configuration Form */}
        <div className="lg:col-span-6 card p-5 space-y-4">
          <div className="card-header border-b border-[#303030] pb-3 mb-2">
            <h2 className="card-title text-sm font-semibold text-[#F5F5F5]">LoRa Radio Configuration</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Carrier Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Uplink Sync</label>
                <input
                  type="text"
                  value={syncWord}
                  onChange={e => setSyncWord(e.target.value)}
                  className="input text-xs w-full font-bold text-[#FF8080]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Signal Bandwidth</label>
                <input
                  type="text"
                  value={bandwidth}
                  onChange={e => setBandwidth(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Transmit Power</label>
                <input
                  type="text"
                  value={power}
                  onChange={e => setPower(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Spreading Factor</label>
                <input
                  type="text"
                  value={sf}
                  onChange={e => setSf(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Downlink Sync</label>
                <input
                  type="text"
                  value="0xFF"
                  disabled
                  className="input text-xs w-full opacity-70"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B8B8B8] mb-1">Coding Rate</label>
              <input
                type="text"
                value={cr}
                onChange={e => setCr(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#303030]">
              <button type="submit" className="btn btn-primary text-xs py-2.5 flex-1 font-bold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button type="button" onClick={handleReset} className="btn btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
