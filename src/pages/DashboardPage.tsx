import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, ReferenceLine, Legend
} from 'recharts';
import { statsApi, forecastApi } from '../api/client';
import { MonthlyStats, TrendData } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#f59e0b',
  TRANSPORT: '#3b82f6',
  SHOPPING: '#ec4899',
  BILLS: '#8b5cf6',
  OTHER: '#6b7280',
};

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍔',
  TRANSPORT: '🚗',
  SHOPPING: '🛍️',
  BILLS: '📄',
  OTHER: '📦',
};

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${color}`,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    statsApi.monthly(month).then(res => setStats(res.data));
    statsApi.trend(6).then(res => setTrend(res.data));
    forecastApi.getForecast(3).then(res => setForecast(res.data));
  }, [month]);

  const combinedData = [
    ...trend.map(t => ({ month: t.month, actual: t.totalExpense, forecast: null })),
    ...forecast.map(f => ({ month: f.month, actual: null, forecast: f.predictedExpense })),
  ];

  const topCategory = stats
    ? Object.entries(stats.byCategory).sort((a, b) => (b[1] as number) - (a[1] as number))[0]
    : null;

  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <div style={{
        background: 'white', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Clarify</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Transactions', to: '/transactions' }].map(n => (
            <Link key={n.to} to={n.to} style={{
              textDecoration: 'none', padding: '6px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: '#475569',
            }}>{n.label}</Link>
          ))}
          <button onClick={logout} style={{
            marginLeft: 8, padding: '6px 14px', borderRadius: 8,
            border: '1px solid #fecaca', background: '#fef2f2',
            color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>Log out</button>
        </nav>
      </div>

      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Financial Overview</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Track your income, expenses and forecast</p>
          </div>
          <input
            type="month" value={month}
            onChange={e => setMonth(e.target.value)}
            style={{
              width: 160, padding: '8px 12px', borderRadius: 10,
              border: '1px solid #e2e8f0', fontSize: 13,
              background: 'white', outline: 'none',
            }}
          />
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            label="Total Income" color="#16a34a"
            value={stats ? `$${stats.totalIncome.toFixed(2)}` : '—'}
            sub="This month"
          />
          <StatCard
            label="Total Expenses" color="#ef4444"
            value={stats ? `$${stats.totalExpense.toFixed(2)}` : '—'}
            sub={topCategory ? `Top: ${topCategory[0]}` : 'This month'}
          />
          <StatCard
            label="Net Savings" color="#4f46e5"
            value={stats ? `$${stats.netSavings.toFixed(2)}` : '—'}
            sub={stats && stats.totalIncome > 0
              ? `${((stats.netSavings / stats.totalIncome) * 100).toFixed(0)}% savings rate`
              : 'This month'}
          />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Area chart: income vs expenses */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>6-Month Trend</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Income vs expenses over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Area type="monotone" dataKey="totalIncome" name="Income" stroke="#16a34a" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="totalExpense" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Spending by Category</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Where your money is going</p>
            {!stats || Object.entries(stats.byCategory).length === 0
              ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No expenses this month.</p>
              : Object.entries(stats.byCategory)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([cat, amt]) => {
                    const pct = stats.totalExpense > 0
                      ? Math.min(((amt as number) / stats.totalExpense) * 100, 100)
                      : 0;
                    return (
                      <div key={cat} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat] || '📦'}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>${(amt as number).toFixed(2)}</span>
                          </div>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6 }}>
                          <div style={{
                            width: `${pct}%`, height: 6, borderRadius: 99,
                            background: CATEGORY_COLORS[cat] || '#6b7280',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>

        {/* Forecast chart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Expense Forecast</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Linear regression model · next 3 months predicted</p>
            </div>
            <span style={{
              fontSize: 11, background: '#ede9fe', color: '#6d28d9',
              padding: '4px 12px', borderRadius: 20, fontWeight: 600,
            }}>ML Model</span>
          </div>

          {combinedData.length < 2
            ? <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>
                Add transactions across at least 2 months to see a forecast.
              </p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={combinedData} style={{ marginTop: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val: any, name: any) => [
                      `$${Number(val).toFixed(2)}`,
                      name === 'actual' ? 'Actual' : 'Forecast'
                    ]}
                  />
                  <Legend formatter={(val) => val === 'actual' ? 'Actual Expenses' : 'Forecasted Expenses'} />
                  {trend.length > 0 && (
                    <ReferenceLine
                      x={trend[trend.length - 1].month}
                      stroke="#cbd5e1" strokeDasharray="4 4"
                      label={{ value: 'Today', fontSize: 11, fill: '#94a3b8' }}
                    />
                  )}
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#4f46e5" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#4f46e5' }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>
    </div>
  );
}