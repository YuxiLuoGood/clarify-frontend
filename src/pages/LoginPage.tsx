import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = isRegister
        ? await authApi.register(form.email, form.password, form.name)
        : await authApi.login(form.email, form.password);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        // Field-level errors from @Valid (e.g. { email: "must be a valid email" })
        // or specific message from AuthService (e.g. { message: "Invalid password" })
        if (data.message === 'User not found') {
          setErrors({ email: 'No account found with this email' });
        } else if (data.message === 'Invalid password') {
          setErrors({ password: 'Incorrect password' });
        } else if (data.message === 'Email already registered') {
          setErrors({ email: 'This email is already registered' });
        } else {
          // @Valid field errors like { email: "must be a well-formed email address" }
          setErrors(data);
        }
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'clamp(0px, 45vw, 520px) 1fr',
    }}>
      {/* Left panel */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        color: 'white',
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>✦</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
          Clarify your finances
        </h1>
        <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.7, marginBottom: 48 }}>
          Track spending, forecast expenses, and understand your financial habits — all in one place.
        </p>

        {/* Feature list */}
        {[
          { icon: '📊', text: 'Monthly spending overview' },
          { icon: '🔮', text: 'AI-powered expense forecasting' },
          { icon: '🔒', text: 'Secure JWT authentication' },
        ].map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>{f.icon}</div>
            <span style={{ fontSize: 14, opacity: 0.9 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
            {isRegister
              ? 'Start tracking your expenses today'
              : 'Sign in to your account to continue'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Full name</label>
                <input
                  placeholder="John Smith"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ background: 'white', border: `1px solid ${errors.name ? '#fca5a5' : '#e2e8f0'}` }}
                />
                {errors.name && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠ {errors.name}</p>}
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                style={{ background: 'white', border: `1px solid ${errors.email ? '#fca5a5' : '#e2e8f0'}` }}
              />
              {errors.email && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠ {errors.email}</p>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ background: 'white', border: `1px solid ${errors.password ? '#fca5a5' : '#e2e8f0'}` }}
              />
              {errors.password && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</p>}
            </div>
            {errors.general && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: '12px',
                background: loading ? '#a5b4fc' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Toggle */}
          <div style={{
            textAlign: 'center', fontSize: 14, color: '#64748b',
            background: 'white', borderRadius: 10, padding: '14px',
            border: '1px solid #e2e8f0',
          }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              onClick={() => { setIsRegister(!isRegister); setErrors({}); }}
              style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}
            >
              {isRegister ? 'Sign in' : 'Sign up for free'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}