import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { forecastApi, statsApi } from '../api/client';
import Navbar from '../components/Navbar';
import { categoryColor, categoryIcon } from '../categories';
import { currentMonth } from '../lib/dates';
import type { ForecastPoint, MonthlyStats, TrendData } from '../types';

interface ChartPoint {
  month: string;
  actual: number | null;
  forecast: number | null;
}

const LOAD_ERROR = 'Could not load your data. Check that the server is reachable, then refresh.';

const card = { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const tooltipStyle = { borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const axisTick = { fontSize: 11, fill: '#94a3b8' };

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

const money = (n: number) => `$${n.toFixed(2)}`;

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Monthly stats follow the month picker; `ignore` drops stale responses
  // when the month changes faster than the server answers.
  useEffect(() => {
    let ignore = false;
    statsApi.monthly(month)
      .then(data => { if (!ignore) setStats(data); })
      .catch(() => { if (!ignore) setError(LOAD_ERROR); });
    return () => { ignore = true; };
  }, [month]);

  // Trend and forecast don't depend on the selected month: load once.
  useEffect(() => {
    let ignore = false;
    Promise.all([statsApi.trend(6), forecastApi.getForecast(3)])
      .then(([t, f]) => { if (!ignore) { setTrend(t); setForecast(f); } })
      .catch(() => { if (!ignore) setError(LOAD_ERROR); });
    return () => { ignore = true; };
  }, []);

  const combinedData = useMemo<ChartPoint[]>(() => [
    ...trend.map(t => ({ month: t.month, actual: t.totalExpense, forecast: null })),
    ...forecast.map(f => ({ month: f.month, actual: null, forecast: f.predictedExpense })),
  ], [trend, forecast]);

  const categories = useMemo(
    () => (stats ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]) : []),
    [stats],
  );
  const topCategory = categories[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '32px auto', padding: '0 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Financial Overview</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Track your income, expenses and forecast</p>
          </div>
          <input
            type="month" value={month} aria-label="Month"
            onChange={e => e.target.value && setMonth(e.target.value)}
            style={{
              width: 160, padding: '8px 12px', borderRadius: 10,
              border: '1px solid #e2e8f0', fontSize: 13,
              background: 'white', outline: 'none',
            }}
          />
        </div>

        {error && (
          <div role="alert" style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {/* Stat cards */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            label="Total Income" color="#16a34a"
            value={stats ? money(stats.totalIncome) : '—'}
            sub="This month"
          />
          <StatCard
            label="Total Expenses" color="#ef4444"
            value={stats ? money(stats.totalExpense) : '—'}
            sub={topCategory ? `Top: ${topCategory[0]}` : 'This month'}
          />
          <StatCard
            label="Net Savings" color="#4f46e5"
            value={stats ? money(stats.netSavings) : '—'}
            sub={stats && stats.totalIncome > 0
              ? `${((stats.netSavings / stats.totalIncome) * 100).toFixed(0)}% savings rate`
              : 'This month'}
          />
        </div>

        {/* Charts row */}
        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Income vs expenses */}
          <section style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>6-Month Trend</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Income vs expenses over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="totalIncome" name="Income" stroke="#16a34a" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="totalExpense" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Category breakdown */}
          <section style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Spending by Category</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Where your money is going</p>
            {!stats || categories.length === 0
              ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No expenses this month.</p>
              : categories.map(([cat, amt]) => {
                  const pct = stats.totalExpense > 0 ? Math.min((amt / stats.totalExpense) * 100, 100) : 0;
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }} aria-hidden="true">{categoryIcon(cat)}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{pct.toFixed(0)}%</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{money(amt)}</span>
                        </div>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6 }}>
                        <div style={{
                          width: `${pct}%`, height: 6, borderRadius: 99,
                          background: categoryColor(cat),
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  );
                })
            }
          </section>
        </div>

        {/* Forecast chart */}
        <section style={card}>
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
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: unknown, name: unknown) => [
                      `$${Number(val).toFixed(2)}`,
                      name === 'actual' ? 'Actual' : 'Forecast',
                    ]}
                  />
                  <Legend formatter={(val: unknown) => (val === 'actual' ? 'Actual Expenses' : 'Forecasted Expenses')} />
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
        </section>
      </main>
    </div>
  );
}
