import { useApp } from '../../context/AppContext';
import type { ToastItem } from '../../context/AppContext';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from 'lucide-react';

const icons: Record<ToastItem['variant'], React.FC<{ size: number; className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle,
};

const colors: Record<ToastItem['variant'], string> = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  critical: 'text-red-400',
};

export function Toaster() {
  const { state, dispatch } = useApp();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {state.toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            className={`toast ${t.variant === 'critical' ? 'toast-critical' : ''}`}
            style={{ pointerEvents: 'all' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={15} className={colors[t.variant]} />
              <span style={{ fontSize: 13, flex: 1, color: 'var(--color-off-white)' }}>{t.message}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_TOAST', id: t.id })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2 }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
