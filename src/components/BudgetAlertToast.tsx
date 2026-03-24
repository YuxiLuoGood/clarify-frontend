import { BudgetAlert } from '../useWebSocket';

interface Props {
  alerts: BudgetAlert[];
  onDismiss: (index: number) => void;
}

export default function BudgetAlertToast({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 360,
    }}>
      {alerts.map((alert, i) => (
        <div key={i} style={{
          background: 'white',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderLeft: '4px solid #f59e0b',
          animation: 'slideIn 0.3s ease',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                Budget Exceeded
              </span>
            </div>
            <button
              onClick={() => onDismiss(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 16, padding: '0 4px', lineHeight: 1,
              }}
            >✕</button>
          </div>

          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            {alert.message}
          </p>

          {/* Progress bar showing how much over budget */}
          <div style={{ background: '#fef3c7', borderRadius: 99, height: 6 }}>
            <div style={{
              width: `${Math.min((alert.spent / alert.budget) * 100, 100)}%`,
              height: 6, borderRadius: 99,
              background: alert.spent > alert.budget ? '#ef4444' : '#f59e0b',
              transition: 'width 0.5s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
            <span>Spent: ${Number(alert.spent).toFixed(2)}</span>
            <span>Budget: ${Number(alert.budget).toFixed(2)}</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}