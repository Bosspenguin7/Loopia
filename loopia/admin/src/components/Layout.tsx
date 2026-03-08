import { NavLink, Outlet } from 'react-router-dom'
import { CSSProperties } from 'react'

const sidebarStyle: CSSProperties = {
  width: 220,
  background: '#161822',
  borderRight: '1px solid #1e2030',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 0',
};

const logoStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#818cf8',
  padding: '0 20px',
  marginBottom: 32,
  letterSpacing: '-0.02em',
};

const navItemStyle: CSSProperties = {
  display: 'block',
  padding: '10px 20px',
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  borderLeft: '3px solid transparent',
  transition: 'all 0.15s',
};

const activeStyle: CSSProperties = {
  color: '#e2e8f0',
  background: 'rgba(99, 102, 241, 0.1)',
  borderLeftColor: '#818cf8',
};

const contentStyle: CSSProperties = {
  marginLeft: 220,
  padding: 32,
  minHeight: '100vh',
};

const links = [
  { to: '/rooms', label: 'Rooms' },
  { to: '/status', label: 'Live Status' },
  { to: '/moderation', label: 'Moderation' },
  { to: '/users', label: 'Users' },
  { to: '/stats', label: 'Stats' },
  { to: '/quests', label: 'Quest Review' },
];

export default function Layout() {
  return (
    <div>
      <nav style={sidebarStyle}>
        <div style={logoStyle}>Loopia Admin</div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              ...navItemStyle,
              ...(isActive ? activeStyle : {}),
            })}
          >
            {link.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px 20px' }}>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_password');
              window.location.reload();
            }}
            style={{
              background: 'none',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              width: '100%',
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
}
