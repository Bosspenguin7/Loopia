import { useState, useEffect, CSSProperties, FormEvent } from 'react'
import { api } from '../services/api'
import type { BanEntry, RoomStatus, PlayerInfo } from '../types'

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 20,
  marginBottom: 24,
};

const inputStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #2d3348',
  background: '#1e2030',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
};

const btnStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 16,
};

export default function Moderation() {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [banForm, setBanForm] = useState({ identifier: '', reason: '', expiresAt: '' });
  const [msgForm, setMsgForm] = useState({ message: '', targetRoom: '' });

  const fetchData = async () => {
    try {
      const [statusData, bansData] = await Promise.all([api.getStatus(), api.getBans()]);
      setRooms(statusData);
      setBans(bansData);
    } catch (e) {
      console.error('Failed to fetch moderation data:', e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadPlayers = async (roomName: string) => {
    setSelectedRoom(roomName);
    if (!roomName) { setPlayers([]); return; }
    try {
      const data = await api.getPlayers(roomName);
      setPlayers(data);
    } catch (e) {
      console.error('Failed to fetch players:', e);
    }
  };

  const handleKick = async (player: PlayerInfo) => {
    if (!confirm(`Kick "${player.name}"?`)) return;
    try {
      await api.kick(player.sessionId, player.roomId);
      loadPlayers(selectedRoom);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBan = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.addBan({
        identifier: banForm.identifier,
        reason: banForm.reason,
        expiresAt: banForm.expiresAt || null,
      });
      setBanForm({ identifier: '', reason: '', expiresAt: '' });
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUnban = async (id: number) => {
    if (!confirm('Remove this ban?')) return;
    try {
      await api.removeBan(id);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSystemMessage = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.sendSystemMessage({
        message: msgForm.message,
        targetRoom: msgForm.targetRoom || null,
      });
      setMsgForm({ message: '', targetRoom: '' });
      alert('System message sent!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Moderation</h1>

      {/* Kick Players */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Kick Player</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <select
            style={{ ...inputStyle, width: 200 }}
            value={selectedRoom}
            onChange={e => loadPlayers(e.target.value)}
          >
            <option value="">Select room...</option>
            {rooms.filter(r => r.clients > 0).map(r => (
              <option key={r.name} value={r.name}>{r.displayName} ({r.clients})</option>
            ))}
          </select>
        </div>
        {players.length > 0 && (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Session</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.sessionId}>
                  <td style={{ padding: '8px' }}>{p.name}</td>
                  <td style={{ padding: '8px' }}><code style={{ fontSize: 11, color: '#818cf8' }}>{p.sessionId.slice(0, 12)}</code></td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <button onClick={() => handleKick(p)} style={{ ...btnStyle, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                      Kick
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selectedRoom && players.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 13 }}>No players in this room</p>
        )}
      </div>

      {/* Ban Management */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Ban Management</h2>
        <form onSubmit={handleBan} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, width: 180 }}
            placeholder="IP Address"
            value={banForm.identifier}
            onChange={e => setBanForm({...banForm, identifier: e.target.value})}
            required
          />
          <input
            style={{ ...inputStyle, width: 200 }}
            placeholder="Reason (optional)"
            value={banForm.reason}
            onChange={e => setBanForm({...banForm, reason: e.target.value})}
          />
          <input
            style={{ ...inputStyle, width: 180 }}
            type="datetime-local"
            title="Expires at (empty = permanent)"
            value={banForm.expiresAt}
            onChange={e => setBanForm({...banForm, expiresAt: e.target.value})}
          />
          <button type="submit" style={{ ...btnStyle, background: '#ef4444', color: '#fff' }}>
            Add Ban
          </button>
        </form>

        {bans.length > 0 ? (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>IP</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Reason</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Expires</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #1e2030' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bans.map(ban => (
                <tr key={ban.id}>
                  <td style={{ padding: '8px' }}><code>{ban.identifier}</code></td>
                  <td style={{ padding: '8px', color: '#94a3b8' }}>{ban.reason || '-'}</td>
                  <td style={{ padding: '8px', color: '#94a3b8' }}>
                    {ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : 'Permanent'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <button onClick={() => handleUnban(ban.id)} style={{ ...btnStyle, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#64748b', fontSize: 13 }}>No active bans</p>
        )}
      </div>

      {/* System Message */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>System Message</h2>
        <form onSubmit={handleSystemMessage} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 250 }}
            placeholder="Message to broadcast..."
            value={msgForm.message}
            onChange={e => setMsgForm({...msgForm, message: e.target.value})}
            required
          />
          <select
            style={{ ...inputStyle, width: 180 }}
            value={msgForm.targetRoom}
            onChange={e => setMsgForm({...msgForm, targetRoom: e.target.value})}
          >
            <option value="">All Rooms</option>
            {rooms.map(r => (
              <option key={r.name} value={r.name}>{r.displayName}</option>
            ))}
          </select>
          <button type="submit" style={{ ...btnStyle, background: '#6366f1', color: '#fff' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
