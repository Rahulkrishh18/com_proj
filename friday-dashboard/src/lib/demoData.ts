import type {
  StationNode,
  TransmissionEvent,
  TelemetryReading,
  EmergencyIncident,
  NetworkLink,
  DashboardState,
  NodeId,
  EventCategory,
} from '../types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function uid(): string {
  return 'PKT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function ago(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

export function calcDistance(rssi: number, txRef = -30, n = 2.7): number {
  return parseFloat((Math.pow(10, (txRef - rssi) / (10 * n)) / 1000).toFixed(2));
}

// ─────────────────────────────────────────────
// Static Node Definitions
// ─────────────────────────────────────────────
export const NODES: Record<NodeId, StationNode> = {
  BASE_A: {
    id: 'BASE_A',
    name: 'Base Station A',
    role: 'Origin Node — Disaster Ground Control',
    syncWord: '0xFA',
    txPowerDbm: 22,
    frequencyMhz: 433.0,
    status: 'online',
    lastSeenAt: ago(3),
    ipAddress: '192.168.4.1',
    hardwarePin: {
      NSS: 'GPIO 5',
      DIO1: 'GPIO 35',
      NRST: 'GPIO 4',
      BUSY: 'GPIO 34',
      'SW-420 Seismic': 'GPIO 32',
    },
  },
  DRONE_RELAY: {
    id: 'DRONE_RELAY',
    name: 'Drone Relay',
    role: 'Airborne SX1262 Dual-Sync Bridge (0xFA ⇄ 0xFF)',
    syncWord: null,
    txPowerDbm: 22,
    frequencyMhz: 433.0,
    status: 'online',
    lastSeenAt: ago(1),
    ipAddress: '192.168.4.1',
    hardwarePin: {
      'Uplink NSS': 'GPIO 5',
      'Uplink DIO1': 'GPIO 35',
      'Downlink NSS': 'GPIO 27',
      'Downlink DIO1': 'GPIO 21',
    },
  },
  BASE_C: {
    id: 'BASE_C',
    name: 'Base Station C',
    role: 'Destination Node — Incident Command & Rescue HQ',
    syncWord: '0xFF',
    txPowerDbm: 22,
    frequencyMhz: 433.0,
    status: 'online',
    lastSeenAt: ago(4),
    ipAddress: '192.168.4.1',
    hardwarePin: {
      NSS: 'GPIO 5',
      DIO1: 'GPIO 35',
      NRST: 'GPIO 4',
      BUSY: 'GPIO 34',
      'Web Server': 'Port 80',
    },
  },
};

// ─────────────────────────────────────────────
// Demo Telemetry History (30 points)
// ─────────────────────────────────────────────
export function generateDemoTelemetry(): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const baseRSSI = -74.5;
  const baseSNR = 9.2;

  for (let i = 29; i >= 0; i--) {
    const rssi = parseFloat((baseRSSI + (Math.sin(i * 0.4) * 5) + (Math.random() * 2 - 1)).toFixed(1));
    const snr = parseFloat((baseSNR + (Math.cos(i * 0.3) * 1.8) + (Math.random() * 0.8 - 0.4)).toFixed(1));
    readings.push({
      id: uid(),
      timestamp: ago(i * 30),
      nodeId: 'BASE_A',
      rssiDbm: rssi,
      snrDb: snr,
      estimatedDistanceKm: calcDistance(rssi),
    });
  }
  return readings;
}

// ─────────────────────────────────────────────
// Demo Events & Conversational Ledger
// ─────────────────────────────────────────────
export function generateDemoEvents(): TransmissionEvent[] {
  return [
    {
      id: 'PKT-9041A',
      timestamp: ago(35),
      receivedAt: ago(34),
      forwardedAt: ago(33),
      sourceNodeId: 'BASE_A',
      destinationNodeId: 'BASE_C',
      category: 'sos',
      priority: 'critical',
      message: 'SOS — Flash Flood breach at Sector 4 perimeter. Immediate triage required.',
      direction: 'North-East',
      rssiDbm: -72.4,
      snrDb: 10.2,
      estimatedDistanceKm: 1.18,
      status: 'ack_received',
      relayedBy: 'DRONE_RELAY',
      isHardwareGenerated: true,
      isSimulation: false,
    },
    {
      id: 'PKT-9042C',
      timestamp: ago(28),
      receivedAt: ago(27),
      forwardedAt: ago(26),
      sourceNodeId: 'BASE_C',
      destinationNodeId: 'BASE_A',
      category: 'ack',
      priority: 'high',
      message: 'ACK: SOS confirmed by Command HQ. Rescue Boat Delta dispatched to Sector 4.',
      direction: 'South-West',
      rssiDbm: -78.1,
      snrDb: 8.4,
      estimatedDistanceKm: 1.54,
      status: 'rx_delivered',
      relayedBy: 'DRONE_RELAY',
      isHardwareGenerated: true,
      isSimulation: false,
    },
    {
      id: 'PKT-9043A',
      timestamp: ago(20),
      receivedAt: ago(19),
      forwardedAt: ago(18),
      sourceNodeId: 'BASE_A',
      destinationNodeId: 'BASE_C',
      category: 'medical',
      priority: 'high',
      message: 'Medical Priority: 3 casualties stabilized. Requesting 2 stretchers at LZ-Alpha.',
      direction: 'East',
      rssiDbm: -73.6,
      snrDb: 9.6,
      estimatedDistanceKm: 1.25,
      status: 'ack_received',
      relayedBy: 'DRONE_RELAY',
      isHardwareGenerated: true,
      isSimulation: false,
    },
    {
      id: 'PKT-9044C',
      timestamp: ago(12),
      receivedAt: ago(11),
      forwardedAt: ago(10),
      sourceNodeId: 'BASE_C',
      destinationNodeId: 'BASE_A',
      category: 'message',
      priority: 'normal',
      message: 'MEDEVAC helicopter inbound. ETA 6 minutes. Maintain radio beacon.',
      direction: 'West',
      rssiDbm: -76.8,
      snrDb: 8.8,
      estimatedDistanceKm: 1.45,
      status: 'rx_delivered',
      relayedBy: 'DRONE_RELAY',
      isHardwareGenerated: true,
      isSimulation: false,
    },
    {
      id: 'PKT-9045A',
      timestamp: ago(5),
      receivedAt: ago(4),
      forwardedAt: ago(3),
      sourceNodeId: 'BASE_A',
      destinationNodeId: 'BASE_C',
      category: 'cap_flood',
      priority: 'high',
      message: 'SIMULATION [CAP]: Water level rise +1.4m. Dam floodgates 2 & 3 open.',
      direction: 'North',
      rssiDbm: -71.2,
      snrDb: 10.8,
      estimatedDistanceKm: 1.11,
      status: 'relay_forwarded',
      relayedBy: 'DRONE_RELAY',
      isHardwareGenerated: false,
      isSimulation: true,
    },
  ];
}

// ─────────────────────────────────────────────
// Demo Incidents
// ─────────────────────────────────────────────
export function generateDemoIncidents(): EmergencyIncident[] {
  return [
    {
      id: 'INC-2026-001',
      createdAt: ago(180),
      updatedAt: ago(25),
      type: 'sos',
      severity: 'critical',
      sourceNodeId: 'BASE_A',
      title: 'Sector 4 Flash Flood & Evacuation Request',
      description: 'Emergency SOS beacon transmitted from Base Station A. Airborne drone relay bridged telemetry to Command HQ.',
      resolved: false,
      events: [],
      isSimulated: false,
    },
    {
      id: 'INC-2026-002',
      createdAt: ago(450),
      updatedAt: ago(120),
      type: 'medical',
      severity: 'high',
      sourceNodeId: 'BASE_A',
      title: 'LZ-Alpha Medical Evacuation',
      description: 'Field medical triage call routed via drone relay to Base C Rescue Command.',
      resolved: true,
      resolvedAt: ago(120),
      events: [],
      isSimulated: false,
    },
  ];
}

// ─────────────────────────────────────────────
// Demo Network Links
// ─────────────────────────────────────────────
export function generateDemoLinks(): NetworkLink[] {
  return [
    {
      from: 'BASE_A',
      to: 'DRONE_RELAY',
      rssiDbm: -72.4,
      snrDb: 10.2,
      distanceKm: 1.18,
      relayCountAtoC: 14,
      relayCountCtoA: 0,
      lastActivityAt: ago(5),
    },
    {
      from: 'DRONE_RELAY',
      to: 'BASE_C',
      rssiDbm: -76.8,
      snrDb: 8.8,
      distanceKm: 1.45,
      relayCountAtoC: 0,
      relayCountCtoA: 11,
      lastActivityAt: ago(10),
    },
  ];
}

// ─────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────
export function createInitialDashboardState(): DashboardState {
  const events = generateDemoEvents();
  const telemetry = generateDemoTelemetry();
  const incidents = generateDemoIncidents();
  const links = generateDemoLinks();

  return {
    isConnectedToHardware: false,
    isDemoMode: true,
    systemMode: 'simulation',
    uptimeSeconds: 384,
    stations: {
      BASE_A: {
        node: NODES.BASE_A,
        lastReceived: events.find(e => e.destinationNodeId === 'BASE_A') ?? null,
        lastTransmitted: events.find(e => e.sourceNodeId === 'BASE_A') ?? null,
        telemetry: telemetry[telemetry.length - 1] ?? null,
        seismicTriggered: false,
      },
      DRONE_RELAY: {
        node: NODES.DRONE_RELAY,
        lastReceived: events[0] ?? null,
        lastTransmitted: events[1] ?? null,
        telemetry: null,
      },
      BASE_C: {
        node: NODES.BASE_C,
        lastReceived: events.find(e => e.destinationNodeId === 'BASE_C') ?? null,
        lastTransmitted: events.find(e => e.sourceNodeId === 'BASE_C') ?? null,
        telemetry: {
          id: uid(),
          timestamp: ago(10),
          nodeId: 'BASE_C',
          rssiDbm: -76.8,
          snrDb: 8.8,
          estimatedDistanceKm: 1.45,
        },
      },
    },
    links,
    relayStats: {
      totalRelayedAtoC: 14,
      totalRelayedCtoA: 11,
      failedAttempts: 0,
      successRate: 100,
      averageLatencyMs: 44,
    },
    events,
    incidents,
    telemetryHistory: telemetry,
    activePacketAnimations: [],
  };
}

export function createTransmissionEvent(
  source: NodeId,
  destination: NodeId,
  category: EventCategory,
  message: string,
  direction?: string,
  isSimulation = false
): TransmissionEvent {
  const rssi = parseFloat((-70 - Math.random() * 15).toFixed(1));
  const snr = parseFloat((8 + Math.random() * 4).toFixed(1));
  return {
    id: uid(),
    timestamp: new Date(),
    receivedAt: new Date(Date.now() + 100),
    forwardedAt: new Date(Date.now() + 200),
    sourceNodeId: source,
    destinationNodeId: destination,
    category,
    priority: category === 'sos' ? 'critical' : category === 'medical' ? 'high' : 'normal',
    message,
    direction: direction || 'North',
    rssiDbm: rssi,
    snrDb: snr,
    estimatedDistanceKm: calcDistance(rssi),
    status: 'relay_forwarded',
    relayedBy: 'DRONE_RELAY',
    isHardwareGenerated: false,
    isSimulation,
  };
}

export const buildInitialDemoState = createInitialDashboardState;
