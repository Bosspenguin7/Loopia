import { useState, useEffect, CSSProperties } from 'react'
import { api } from '../services/api'
import type { RoomStatus, PlayerInfo } from '../types'

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 16,
  marginBottom: 12,
};

const badgeStyle = (clients: number, max: number): CSSProperties => ({
  padding: '3px 10px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  background: clients > 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.15)',
  color: clients > 0 ? '#a5b4fc' : '#64748b',
});

export default function LiveStatus() {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerInfo[]>>({});
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await api.getStatus();
      setRooms(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleRoom = async (roomName: string) => {
    if (expandedRoom === roomName) {
      setExpandedRoom(null);
      return;
    }
    setExpandedRoom(roomName);
    try {
      const data = await api.getPlayers(roomName);
      setPlayers(prev => ({ ...prev, [roomName]: data }));
    } catch (e) {
      console.error('Failed to fetch players:', e);
    }
  };

  const totalOnline = rooms.reduce((sum, r) => sum + r.clients, 0);

  if (loading) return <p style={{ color: '#64748b' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Live Status</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: totalOnline > 0 ? '#4ade80' : '#64748b',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            {totalOnline} online
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rooms.map(room => (
          <div key={room.name} style={cardStyle}>
            <div
              onClick={() => toggleRoom(room.name)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, marginRight: 10 }}>{room.displayName}</span>
                <code style={{ fontSize: 12, color: '#64748b' }}>{room.name}</code>
              </div>
              <span style={badgeStyle(room.clients, room.maxClients)}>
                {room.clients} / {room.maxClients}
              </span>
            </div>

            {expandedRoom === room.name && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e2030' }}>
                {(!players[room.name] || players[room.name].length === 0) ? (
                  <p style={{ color: '#64748b', fontSize: 13 }}>No players</p>
                ) : (
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Session ID</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players[room.name].map(p => (
                        <tr key={p.sessionId}>
                          <td style={{ padding: '6px 8px' }}>{p.name}</td>
                          <td style={{ padding: '6px 8px' }}><code style={{ fontSize: 11, color: '#818cf8' }}>{p.sessionId.slice(0, 12)}...</code></td>
                          <td style={{ padding: '6px 8px', color: '#64748b' }}>{Math.round(p.x)}, {Math.round(p.y)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
