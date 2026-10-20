import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { apiErrorBody, transactionApi } from '../api/client';
import Navbar from '../components/Navbar';
import { CATEGORY_ICONS, categoryColor, categoryIcon } from '../categories';
import { useIsMobile } from '../hooks/useIsMobile';
import { currentMonth, today } from '../lib/dates';
import { CATEGORIES, type Category, type Transaction, type TransactionType } from '../types';

/** Form state keeps the amount as typed text so the field can be empty. */
interface FormState {
  amount: string;
  category: Category;
  description: string;
  type: TransactionType;
  date: string;
}

type FormErrors = Partial<Record<keyof FormState | 'general', string>>;

const emptyForm = (): FormState => ({
  amount: '', category: 'FOOD', description: '', type: 'EXPENSE', date: today(),
});

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
const fieldError: CSSProperties = { color: '#dc2626', fontSize: 12, marginTop: 4 };
const smallButton: CSSProperties = { border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer' };

const signed = (tx: Transaction) => `${tx.type === 'INCOME' ? '+' : '-'}$${tx.amount.toFixed(2)}`;

export default function TransactionsPage() {
  const isMobile = useIsMobile();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Only the latest request may update the list (month can change mid-flight).
  const requestSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      const data = await transactionApi.getAll(month);
      if (seq !== requestSeq.current) return;
      setTransactions(data);
      setListError(null);
    } catch {
      if (seq === requestSeq.current) setListError('Could not load transactions. Check your connection and try again.');
    } finally {
      if (seq === requestSeq.current) setLoaded(true);
    }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    setForm(emptyForm()); setEditId(null); setErrors({}); setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditId(null); setErrors({});
  };

  const handleEdit = (tx: Transaction) => {
    setForm({
      amount: String(tx.amount), category: tx.category,
      description: tx.description ?? '', type: tx.type, date: tx.date,
    });
    setEditId(tx.id); setErrors({}); setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    const body = { ...form, amount: Number(form.amount) };
    try {
      if (editId) await transactionApi.update(editId, body);
      else await transactionApi.create(body);
      closeForm();
      await load();
    } catch (err) {
      const data = apiErrorBody(err);
      setErrors(data
        ? { ...data, general: data.message }
        : { general: 'Could not save. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionApi.delete(id);
    } catch (err) {
      setListError(apiErrorBody(err)?.message ?? 'Could not delete the transaction. Try again.');
    }
    await load();
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const iconBadge = (tx: Transaction): CSSProperties => ({
    width: 36, height: 36, borderRadius: 10, fontSize: 16,
    background: `${categoryColor(tx.category)}18`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>

        {/* Header — stacked on mobile */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: '#0f172a' }}>Transactions</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Manage your income and expenses</p>
            </div>
            <button
              type="button"
              onClick={openNew}
              style={{
                padding: '8px 16px', background: '#4f46e5', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >+ Add Transaction</button>
          </div>

          {/* Filter bar */}
          <label style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '8px 14px', width: 'fit-content',
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>🔍 Filter by month</span>
            <input
              type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', padding: 0 }}
            />
          </label>
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
          <section style={{
            background: 'white', borderRadius: 16, padding: isMobile ? 16 : 24,
            marginBottom: 20, boxShadow: '0 4px 12px rgba(79,70,229,0.08)',
            border: '1px solid #e0e7ff',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
              {editId ? '✏️ Edit Transaction' : '➕ New Transaction'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="tx-amount" style={labelStyle}>Amount</label>
                <input id="tx-amount" type="number" inputMode="decimal" placeholder="0.00" step="0.01" min="0.01" required
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ background: '#f8fafc' }} />
                {errors.amount && <p style={fieldError}>⚠ {errors.amount}</p>}
              </div>
              <div>
                <label htmlFor="tx-type" style={labelStyle}>Type</label>
                <select id="tx-type" value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}
                  style={{ background: '#f8fafc' }}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
                {errors.type && <p style={fieldError}>⚠ {errors.type}</p>}
              </div>
              <div>
                <label htmlFor="tx-category" style={labelStyle}>Category</label>
                <select id="tx-category" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as Category })}
                  style={{ background: '#f8fafc' }}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
                {errors.category && <p style={fieldError}>⚠ {errors.category}</p>}
              </div>
              <div>
                <label htmlFor="tx-date" style={labelStyle}>Date</label>
                <input id="tx-date" type="date" required value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} style={{ background: '#f8fafc' }} />
                {errors.date && <p style={fieldError}>⚠ {errors.date}</p>}
              </div>
              <div style={{ gridColumn: isMobile ? '1 / -1' : '2 / 4' }}>
                <label htmlFor="tx-description" style={labelStyle}>Description (optional)</label>
                <input id="tx-description" placeholder="e.g. Grocery run, Monthly rent..." maxLength={255}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ background: '#f8fafc' }} />
                {errors.description && <p style={fieldError}>⚠ {errors.description}</p>}
              </div>
              {errors.general && (
                <div role="alert" style={{ gridColumn: '1 / -1', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                  {errors.general}
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} style={{
                  padding: '10px 20px', background: saving ? '#a5b4fc' : '#4f46e5',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}>{saving ? 'Saving...' : editId ? 'Save changes' : 'Add transaction'}</button>
                <button type="button" onClick={closeForm} style={{
                  padding: '10px 16px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        {listError && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {listError}
          </div>
        )}

        {/* Transaction list */}
        <section style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {!loaded ? null : transactions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }} aria-hidden="true">📭</div>
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No transactions this month</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Select "+ Add Transaction" to record one</p>
            </div>
          ) : transactions.map((tx, i) => {
            const divider = i < transactions.length - 1;
            const amountColor = tx.type === 'INCOME' ? '#16a34a' : '#ef4444';
            const title = tx.description || tx.category;

            // Card-style rows on mobile, table-style rows on desktop
            return isMobile ? (
              <div key={tx.id} style={{ padding: '14px 16px', borderBottom: divider ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={iconBadge(tx)} aria-hidden="true">{categoryIcon(tx.category)}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{title}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: amountColor }}>{signed(tx)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => handleEdit(tx)} aria-label={`Edit ${title}`}
                    style={{ ...smallButton, flex: 1, padding: '7px', background: '#f1f5f9', color: '#475569', fontSize: 13 }}>Edit</button>
                  <button type="button" onClick={() => handleDelete(tx.id)} aria-label={`Delete ${title}`}
                    style={{ ...smallButton, flex: 1, padding: '7px', background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>Delete</button>
                </div>
              </div>
            ) : (
              <div key={tx.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                padding: '16px 24px', alignItems: 'center',
                borderBottom: divider ? '1px solid #f8fafc' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={iconBadge(tx)} aria-hidden="true">{categoryIcon(tx.category)}</div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{title}</span>
                </div>
                <span style={{
                  display: 'inline-block', width: 'fit-content', padding: '3px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                  background: `${categoryColor(tx.category)}18`,
                  color: categoryColor(tx.category),
                }}>{tx.category}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{tx.date}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: amountColor }}>{signed(tx)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => handleEdit(tx)} aria-label={`Edit ${title}`}
                    style={{ ...smallButton, padding: '5px 12px', background: '#f1f5f9', color: '#475569', fontSize: 12 }}>Edit</button>
                  <button type="button" onClick={() => handleDelete(tx.id)} aria-label={`Delete ${title}`}
                    style={{ ...smallButton, padding: '5px 12px', background: '#fef2f2', color: '#dc2626', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
