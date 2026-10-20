import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

const LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Transactions', to: '/transactions' },
];

/** Shared top bar (previously duplicated in each page). */
export default function Navbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  const logout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const linkPadding = isMobile ? '5px 10px' : '6px 14px';
  const fontSize = isMobile ? 13 : 14;

  return (
    <header style={{
      background: 'white', padding: isMobile ? '0 16px' : '0 32px', height: isMobile ? 56 : 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
        <span style={{ fontSize: isMobile ? 18 : 20 }} aria-hidden="true">✦</span>
        <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: '#0f172a' }}>Clarify</span>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              textDecoration: 'none', padding: linkPadding, borderRadius: 8,
              fontSize, fontWeight: 500,
              color: isActive ? '#4f46e5' : '#475569',
              background: isActive ? '#eef2ff' : 'transparent',
            })}
          >{link.label}</NavLink>
        ))}
        <button type="button" onClick={logout} style={{
          marginLeft: isMobile ? 4 : 8, padding: linkPadding, borderRadius: 8,
          border: '1px solid #fecaca', background: '#fef2f2',
          color: '#dc2626', fontSize, fontWeight: 500, cursor: 'pointer',
        }}>Log out</button>
      </nav>
    </header>
  );
}
