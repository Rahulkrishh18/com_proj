import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { NodeId, PacketAnimation } from '../../types';
import { NODES } from '../../lib/demoData';
import { RadioTower, Cpu, Radio, Activity } from 'lucide-react';

// Spaced-out geometry giving 166px+ gap between cards
const LAYOUT = {
  BASE_A:      { cx: 150, cy: 130, width: 160, height: 96 },
  DRONE_RELAY: { cx: 480, cy: 130, width: 168, height: 96 },
  BASE_C:      { cx: 810, cy: 130, width: 160, height: 96 },
};

// RF Path calculation between node card boundaries
function getRFPath(from: NodeId, to: NodeId): string {
  // A -> Relay (Uplink)
  if (from === 'BASE_A' && to === 'DRONE_RELAY') {
    return 'M 230 108 Q 315 88 396 108';
  }
  // Relay -> A (Downlink)
  if (from === 'DRONE_RELAY' && to === 'BASE_A') {
    return 'M 396 152 Q 315 172 230 152';
  }
  // Relay -> C (Uplink)
  if (from === 'DRONE_RELAY' && to === 'BASE_C') {
    return 'M 564 108 Q 647 88 730 108';
  }
  // C -> Relay (Downlink)
  if (from === 'BASE_C' && to === 'DRONE_RELAY') {
    return 'M 730 152 Q 647 172 564 152';
  }
  // Default fallback
  const f = LAYOUT[from] || LAYOUT.BASE_A;
  const t = LAYOUT[to] || LAYOUT.DRONE_RELAY;
  return `M ${f.cx} ${f.cy} L ${t.cx} ${t.cy}`;
}

function PacketDot({ anim }: { anim: PacketAnimation }) {
  const pathStr = getRFPath(anim.from, anim.to);
  const id = `packet-anim-${anim.id}`;

  return (
    <>
      <defs>
        <path id={id} d={pathStr} />
      </defs>
      <circle r={5} fill="#FF0000" filter="url(#packet-glow)">
        <animateMotion dur="1.2s" fill="remove" path={pathStr}>
          <mpath href={`#${id}`} />
        </animateMotion>
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1.2s" fill="remove" />
      </circle>
    </>
  );
}

export function NetworkTopology() {
  const { state, dispatch } = useApp();
  const { dashboard, selectedNodeId } = state;
  const [hoveredNode, setHoveredNode] = useState<NodeId | null>(null);

  const link1 = dashboard.links[0]; // Base A ⇄ Drone
  const link2 = dashboard.links[1]; // Drone ⇄ Base C

  function handleNodeClick(nodeId: NodeId) {
    dispatch({ type: 'SELECT_NODE', nodeId: selectedNodeId === nodeId ? null : nodeId });
  }

  return (
    <div className="relative w-full bg-[#141414] rounded-xl p-5 sm:p-6 border border-[#2A2A2A] select-none shadow-lg">
      {/* Topology Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-[#262626] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="font-bold text-[#F5F5F5] text-sm tracking-wide">Bidirectional RF Relay Mesh</span>
          <span className="badge badge-neutral font-mono text-[11px] px-2 py-0.5">
            868.0 MHz LoRa SF7
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[#858585] font-mono text-xs">
          <span>Uplink A → C: <strong className="text-[#F5F5F5]">{dashboard.relayStats.totalRelayedAtoC}</strong> pkts</span>
          <span className="text-[#444]">|</span>
          <span>Downlink C → A: <strong className="text-[#F5F5F5]">{dashboard.relayStats.totalRelayedCtoA}</strong> pkts</span>
          <span className="badge badge-burgundy text-[11px] px-2.5 py-0.5">
            Direct SPI Delay: ~44ms
          </span>
        </div>
      </div>

      {/* SVG Canvas with generous 960x260 dimensions */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 960 260"
          className="w-full min-w-[760px] h-auto overflow-visible"
        >
          <defs>
            {/* Arrow Markers */}
            <marker id="arrow-uplink-mesh" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#C00000" />
            </marker>
            <marker id="arrow-downlink-mesh" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#800000" />
            </marker>

            {/* Glowing filter for packets */}
            <filter id="packet-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle card drop shadow */}
            <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.5" />
            </filter>
          </defs>

          {/* ═══════════════ LINK 1: BASE A ⇄ DRONE RELAY ═══════════════ */}
          {/* Uplink Arc */}
          <path
            d={getRFPath('BASE_A', 'DRONE_RELAY')}
            fill="none"
            stroke="#C00000"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-uplink-mesh)"
            opacity="0.85"
          />
          {/* Downlink Arc */}
          <path
            d={getRFPath('DRONE_RELAY', 'BASE_A')}
            fill="none"
            stroke="#800000"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-downlink-mesh)"
            opacity="0.75"
          />

          {/* Uplink Label */}
          <text x="315" y="74" textAnchor="middle" fill="#C00000" fontSize="9" fontWeight="700" letterSpacing="0.06em" fontFamily="var(--font-mono)">
            0xFA (UPLINK RF LINK)
          </text>

          {/* Link 1 Center Telemetry Badge */}
          <g transform="translate(315, 130)">
            <rect
              x="-68"
              y="-13"
              width="136"
              height="26"
              rx="13"
              fill="#181818"
              stroke="#383838"
              strokeWidth="1"
            />
            <circle cx="-52" cy="0" r="3" fill="#22C55E" />
            <text x="-42" y="3.5" fill="#E5E5E5" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">
              {link1 ? `${link1.rssiDbm} dBm · ~${link1.distanceKm} km` : '-72.4 dBm · ~1.18 km'}
            </text>
          </g>

          {/* Downlink Label */}
          <text x="315" y="196" textAnchor="middle" fill="#757575" fontSize="8.5" fontWeight="600" fontFamily="var(--font-mono)">
            868.0 MHz · SF7 · BW 125 kHz
          </text>

          {/* ═══════════════ LINK 2: DRONE RELAY ⇄ BASE C ═══════════════ */}
          {/* Uplink Arc */}
          <path
            d={getRFPath('DRONE_RELAY', 'BASE_C')}
            fill="none"
            stroke="#C00000"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-uplink-mesh)"
            opacity="0.85"
          />
          {/* Downlink Arc */}
          <path
            d={getRFPath('BASE_C', 'DRONE_RELAY')}
            fill="none"
            stroke="#800000"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-downlink-mesh)"
            opacity="0.75"
          />

          {/* Uplink Label */}
          <text x="647" y="74" textAnchor="middle" fill="#C00000" fontSize="9" fontWeight="700" letterSpacing="0.06em" fontFamily="var(--font-mono)">
            0xFF (DOWNLINK RF LINK)
          </text>

          {/* Link 2 Center Telemetry Badge */}
          <g transform="translate(647, 130)">
            <rect
              x="-68"
              y="-13"
              width="136"
              height="26"
              rx="13"
              fill="#181818"
              stroke="#383838"
              strokeWidth="1"
            />
            <circle cx="-52" cy="0" r="3" fill="#22C55E" />
            <text x="-42" y="3.5" fill="#E5E5E5" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">
              {link2 ? `${link2.rssiDbm} dBm · ~${link2.distanceKm} km` : '-76.8 dBm · ~1.45 km'}
            </text>
          </g>

          {/* Downlink Label */}
          <text x="647" y="196" textAnchor="middle" fill="#757575" fontSize="8.5" fontWeight="600" fontFamily="var(--font-mono)">
            868.0 MHz · SF7 · BW 125 kHz
          </text>

          {/* ═══════════════ NODE 1: BASE STATION A ═══════════════ */}
          <g
            transform={`translate(${LAYOUT.BASE_A.cx}, ${LAYOUT.BASE_A.cy})`}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleNodeClick('BASE_A')}
            onMouseEnter={() => setHoveredNode('BASE_A')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Card Background */}
            <rect
              x="-80"
              y="-48"
              width="160"
              height="96"
              rx="10"
              fill="#1A1A1A"
              stroke={selectedNodeId === 'BASE_A' ? '#C00000' : hoveredNode === 'BASE_A' ? '#4A4A4A' : '#2F2F2F'}
              strokeWidth={selectedNodeId === 'BASE_A' ? 2 : 1}
              filter="url(#node-shadow)"
            />

            {/* Icon Box */}
            <rect x="-66" y="-36" width="30" height="30" rx="6" fill="#222222" stroke="#333333" strokeWidth="1" />
            <foreignObject x="-66" y="-36" width="30" height="30">
              <div className="w-full h-full flex items-center justify-center">
                <RadioTower className="w-4 h-4 text-[#C00000]" />
              </div>
            </foreignObject>

            {/* Title & Subtitle */}
            <text x="-26" y="-22" fill="#F5F5F5" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
              BASE A
            </text>
            <text x="-26" y="-6" fill="#858585" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
              Origin Ground
            </text>

            {/* Glowing Online Status LED */}
            <circle cx="62" cy="-24" r="5" fill="#22C55E" opacity="0.25" />
            <circle cx="62" cy="-24" r="3" fill="#22C55E" />

            {/* Divider Line */}
            <line x1="-66" y1="8" x2="66" y2="8" stroke="#262626" strokeWidth="1" />

            {/* Bottom Row */}
            <text x="-66" y="27" fill="#FFA8A8" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
              SYNC: 0xFA
            </text>
            <text x="66" y="27" textAnchor="end" fill="#757575" fontSize="9.5" fontWeight="500" fontFamily="var(--font-mono)">
              868.0 MHz
            </text>
          </g>

          {/* ═══════════════ NODE 2: DRONE RELAY (AIRBORNE) ═══════════════ */}
          <g
            transform={`translate(${LAYOUT.DRONE_RELAY.cx}, ${LAYOUT.DRONE_RELAY.cy})`}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleNodeClick('DRONE_RELAY')}
            onMouseEnter={() => setHoveredNode('DRONE_RELAY')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Card Background */}
            <rect
              x="-84"
              y="-48"
              width="168"
              height="96"
              rx="10"
              fill="#202020"
              stroke={selectedNodeId === 'DRONE_RELAY' ? '#C00000' : hoveredNode === 'DRONE_RELAY' ? '#555555' : '#3C3C3C'}
              strokeWidth={selectedNodeId === 'DRONE_RELAY' ? 2 : 1}
              filter="url(#node-shadow)"
            />

            {/* Airborne Badge Pill Mounted on Card Top */}
            <g transform="translate(0, -48)">
              <rect x="-50" y="-10" width="100" height="20" rx="10" fill="#241010" stroke="#800000" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#FF8080" fontSize="8.5" fontWeight="700" letterSpacing="0.08em" fontFamily="var(--font-mono)">
                AIRBORNE RELAY
              </text>
            </g>

            {/* Icon Box */}
            <rect x="-70" y="-32" width="30" height="30" rx="6" fill="#282828" stroke="#383838" strokeWidth="1" />
            <foreignObject x="-70" y="-32" width="30" height="30">
              <div className="w-full h-full flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
            </foreignObject>

            {/* Title & Subtitle */}
            <text x="-30" y="-18" fill="#F5F5F5" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
              DRONE RELAY
            </text>
            <text x="-30" y="-2" fill="#858585" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
              Dual-Radio Bridge
            </text>

            {/* Glowing Online Status LED */}
            <circle cx="66" cy="-20" r="5" fill="#22C55E" opacity="0.25" />
            <circle cx="66" cy="-20" r="3" fill="#22C55E" />

            {/* Divider Line */}
            <line x1="-70" y1="12" x2="70" y2="12" stroke="#2B2B2B" strokeWidth="1" />

            {/* Bottom Row */}
            <text x="-70" y="30" fill="#FFA8A8" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
              0xFA ⇄ 0xFF
            </text>
            <text x="70" y="30" textAnchor="end" fill="#4ADE80" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
              ALT: 120m
            </text>
          </g>

          {/* ═══════════════ NODE 3: BASE STATION C ═══════════════ */}
          <g
            transform={`translate(${LAYOUT.BASE_C.cx}, ${LAYOUT.BASE_C.cy})`}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleNodeClick('BASE_C')}
            onMouseEnter={() => setHoveredNode('BASE_C')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Card Background */}
            <rect
              x="-80"
              y="-48"
              width="160"
              height="96"
              rx="10"
              fill="#1A1A1A"
              stroke={selectedNodeId === 'BASE_C' ? '#C00000' : hoveredNode === 'BASE_C' ? '#4A4A4A' : '#2F2F2F'}
              strokeWidth={selectedNodeId === 'BASE_C' ? 2 : 1}
              filter="url(#node-shadow)"
            />

            {/* Icon Box */}
            <rect x="-66" y="-36" width="30" height="30" rx="6" fill="#222222" stroke="#333333" strokeWidth="1" />
            <foreignObject x="-66" y="-36" width="30" height="30">
              <div className="w-full h-full flex items-center justify-center">
                <Radio className="w-4 h-4 text-[#C00000]" />
              </div>
            </foreignObject>

            {/* Title & Subtitle */}
            <text x="-26" y="-22" fill="#F5F5F5" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
              BASE C
            </text>
            <text x="-26" y="-6" fill="#858585" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
              Incident Command
            </text>

            {/* Glowing Online Status LED */}
            <circle cx="62" cy="-24" r="5" fill="#22C55E" opacity="0.25" />
            <circle cx="62" cy="-24" r="3" fill="#22C55E" />

            {/* Divider Line */}
            <line x1="-66" y1="8" x2="66" y2="8" stroke="#262626" strokeWidth="1" />

            {/* Bottom Row */}
            <text x="-66" y="27" fill="#FFA8A8" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
              SYNC: 0xFF
            </text>
            <text x="66" y="27" textAnchor="end" fill="#757575" fontSize="9.5" fontWeight="500" fontFamily="var(--font-mono)">
              HQ ACTIVE
            </text>
          </g>

          {/* Dynamic Packet Animations along exact RF Arcs */}
          {dashboard.activePacketAnimations.map((anim) => (
            <PacketDot key={anim.id} anim={anim} />
          ))}
        </svg>
      </div>

      {/* Interactive Selection / Hover Footer Strip */}
      <div className="mt-3 pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between text-xs text-[#858585]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#C00000]" />
          <span>
            {hoveredNode
              ? `${NODES[hoveredNode].name} — ${NODES[hoveredNode].role} · Sync: ${NODES[hoveredNode].syncWord ?? '0xFA/0xFF'} · IP: ${NODES[hoveredNode].ipAddress}`
              : selectedNodeId
              ? `Selected Node: ${NODES[selectedNodeId].name} (${NODES[selectedNodeId].role})`
              : 'Click any node to inspect telemetry diagnostics and routing metrics.'}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#666]">
          RF Carrier: 868.000 MHz · Dual SX1262 SPI Transceivers
        </div>
      </div>
    </div>
  );
}
