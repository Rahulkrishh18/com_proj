import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  DashboardState, SidebarPage, TransmissionEvent, EmergencyIncident,
  PacketAnimation, NodeId, EventCategory
} from '../types';
import { buildInitialDemoState, createTransmissionEvent, generateDemoTelemetry } from '../lib/demoData';
import {
  fetchMessagesFromDB,
  postMessageToDB,
  acknowledgeMessageInDB,
  subscribeToCloudMessages,
  recordAuditEvent,
  fetchAuditEventsFromDB,
  subscribeToAuditEvents,
  isSupabaseConfigured,
  type CloudMessage,
  type AuditEvent,
  type StationId,
  type MessageCategory,
} from '../lib/supabase';

// Helper to convert DB CloudMessage to internal TransmissionEvent
export function cloudMessageToEvent(msg: CloudMessage): TransmissionEvent {
  let category: EventCategory = 'message';
  if (msg.category === 'SOS') category = 'sos';
  else if (msg.category === 'MEDICAL') category = 'medical';
  else if (msg.category === 'ALL_CLEAR') category = 'all_clear';
  else if (msg.category === 'DISASTER') {
    const d = msg.disaster_type?.toUpperCase() || '';
    if (d.includes('FLOOD')) category = 'cap_flood';
    else if (d.includes('EARTHQUAKE')) category = 'cap_earthquake';
    else category = 'cap_landslide';
  } else if (msg.category === 'NORMAL') {
    if (msg.message_text.toLowerCase().startsWith('ack')) category = 'ack';
    else category = 'message';
  }

  const priority = msg.category === 'SOS' ? 'critical' : msg.category === 'MEDICAL' ? 'high' : 'normal';

  return {
    id: msg.id,
    timestamp: new Date(msg.created_at),
    sourceNodeId: msg.sender_station,
    destinationNodeId: msg.recipient_station,
    category,
    priority,
    message: msg.message_text,
    direction: msg.direction || undefined,
    status: msg.ack_status === 'ACKNOWLEDGED' ? 'ack_received' : 'rx_delivered',
    isHardwareGenerated: false,
    relayedBy: 'DRONE_RELAY',
    estimatedDistanceKm: msg.sender_station === 'BASE_A' ? 1.18 : 1.45,
    rssiDbm: msg.sender_station === 'BASE_A' ? -72.4 : -76.8,
    snrDb: msg.sender_station === 'BASE_A' ? 10.7 : 9.8,
  };
}

// ─── Toast ───────────────────────────────────────────────────────
export interface ToastItem {
  id: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'critical';
  duration?: number;
}

// ─── App State ───────────────────────────────────────────────────
interface AppState {
  page: SidebarPage;
  authenticatedStation: StationId | null;
  dashboard: DashboardState;
  toasts: ToastItem[];
  sidebarCollapsed: boolean;
  activeModal: string | null;
  selectedNodeId: NodeId | null;
  cloudMessages: CloudMessage[];
  auditEvents: AuditEvent[];
  isCloudConnected: boolean;
}

type Action =
  | { type: 'SET_PAGE'; page: SidebarPage }
  | { type: 'SET_AUTHENTICATED_STATION'; station: StationId | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_MODAL'; id: string }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SELECT_NODE'; nodeId: NodeId | null }
  | { type: 'ADD_TOAST'; toast: ToastItem }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_CLOUD_MESSAGES'; messages: CloudMessage[] }
  | { type: 'ADD_CLOUD_MESSAGE'; message: CloudMessage }
  | { type: 'UPDATE_CLOUD_MESSAGE'; message: CloudMessage }
  | { type: 'SET_AUDIT_EVENTS'; events: AuditEvent[] }
  | { type: 'ADD_AUDIT_EVENT'; event: AuditEvent }
  | { type: 'ADD_EVENT'; event: TransmissionEvent }
  | { type: 'ADD_INCIDENT'; incident: EmergencyIncident }
  | { type: 'RESOLVE_INCIDENT'; id: string }
  | { type: 'ADD_PACKET_ANIMATION'; anim: PacketAnimation }
  | { type: 'REMOVE_PACKET_ANIMATION'; id: string }
  | { type: 'TICK_UPTIME' }
  | { type: 'REFRESH_TELEMETRY' }
  | { type: 'SET_CLOUD_STATUS'; connected: boolean };

function getDefaultPageForStation(station: StationId | null): SidebarPage {
  if (station === 'BASE_C') return 'station_c';
  if (station === 'DRONE_RELAY') return 'drone_relay';
  return 'station_a';
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page };

    case 'SET_AUTHENTICATED_STATION':
      return {
        ...state,
        authenticatedStation: action.station,
        // Automatically default view to station dashboard on login
        page: getDefaultPageForStation(action.station),
      };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'OPEN_MODAL':
      return { ...state, activeModal: action.id };

    case 'CLOSE_MODAL':
      return { ...state, activeModal: null };

    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.nodeId };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case 'SET_CLOUD_STATUS':
      return { ...state, isCloudConnected: action.connected };

    case 'SET_CLOUD_MESSAGES': {
      const dbEvents = action.messages.map(cloudMessageToEvent);
      const dashboard = { ...state.dashboard };
      dashboard.events = dbEvents;

      // Update station latest states
      const latestFromA = dbEvents.find(e => e.sourceNodeId === 'BASE_A');
      const latestFromC = dbEvents.find(e => e.sourceNodeId === 'BASE_C');

      if (latestFromA) {
        dashboard.stations.BASE_A = {
          ...dashboard.stations.BASE_A,
          lastTransmitted: latestFromA,
        };
        dashboard.stations.BASE_C = {
          ...dashboard.stations.BASE_C,
          lastReceived: latestFromA,
        };
      }
      if (latestFromC) {
        dashboard.stations.BASE_C = {
          ...dashboard.stations.BASE_C,
          lastTransmitted: latestFromC,
        };
        dashboard.stations.BASE_A = {
          ...dashboard.stations.BASE_A,
          lastReceived: latestFromC,
        };
      }

      return {
        ...state,
        cloudMessages: action.messages,
        dashboard,
      };
    }

    case 'ADD_CLOUD_MESSAGE': {
      const msg = action.message;
      const ev = cloudMessageToEvent(msg);

      // Check if message already exists
      const existing = state.cloudMessages.some(m => m.id === msg.id);
      if (existing) return state;

      const newCloudMsgs = [msg, ...state.cloudMessages];
      const dashboard = { ...state.dashboard };
      dashboard.events = [ev, ...dashboard.events.filter(e => e.id !== ev.id)].slice(0, 200);

      const src = dashboard.stations[ev.sourceNodeId];
      if (src) {
        dashboard.stations = {
          ...dashboard.stations,
          [ev.sourceNodeId]: { ...src, lastTransmitted: ev },
        };
      }
      const dst = dashboard.stations[ev.destinationNodeId];
      if (dst) {
        dashboard.stations = {
          ...dashboard.stations,
          [ev.destinationNodeId]: { ...dst, lastReceived: ev },
        };
      }

      if (ev.sourceNodeId === 'BASE_A') {
        dashboard.relayStats = {
          ...dashboard.relayStats,
          totalRelayedAtoC: dashboard.relayStats.totalRelayedAtoC + 1,
        };
      } else if (ev.sourceNodeId === 'BASE_C') {
        dashboard.relayStats = {
          ...dashboard.relayStats,
          totalRelayedCtoA: dashboard.relayStats.totalRelayedCtoA + 1,
        };
      }

      return {
        ...state,
        cloudMessages: newCloudMsgs,
        dashboard,
      };
    }

    case 'UPDATE_CLOUD_MESSAGE': {
      const msg = action.message;
      const ev = cloudMessageToEvent(msg);
      const newCloudMsgs = state.cloudMessages.map(m => m.id === msg.id ? msg : m);
      const dashboard = { ...state.dashboard };
      dashboard.events = dashboard.events.map(e => e.id === ev.id ? ev : e);

      return {
        ...state,
        cloudMessages: newCloudMsgs,
        dashboard,
      };
    }

    case 'SET_AUDIT_EVENTS':
      return { ...state, auditEvents: action.events };

    case 'ADD_AUDIT_EVENT': {
      const exists = state.auditEvents.some(a => a.id === action.event.id);
      if (exists) return state;
      return {
        ...state,
        auditEvents: [action.event, ...state.auditEvents].slice(0, 300),
      };
    }

    case 'ADD_EVENT': {
      const ev = action.event;
      const dashboard = { ...state.dashboard };
      dashboard.events = [ev, ...dashboard.events].slice(0, 200);
      const src = dashboard.stations[ev.sourceNodeId];
      if (src) {
        dashboard.stations = {
          ...dashboard.stations,
          [ev.sourceNodeId]: { ...src, lastTransmitted: ev },
        };
      }
      const dst = dashboard.stations[ev.destinationNodeId];
      if (dst) {
        dashboard.stations = {
          ...dashboard.stations,
          [ev.destinationNodeId]: { ...dst, lastReceived: ev },
        };
      }
      return { ...state, dashboard };
    }

    case 'ADD_INCIDENT': {
      const dashboard = {
        ...state.dashboard,
        incidents: [action.incident, ...state.dashboard.incidents],
      };
      return { ...state, dashboard };
    }

    case 'RESOLVE_INCIDENT': {
      const dashboard = {
        ...state.dashboard,
        incidents: state.dashboard.incidents.map(i =>
          i.id === action.id ? { ...i, resolved: true, resolvedAt: new Date() } : i
        ),
      };
      return { ...state, dashboard };
    }

    case 'ADD_PACKET_ANIMATION': {
      const dashboard = {
        ...state.dashboard,
        activePacketAnimations: [...state.dashboard.activePacketAnimations, action.anim],
      };
      return { ...state, dashboard };
    }

    case 'REMOVE_PACKET_ANIMATION': {
      const dashboard = {
        ...state.dashboard,
        activePacketAnimations: state.dashboard.activePacketAnimations.filter(a => a.id !== action.id),
      };
      return { ...state, dashboard };
    }

    case 'TICK_UPTIME': {
      const dashboard = { ...state.dashboard, uptimeSeconds: state.dashboard.uptimeSeconds + 1 };
      return { ...state, dashboard };
    }

    case 'REFRESH_TELEMETRY': {
      const fresh = generateDemoTelemetry();
      const dashboard = {
        ...state.dashboard,
        telemetryHistory: fresh,
        stations: {
          ...state.dashboard.stations,
          BASE_A: { ...state.dashboard.stations.BASE_A, telemetry: fresh[fresh.length - 1] },
        },
      };
      return { ...state, dashboard };
    }

    default:
      return state;
  }
}

// ─── Context Value ────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (page: SidebarPage) => void;
  toast: (message: string, variant?: ToastItem['variant']) => void;
  login: (station: StationId) => void;
  logout: () => void;
  transmit: (
    source: NodeId,
    destination: NodeId,
    category: EventCategory,
    message: string,
    direction?: string,
    disasterType?: string
  ) => Promise<{ success: boolean; error?: string }>;
  acknowledge: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialStation = (sessionStorage.getItem('friday_authenticated_station') as StationId) || null;

  const [state, dispatch] = useReducer(reducer, {
    page: getDefaultPageForStation(initialStation),
    authenticatedStation: initialStation,
    dashboard: buildInitialDemoState(),
    toasts: [],
    sidebarCollapsed: false,
    activeModal: null,
    selectedNodeId: null,
    cloudMessages: [],
    auditEvents: [],
    isCloudConnected: false,
  });

  const toastId = useRef(0);

  // Uptime tick
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_UPTIME' }), 1000);
    return () => clearInterval(interval);
  }, []);

  const toast = useCallback((message: string, variant: ToastItem['variant'] = 'info') => {
    const id = String(++toastId.current);
    const item: ToastItem = { id, message, variant };
    dispatch({ type: 'ADD_TOAST', toast: item });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);

  // Enforce Station Role Authorization on page navigation
  const navigate = useCallback((targetPage: SidebarPage) => {
    const role = state.authenticatedStation;
    if (!role) {
      dispatch({ type: 'SET_PAGE', page: targetPage });
      return;
    }

    if (role === 'BASE_A') {
      const allowedForA: SidebarPage[] = [
        'station_a',
        'station_a_sent',
        'station_a_received',
        'station_a_emergency',
        'overview',
      ];
      if (!allowedForA.includes(targetPage)) {
        toast('Access Denied: Base Station A is not authorized to access that dashboard.', 'critical');
        dispatch({ type: 'SET_PAGE', page: 'station_a' });
        return;
      }
    } else if (role === 'BASE_C') {
      const allowedForC: SidebarPage[] = [
        'station_c',
        'station_c_received',
        'station_c_replies',
        'station_c_emergency',
        'overview',
      ];
      if (!allowedForC.includes(targetPage)) {
        toast('Access Denied: Base Station C is not authorized to access that dashboard.', 'critical');
        dispatch({ type: 'SET_PAGE', page: 'station_c' });
        return;
      }
    } else if (role === 'DRONE_RELAY') {
      const allowedForRelay: SidebarPage[] = [
        'drone_relay',
        'drone_monitor',
        'drone_ledger',
        'drone_activity',
        'drone_audit',
        'overview',
        'topology',
        'telemetry',
        'logs',
        'diagnostics',
        'settings',
      ];
      if (!allowedForRelay.includes(targetPage)) {
        toast('Monitoring Restriction: Drone Relay operator cannot access Station operational controls.', 'warning');
        dispatch({ type: 'SET_PAGE', page: 'drone_relay' });
        return;
      }
    }

    dispatch({ type: 'SET_PAGE', page: targetPage });
  }, [state.authenticatedStation, toast]);

  const login = useCallback(async (station: StationId) => {
    sessionStorage.setItem('friday_authenticated_station', station);
    dispatch({ type: 'SET_AUTHENTICATED_STATION', station });
    const stationTitle = station === 'BASE_A'
      ? 'Base Station Alpha (0xFA)'
      : station === 'BASE_C'
      ? 'Base Station Charlie (0xFF)'
      : 'Drone Relay Operator (AIRBORNE)';
    toast(`Authenticated as ${stationTitle}`, 'success');
    await recordAuditEvent(station, 'LOGIN_SUCCESS', `Operator authenticated as ${stationTitle}`);
  }, [toast]);

  const logout = useCallback(async () => {
    const currentRole = state.authenticatedStation;
    if (currentRole) {
      await recordAuditEvent(currentRole, 'LOGOUT', `Operator session terminated`);
    }
    sessionStorage.removeItem('friday_authenticated_station');
    dispatch({ type: 'SET_AUTHENTICATED_STATION', station: null });
    toast('Logged out of station session.', 'info');
  }, [toast, state.authenticatedStation]);

  // Initial fetch and Realtime subscriptions from Supabase
  useEffect(() => {
    let msgChannel: ReturnType<typeof subscribeToCloudMessages> | null = null;
    let auditChannel: ReturnType<typeof subscribeToAuditEvents> | null = null;

    async function initializeCloudComms() {
      if (!isSupabaseConfigured()) {
        dispatch({ type: 'SET_CLOUD_STATUS', connected: false });
        return;
      }

      dispatch({ type: 'SET_CLOUD_STATUS', connected: true });

      // 1. Fetch initial message ledger from database
      const res = await fetchMessagesFromDB();
      if (res.messages && res.messages.length > 0) {
        dispatch({ type: 'SET_CLOUD_MESSAGES', messages: res.messages });
      }

      // 2. Fetch audit events from database
      const auditRes = await fetchAuditEventsFromDB();
      if (auditRes.events && auditRes.events.length > 0) {
        dispatch({ type: 'SET_AUDIT_EVENTS', events: auditRes.events });
      }

      // 3. Subscribe to Realtime messages
      msgChannel = subscribeToCloudMessages(
        (inserted) => {
          dispatch({ type: 'ADD_CLOUD_MESSAGE', message: inserted });

          // Trigger packet animation
          const animId1 = `${Date.now()}-1`;
          const animId2 = `${Date.now()}-2`;
          dispatch({
            type: 'ADD_PACKET_ANIMATION',
            anim: { id: animId1, from: inserted.sender_station, to: 'DRONE_RELAY', startedAt: Date.now(), duration: 1200, color: '#C00000' },
          });
          setTimeout(() => {
            dispatch({ type: 'REMOVE_PACKET_ANIMATION', id: animId1 });
            dispatch({
              type: 'ADD_PACKET_ANIMATION',
              anim: { id: animId2, from: 'DRONE_RELAY', to: inserted.recipient_station, startedAt: Date.now(), duration: 1200, color: '#C00000' },
            });
          }, 1300);
          setTimeout(() => {
            dispatch({ type: 'REMOVE_PACKET_ANIMATION', id: animId2 });
          }, 2700);

          // Toast alert if recipient matches current station or drone monitoring
          const isMeRecipient = state.authenticatedStation === inserted.recipient_station;
          const isDrone = state.authenticatedStation === 'DRONE_RELAY';
          if (isMeRecipient) {
            const prefix = inserted.category === 'SOS' ? '🚨 LIVE SOS INCOMING' : inserted.category === 'MEDICAL' ? '⚠ LIVE MEDICAL ALERT' : '📩 INCOMING COMMAND PACKET';
            toast(`${prefix}: "${inserted.message_text}"`, inserted.category === 'SOS' ? 'critical' : 'warning');
          } else if (isDrone) {
            toast(`Drone Relay routed packet ${inserted.id.slice(0, 8)} (${inserted.sender_station} → ${inserted.recipient_station})`, 'info');
          }
        },
        (updated) => {
          dispatch({ type: 'UPDATE_CLOUD_MESSAGE', message: updated });
          if (updated.ack_status === 'ACKNOWLEDGED') {
            toast(`Receipt Verified: ACK confirmed for packet #${updated.id.slice(0, 8)}`, 'success');
          }
        }
      );

      // 4. Subscribe to Realtime audit events
      auditChannel = subscribeToAuditEvents((insertedAudit) => {
        dispatch({ type: 'ADD_AUDIT_EVENT', event: insertedAudit });
      });
    }

    initializeCloudComms();

    return () => {
      if (msgChannel) msgChannel.unsubscribe();
      if (auditChannel) auditChannel.unsubscribe();
    };
  }, [toast, state.authenticatedStation]);

  // Transmit method writing to database
  const transmit = useCallback(async (
    source: NodeId,
    destination: NodeId,
    category: EventCategory,
    message: string,
    direction?: string,
    disasterType?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Role protection: Drone cannot impersonate sender
    if (state.authenticatedStation === 'DRONE_RELAY') {
      toast('Authorization Error: Drone Relay role is monitoring-only and cannot send operational messages.', 'critical');
      return { success: false, error: 'Monitoring role cannot transmit.' };
    }

    // Map internal category to Cloud MessageCategory
    let cloudCat: MessageCategory = 'NORMAL';
    if (category === 'sos') cloudCat = 'SOS';
    else if (category === 'medical') cloudCat = 'MEDICAL';
    else if (category === 'all_clear') cloudCat = 'ALL_CLEAR';
    else if (category.startsWith('cap_') || category === 'seismic_trigger') cloudCat = 'DISASTER';

    const senderStation: 'BASE_A' | 'BASE_C' = source === 'BASE_C' ? 'BASE_C' : 'BASE_A';
    const recipientStation: 'BASE_A' | 'BASE_C' = destination === 'BASE_A' ? 'BASE_A' : 'BASE_C';

    // 1. If Supabase is configured, save directly to cloud database
    if (isSupabaseConfigured()) {
      const res = await postMessageToDB({
        sender_station: senderStation,
        recipient_station: recipientStation,
        message_text: message,
        category: cloudCat,
        disaster_type: disasterType || null,
        direction: direction || null,
      });

      if (res.error) {
        toast(`Transmission failed: ${res.error}`, 'critical');
        await recordAuditEvent(senderStation, 'TRANSMISSION_FAILED', `Failed to transmit to ${recipientStation}: ${res.error}`);
        return { success: false, error: res.error };
      }

      // Record audit event
      const actionType = cloudCat === 'SOS'
        ? 'EMERGENCY_SOS'
        : cloudCat === 'MEDICAL'
        ? 'EMERGENCY_MEDICAL'
        : cloudCat === 'DISASTER'
        ? 'DISASTER_ALERT'
        : cloudCat === 'ALL_CLEAR'
        ? 'ALL_CLEAR'
        : senderStation === 'BASE_C' ? 'REPLY_SENT' : 'MESSAGE_SENT';

      await recordAuditEvent(
        senderStation,
        actionType,
        `Transmitted to ${recipientStation} (${cloudCat}): "${message.slice(0, 60)}"`,
        res.message?.id
      );

      const prefix = category === 'sos' ? '🔴 SOS BROADCAST' : category === 'medical' ? '⚠ MEDEVAC DISPATCH' : '📡 CLOUD PACKET SENT';
      toast(`${prefix}: Saved to cloud & broadcasted to ${recipientStation}`, category === 'sos' ? 'critical' : 'success');
      return { success: true };
    }

    // 2. Demo fallback if Supabase not configured yet
    const ev = createTransmissionEvent(source, destination, category, message, direction);
    dispatch({ type: 'ADD_EVENT', event: ev });

    const animId1 = `${Date.now()}-1`;
    const animId2 = `${Date.now()}-2`;
    dispatch({
      type: 'ADD_PACKET_ANIMATION',
      anim: { id: animId1, from: source, to: 'DRONE_RELAY', startedAt: Date.now(), duration: 1400, color: '#C00000' },
    });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_PACKET_ANIMATION', id: animId1 });
      dispatch({
        type: 'ADD_PACKET_ANIMATION',
        anim: { id: animId2, from: 'DRONE_RELAY', to: destination, startedAt: Date.now(), duration: 1400, color: '#C00000' },
      });
    }, 1500);
    setTimeout(() => {
      dispatch({ type: 'REMOVE_PACKET_ANIMATION', id: animId2 });
    }, 3200);

    toast(`Local demo: Transmitted to ${destination}`, category === 'sos' ? 'critical' : 'success');
    return { success: true };
  }, [toast, state.authenticatedStation]);

  // Acknowledge method updating database
  const acknowledge = useCallback(async (messageId: string): Promise<{ success: boolean; error?: string }> => {
    const ackSender: StationId = state.authenticatedStation || 'BASE_C';
    if (ackSender === 'DRONE_RELAY') {
      toast('Monitoring Restriction: Drone Relay cannot forge acknowledgements on behalf of stations.', 'critical');
      return { success: false, error: 'Monitoring role cannot acknowledge.' };
    }

    if (isSupabaseConfigured()) {
      const res = await acknowledgeMessageInDB(messageId);
      if (res.error) {
        toast(`ACK error: ${res.error}`, 'critical');
        await recordAuditEvent(ackSender, 'ACK_FAILED', `Failed ACK for message #${messageId.slice(0, 8)}: ${res.error}`, messageId);
        return { success: false, error: res.error };
      }

      await recordAuditEvent(ackSender, 'ACK_SENT', `Receipt verified and ACK emitted for packet #${messageId.slice(0, 8)}`, messageId);
      toast('Verified ACK registered in cloud database.', 'success');
      return { success: true };
    }

    toast('ACK acknowledged in local session.', 'success');
    return { success: true };
  }, [toast, state.authenticatedStation]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      navigate,
      toast,
      login,
      logout,
      transmit,
      acknowledge,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
