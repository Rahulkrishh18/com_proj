import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { DashboardState, SidebarPage, TransmissionEvent, EmergencyIncident, PacketAnimation, NodeId, EventCategory } from '../types';
import { buildInitialDemoState, createTransmissionEvent, generateDemoTelemetry } from '../lib/demoData';

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
  dashboard: DashboardState;
  toasts: ToastItem[];
  sidebarCollapsed: boolean;
  activeModal: string | null;
  selectedNodeId: NodeId | null;
}

type Action =
  | { type: 'SET_PAGE'; page: SidebarPage }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_MODAL'; id: string }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SELECT_NODE'; nodeId: NodeId | null }
  | { type: 'ADD_TOAST'; toast: ToastItem }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'ADD_EVENT'; event: TransmissionEvent }
  | { type: 'ADD_INCIDENT'; incident: EmergencyIncident }
  | { type: 'RESOLVE_INCIDENT'; id: string }
  | { type: 'ADD_PACKET_ANIMATION'; anim: PacketAnimation }
  | { type: 'REMOVE_PACKET_ANIMATION'; id: string }
  | { type: 'TICK_UPTIME' }
  | { type: 'REFRESH_TELEMETRY' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page };
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
    case 'ADD_EVENT': {
      const ev = action.event;
      const dashboard = { ...state.dashboard };
      dashboard.events = [ev, ...dashboard.events].slice(0, 200);
      // Update station state
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
      // Update relay stats
      if (ev.sourceNodeId === 'BASE_A') {
        dashboard.relayStats = { ...dashboard.relayStats, totalRelayedAtoC: dashboard.relayStats.totalRelayedAtoC + 1 };
      } else if (ev.sourceNodeId === 'BASE_C') {
        dashboard.relayStats = { ...dashboard.relayStats, totalRelayedCtoA: dashboard.relayStats.totalRelayedCtoA + 1 };
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

// ─── Context ─────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (page: SidebarPage) => void;
  toast: (message: string, variant?: ToastItem['variant']) => void;
  transmit: (
    source: NodeId,
    destination: NodeId,
    category: EventCategory,
    message: string,
    direction?: string
  ) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    page: 'station_a',
    dashboard: buildInitialDemoState(),
    toasts: [],
    sidebarCollapsed: false,
    activeModal: null,
    selectedNodeId: null,
  });

  const toastId = useRef(0);

  // Uptime clock
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_UPTIME' }), 1000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useCallback((page: SidebarPage) => {
    dispatch({ type: 'SET_PAGE', page });
  }, []);

  const toast = useCallback((message: string, variant: ToastItem['variant'] = 'info') => {
    const id = String(++toastId.current);
    const item: ToastItem = { id, message, variant };
    dispatch({ type: 'ADD_TOAST', toast: item });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);

  const transmit = useCallback((
    source: NodeId,
    destination: NodeId,
    category: EventCategory,
    message: string,
    direction?: string,
  ) => {
    const ev = createTransmissionEvent(source, destination, category, message, direction);
    dispatch({ type: 'ADD_EVENT', event: ev });

    // Packet animation from source → relay → destination
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

    const prefix = category === 'sos' ? '🔴 SOS' : category === 'medical' ? '⚠ MED' : '📡 TX';
    toast(`${prefix}: Packet transmitted via Drone Relay`, category === 'sos' ? 'critical' : 'success');
  }, [toast]);

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, toast, transmit }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
