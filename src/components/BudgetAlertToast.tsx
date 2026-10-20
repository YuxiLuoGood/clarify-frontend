import type { BudgetAlert } from '../hooks/useBudgetAlerts';

interface Props {
  alerts: BudgetAlert[];
  onDismiss: (id: number) => void;
}

export default function BudgetAlertToast({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 24, right: 24, left: 24,
        marginLeft: 'auto', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 360,
      }}
    >
      {alerts.map(alert => (
        <div key={alert.id} className="toast-enter" style={{
          background: 'white',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderLeft: '4px solid #f59e0b',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">⚠️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                Budget exceeded
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss alert"
              onClick={() => onDismiss(alert.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 16, padding: '0 4px', lineHeight: 1,
              }}
            >✕</button>
          </div>

          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            {alert.message}
          </p>

          {/* How far over budget */}
          <div style={{ background: '#fef3c7', borderRadius: 99, height: 6 }}>
            <div style={{
              width: `${Math.min((alert.spent / alert.budget) * 100, 100)}%`,
              height: 6, borderRadius: 99,
              background: alert.spent > alert.budget ? '#ef4444' : '#f59e0b',
              transition: 'width 0.5s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
            <span>Spent: ${alert.spent.toFixed(2)}</span>
            <span>Budget: ${alert.budget.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
