import { useState, CSSProperties, FormEvent } from 'react'

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#0f1117',
};

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 12,
  padding: 40,
  width: 380,
  textAlign: 'center',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #2d3348',
  background: '#1e2030',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  marginBottom: 16,
};

const buttonStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/admin/api/rooms`, {
        headers: { 'X-Admin-Password': password },
      });

      if (res.status === 401) {
        setError('Wrong password');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('admin_password', password);
      onLogin();
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>
          Loopia Admin
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          Enter admin password
        </p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          autoFocus
        />
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}
        <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }} disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
