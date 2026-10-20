import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiErrorBody, authApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config';
import { useIsMobile } from '../hooks/useIsMobile';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'general', string>>;

/** Turn the API's error body into messages next to the right field. */
function toFieldErrors(body: Record<string, string> | null): Errors {
  if (!body) return { general: 'Could not reach the server. Check your connection and try again.' };
  switch (body.message) {
    case 'User not found': return { email: 'No account found with this email' };
    case 'Invalid password': return { password: 'Incorrect password' };
    case 'Email already registered': return { email: 'This email is already registered' };
  }
  const { name, email, password, message } = body;
  const errors: Errors = { name, email, password };
  if (message) errors.general = message;
  if (!name && !email && !password && !message) errors.general = 'Something went wrong. Please try again.';
  return errors;
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 } as const;
const errorStyle = { color: '#dc2626', fontSize: 12, marginTop: 4 } as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const isMobile = useIsMobile();

  const [isRegister, setIsRegister] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const finishLogin = (token: string) => {
    signIn(token);
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const { token } = isRegister
        ? await authApi.register(form.email, form.password, form.name)
        : await authApi.login(form.email, form.password);
      finishLogin(token);
    } catch (err) {
      setErrors(toFieldErrors(apiErrorBody(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string | undefined) => {
    if (!credential) {
      setErrors({ general: 'Google sign-in did not return a credential. Try again.' });
      return;
    }
    try {
      const { token } = await authApi.googleLogin(credential);
      finishLogin(token);
    } catch (err) {
      setErrors({ general: apiErrorBody(err)?.message ?? 'Google sign-in failed. Try again.' });
    }
  };

  const borderFor = (field: keyof Errors) => `1px solid ${errors[field] ? '#fca5a5' : '#e2e8f0'}`;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: isMobile ? 'white' : undefined,
    }}>
      {/* Left panel — desktop only */}
      {!isMobile && (
        <div style={{
          width: '45%', maxWidth: 520,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px',
          color: 'white', flexShrink: 0,
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }} aria-hidden="true">✦</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Clarify your finances
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.7, marginBottom: 48 }}>
            Track spending, forecast expenses, and understand your financial habits — all in one place.
          </p>
          {[
            { icon: '📊', text: 'Monthly spending overview' },
            { icon: '🔮', text: 'AI-powered expense forecasting' },
            { icon: '🔒', text: 'Secure JWT authentication' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }} aria-hidden="true">{f.icon}</div>
              <span style={{ fontSize: 14, opacity: 0.9 }}>{f.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        background: isMobile ? 'white' : '#f8fafc',
        padding: isMobile ? '32px 24px' : '40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: 'white',
              }} aria-hidden="true">✦</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Clarify</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Your personal finance companion</p>
            </div>
          )}

          <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
            {isRegister ? 'Start tracking your expenses today' : 'Sign in to your account to continue'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <div>
                <label htmlFor="name" style={labelStyle}>Full name</label>
                <input
                  id="name" autoComplete="name" placeholder="John Smith" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required
                  style={{ background: 'white', border: borderFor('name') }}
                />
                {errors.name && <p style={errorStyle}>⚠ {errors.name}</p>}
              </div>
            )}
            <div>
              <label htmlFor="email" style={labelStyle}>Email address</label>
              <input
                id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                style={{ background: 'white', border: borderFor('email') }}
              />
              {errors.email && <p style={errorStyle}>⚠ {errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <input
                id="password" type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                style={{ background: 'white', border: borderFor('password') }}
              />
              {errors.password && <p style={errorStyle}>⚠ {errors.password}</p>}
            </div>
            {errors.general && (
              <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                {errors.general}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '13px',
              background: loading ? '#a5b4fc' : '#4f46e5',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <GoogleLogin
                  onSuccess={response => { void handleGoogle(response.credential); }}
                  onError={() => setErrors({ general: 'Google sign-in failed. Try again.' })}
                  theme="outline"
                  size="large"
                  text={isRegister ? 'signup_with' : 'signin_with'}
                  shape="rectangular"
                  width="368"
                />
              </div>
            </>
          )}

          <div style={{
            textAlign: 'center', fontSize: 14, color: '#64748b',
            background: isMobile ? '#f8fafc' : 'white',
            borderRadius: 10, padding: '14px',
            border: '1px solid #e2e8f0',
            marginTop: GOOGLE_CLIENT_ID ? 0 : 20,
          }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setErrors({}); }}
              style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', fontSize: 14, padding: 0 }}
            >
              {isRegister ? 'Sign in' : 'Sign up for free'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
