import { useState, useEffect, CSSProperties } from 'react'
import { api } from '../services/api'
import type { Stats as StatsType } from '../types'

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 20,
};

const statCardStyle: CSSProperties = {
  ...cardStyle,
  textAlign: 'center',
};

const statValue: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: '#818cf8',
  marginBottom: 4,
};

const statLabel: CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
};

export default function Stats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) return <p style={{ color: '#64748b' }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Stats</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={statCardStyle}>
          <div style={statValue}>{stats.onlineCount}</div>
          <div style={statLabel}>Online Now</div>
        </div>
        <div style={statCardStyle}>
          <div style={statValue}>{stats.currentActive}</div>
          <div style={statLabel}>Active Sessions</div>
        </div>
        <div style={statCardStyle}>
          <div style={statValue}>{stats.todaySessions}</div>
          <div style={statLabel}>Today's Joins</div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Sessions</h2>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Player</th>
              <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Room</th>
              <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>IP</th>
              <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Joined</th>
              <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentSessions.map(session => (
              <tr key={session.id}>
                <td style={{ padding: '8px' }}>{session.name}</td>
                <td style={{ padding: '8px' }}><code style={{ fontSize: 11, color: '#818cf8' }}>{session.roomName}</code></td>
                <td style={{ padding: '8px', color: '#64748b' }}><code style={{ fontSize: 11 }}>{session.ip || '-'}</code></td>
                <td style={{ padding: '8px', color: '#94a3b8' }}>{new Date(session.joinedAt).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: session.leftAt ? 'rgba(100, 116, 139, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: session.leftAt ? '#64748b' : '#4ade80',
                  }}>
                    {session.leftAt ? 'Left' : 'Online'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
