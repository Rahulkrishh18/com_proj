// Type definitions for the F.R.I.D.A.Y. mission control system

export type NodeId = 'BASE_A' | 'DRONE_RELAY' | 'BASE_C';

export type NodeStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export type SyncWord = '0xFA' | '0xFF';

export interface StationNode {
  id: NodeId;
  name: string;
  role: string;
  syncWord: SyncWord | null;
  txPowerDbm: number;
  frequencyMhz: number;
  status: NodeStatus;
  lastSeenAt: Date | null;
  ipAddress: string | null;
  hardwarePin?: Record<string, string>;
}

export interface TelemetryReading {
  id: string;
  timestamp: Date;
  nodeId: NodeId;
  rssiDbm: number;
  snrDb: number;
  estimatedDistanceKm: number;
}

export type TransmissionStatus =
  | 'request_accepted'
  | 'tx_success'
  | 'relay_forwarded'
  | 'rx_delivered'
  | 'ack_received'
  | 'failed'
  | 'pending';

export type EventCategory =
  | 'message'
  | 'sos'
  | 'medical'
  | 'all_clear'
  | 'ack'
  | 'cap_flood'
  | 'cap_earthquake'
  | 'cap_landslide'
  | 'cap_tsunami'
  | 'cap_cyclone'
  | 'seismic_trigger'
  | 'relay'
  | 'system';

export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

export interface TransmissionEvent {
  id: string;
  timestamp: Date;
  receivedAt?: Date;
  forwardedAt?: Date;
  sourceNodeId: NodeId;
  destinationNodeId: NodeId;
  category: EventCategory;
  priority: EventPriority;
  message: string;
  direction?: string;
  rssiDbm?: number;
  snrDb?: number;
  estimatedDistanceKm?: number;
  status: TransmissionStatus;
  relayedBy?: NodeId;
  isHardwareGenerated: boolean;
  isSimulation?: boolean;
  errorMessage?: string;
}

export interface EmergencyIncident {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: EventCategory;
  severity: 'critical' | 'high' | 'moderate';
  sourceNodeId: NodeId;
  title: string;
  description: string;
  resolved: boolean;
  resolvedAt?: Date;
  events: TransmissionEvent[];
  isSimulated: boolean;
}

export interface NetworkLink {
  from: NodeId;
  to: NodeId;
  rssiDbm: number;
  snrDb: number;
  distanceKm: number;
  relayCountAtoC: number;
  relayCountCtoA: number;
  lastActivityAt: Date | null;
}

export interface StationState {
  node: StationNode;
  lastReceived: TransmissionEvent | null;
  lastTransmitted: TransmissionEvent | null;
  telemetry: TelemetryReading | null;
  seismicTriggered?: boolean;
}

export interface RelayStats {
  totalRelayedAtoC: number;
  totalRelayedCtoA: number;
  failedAttempts: number;
  successRate: number;
  averageLatencyMs: number;
}

export interface DashboardState {
  isConnectedToHardware: boolean;
  isDemoMode: boolean;
  systemMode: 'simulation' | 'live';
  uptimeSeconds: number;
  stations: Record<NodeId, StationState>;
  links: NetworkLink[];
  relayStats: RelayStats;
  events: TransmissionEvent[];
  incidents: EmergencyIncident[];
  telemetryHistory: TelemetryReading[];
  activePacketAnimations: PacketAnimation[];
}

export interface PacketAnimation {
  id: string;
  from: NodeId;
  to: NodeId;
  startedAt: number;
  duration: number;
  color: string;
}

export interface MessageComposerState {
  text: string;
  direction: string;
  origin: NodeId;
  isPending: boolean;
  error: string | null;
}

export type SidebarPage =
  | 'overview'
  | 'station_a'
  | 'drone_relay'
  | 'station_c'
  | 'topology'
  | 'telemetry'
  | 'emergency'
  | 'logs'
  | 'diagnostics'
  | 'settings';
