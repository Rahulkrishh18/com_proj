import { useApp } from '../context/AppContext';
import { NetworkTopology } from '../components/network/NetworkTopology';
import type { NodeId } from '../types';
import { NODES } from '../lib/demoData';

export function TopologyPage() {
  const { state, dispatch } = useApp();
  const { dashboard, selectedNodeId } = state;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#303030] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F5F5]">
            Network Topology
          </h1>
          <p className="text-xs text-[#858585] mt-1">
            Bidirectional LoRa RF mesh architecture (Base A ⇄ Drone ⇄ Base C)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#800000]/20 text-[#FF8080] border border-[#800000]/60 rounded">
            868.0 MHz (SX1262)
          </span>
        </div>
      </div>

      {/* Main Full-Width Topology Canvas */}
      <div className="card p-5">
        <div className="card-header border-b border-[#303030] pb-3 mb-4">
          <span className="text-sm font-semibold text-[#F5F5F5]">Mesh RF Propagation Diagram</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#858585]">
              A→C: {dashboard.relayStats.totalRelayedAtoC} pkts | C→A: {dashboard.relayStats.totalRelayedCtoA} pkts
            </span>
            {selectedNodeId && (
              <button className="btn btn-secondary text-xs py-1 px-2.5" onClick={() => dispatch({ type: 'SELECT_NODE', nodeId: null })}>
                Clear Selection
              </button>
            )}
          </div>
        </div>
        <div className="py-2">
          <NetworkTopology />
        </div>
      </div>

      {/* Node Details Section */}
      <div>
        <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider mb-3">
          Node Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['BASE_A', 'DRONE_RELAY', 'BASE_C'] as NodeId[]).map(nodeId => {
            const node = NODES[nodeId];
            const isSelected = selectedNodeId === nodeId;
            return (
              <div
                key={nodeId}
                className={`card p-4 flex flex-col justify-between transition-all ${
                  isSelected ? 'border-[#C00000] ring-1 ring-[#C00000]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#303030] pb-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#F5F5F5]">{node.name}</h3>
                      <div className="text-[11px] text-[#858585]">{node.role}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0E2A18] text-[#4ADE80] border border-[#166534]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Online
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono mb-4">
                    <div className="flex justify-between py-1 border-b border-[#202020]">
                      <span className="text-[#858585]">Frequency</span>
                      <span className="text-[#F5F5F5] font-semibold">{node.frequencyMhz} MHz</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#202020]">
                      <span className="text-[#858585]">
                        {nodeId === 'DRONE_RELAY' ? 'Uplink Sync' : 'Sync Word'}
                      </span>
                      <span className="text-[#FF8080] font-bold">
                        {nodeId === 'DRONE_RELAY' ? '0xFA' : node.syncWord || '0xFA'}
                      </span>
                    </div>
                    {nodeId === 'DRONE_RELAY' && (
                      <div className="flex justify-between py-1 border-b border-[#202020]">
                        <span className="text-[#858585]">Downlink Sync</span>
                        <span className="text-[#FF8080] font-bold">0xFF</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-[#202020]">
                      <span className="text-[#858585]">TX Power</span>
                      <span className="text-[#F5F5F5]">+{node.txPowerDbm} dBm</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#202020]">
                      <span className="text-[#858585]">Last Seen</span>
                      <span className="text-[#4ADE80]">1s ago</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#858585]">Role</span>
                      <span className="text-[#B8B8B8] truncate max-w-[140px]">{node.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SELECT_NODE', nodeId: isSelected ? null : nodeId })}
                  className="btn btn-secondary w-full text-xs py-2 border-[#C00000]/60 hover:bg-[#800000]/30 hover:border-[#C00000]"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
