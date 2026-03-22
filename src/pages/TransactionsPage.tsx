import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { transactionApi } from '../api/client';
import { Transaction, TransactionRequest } from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', SHOPPING: '🛍️', BILLS: '📄', OTHER: '📦',
};
const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#f59e0b', TRANSPORT: '#3b82f6', SHOPPING: '#ec4899', BILLS: '#8b5cf6', OTHER: '#6b7280',
};
const EMPTY_FORM: TransactionRequest = {
  amount: 0, category: 'FOOD', description: '', type: 'EXPENSE',
  date: new Date().toISOString().slice(0, 10),
};

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TransactionRequest>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    transactionApi.getAll(month).then(res => setTransactions(res.data));
  };
  useEffect(() => { load(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) await transactionApi.update(editId, form);
      else await transactionApi.create(form);
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM); load();
    } finally { setLoading(false); }
  };

  const handleEdit = (tx: Transaction) => {
    setForm({ amount: tx.amount, category: tx.category, description: tx.description, type: tx.type, date: tx.date });
    setEditId(tx.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this transaction?')) { await transactionApi.delete(id); load(); }
  };

  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const totalIncome  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <div style={{
        background: 'white', padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Clarify</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Transactions', to: '/transactions' }].map(n => (
            <Link key={n.to} to={n.to} style={{
              textDecoration: 'none', padding: '5px 10px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, color: '#475569',
            }}>{n.label}</Link>
          ))}
          <button onClick={logout} style={{
            marginLeft: 4, padding: '5px 10px', borderRadius: 8,
            border: '1px solid #fecaca', background: '#fef2f2',
            color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>Log out</button>
        </nav>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>

        {/* Header — stacked on mobile */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: '#0f172a' }}>Transactions</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Manage your income and expenses</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              style={{
                padding: '8px 16px', background: '#4f46e5', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >+ Add Transaction</button>
          </div>

          {/* Filter bar — below title */}
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '8px 14px', width: 'fit-content',
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>🔍 Filter by month</span>
            <input
              type="month" value={month} onChange={e => setMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', padding: 0 }}
            />
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Income', value: `+$${totalIncome.toFixed(2)}`, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Expenses', value: `-$${totalExpense.toFixed(2)}`, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Net', value: `$${(totalIncome - totalExpense).toFixed(2)}`, color: '#4f46e5', bg: '#ede9fe' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: isMobile ? '10px 12px' : '14px 20px' }}>
              <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div style={{
            background: 'white', borderRadius: 16, padding: isMobile ? 16 : 24,
            marginBottom: 20, boxShadow: '0 4px 12px rgba(79,70,229,0.08)',
            border: '1px solid #e0e7ff',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
              {editId ? '✏️ Edit Transaction' : '➕ New Transaction'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Amount</label>
                <input type="number" placeholder="0.00" step="0.01" required
                  value={form.amount || ''}
                  onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  style={{ background: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ background: '#f8fafc' }}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: '#f8fafc' }}>
                  {Object.keys(CATEGORY_ICONS).map(c => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" required value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} style={{ background: '#f8fafc' }} />
              </div>
              <div style={{ gridColumn: isMobile ? '1 / -1' : '2 / 4' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Description (optional)</label>
                <input placeholder="e.g. Grocery run, Monthly rent..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ background: '#f8fafc' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={loading} style={{
                  padding: '10px 20px', background: loading ? '#a5b4fc' : '#4f46e5',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                }}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '10px 16px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Transaction list */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No transactions this month</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Tap "+ Add Transaction" to get started</p>
            </div>
          ) : transactions.map((tx, i) => (
            /* Card-style rows on mobile, table-style on desktop */
            isMobile ? (
              <div key={tx.id} style={{
                padding: '14px 16px',
                borderBottom: i < transactions.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, fontSize: 16,
                      background: `${CATEGORY_COLORS[tx.category]}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{CATEGORY_ICONS[tx.category] || '📦'}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{tx.description || tx.category}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'INCOME' ? '#16a34a' : '#ef4444' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => handleEdit(tx)} style={{
                    flex: 1, padding: '7px', background: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => handleDelete(tx.id)} style={{
                    flex: 1, padding: '7px', background: '#fef2f2', color: '#dc2626',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
            ) : (
              <div key={tx.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                padding: '16px 24px', alignItems: 'center',
                borderBottom: i < transactions.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 16,
                    background: `${CATEGORY_COLORS[tx.category]}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{CATEGORY_ICONS[tx.category] || '📦'}</div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{tx.description || tx.category}</span>
                </div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                  background: `${CATEGORY_COLORS[tx.category]}18`,
                  color: CATEGORY_COLORS[tx.category] || '#6b7280',
                }}>{tx.category}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{tx.date}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'INCOME' ? '#16a34a' : '#ef4444' }}>
                  {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(tx)} style={{
                    padding: '5px 12px', background: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => handleDelete(tx.id)} style={{
                    padding: '5px 12px', background: '#fef2f2', color: '#dc2626',
                    border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}