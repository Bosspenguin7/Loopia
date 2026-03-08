import { useState, useEffect, CSSProperties, FormEvent } from 'react'
import { api } from '../services/api'
import type { Room } from '../types'

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #1e2030',
  color: '#64748b',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #1e2030',
};

const btnStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  marginRight: 6,
};

const inputStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #2d3348',
  background: '#1e2030',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  width: '100%',
};

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 20,
  marginBottom: 24,
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    maxClients: 50,
    roomType: 'game_room',
    sceneKey: 'Scene',
    sortOrder: 0,
    isActive: true,
  });

  const fetchRooms = async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (e: any) {
      console.error('Failed to fetch rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, form);
      } else {
        await api.createRoom(form);
      }
      setShowForm(false);
      setEditingRoom(null);
      setForm({ name: '', displayName: '', maxClients: 50, roomType: 'game_room', sceneKey: 'Scene', sortOrder: 0, isActive: true });
      fetchRooms();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      displayName: room.displayName,
      maxClients: room.maxClients,
      roomType: room.roomType,
      sceneKey: room.sceneKey,
      sortOrder: room.sortOrder,
      isActive: room.isActive,
    });
    setShowForm(true);
  };

  const handleDeactivate = async (room: Room) => {
    if (!confirm(`Deactivate "${room.displayName}"?`)) return;
    try {
      await api.deleteRoom(room.id);
      fetchRooms();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleActivate = async (room: Room) => {
    try {
      await api.updateRoom(room.id, { isActive: true });
      fetchRooms();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Permanently delete "${room.displayName}"? This cannot be undone.`)) return;
    try {
      await api.deleteRoomPermanent(room.id);
      fetchRooms();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <p style={{ color: '#64748b' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rooms</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingRoom(null); setForm({ name: '', displayName: '', maxClients: 50, roomType: 'game_room', sceneKey: 'Scene', sortOrder: 0, isActive: true }); }}
          style={{ ...btnStyle, background: '#6366f1', color: '#fff', padding: '8px 16px', fontSize: 13 }}
        >
          {showForm ? 'Cancel' : '+ New Room'}
        </button>
      </div>

      {showForm && (
        <form style={cardStyle} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Name (unique key)</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="room_11" required disabled={!!editingRoom} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Display Name</label>
              <input style={inputStyle} value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder="Room 11" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Max Clients</label>
              <input style={inputStyle} type="number" value={form.maxClients} onChange={e => setForm({...form, maxClients: parseInt(e.target.value) || 50})} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Room Type</label>
              <select style={inputStyle} value={form.roomType} onChange={e => setForm({...form, roomType: e.target.value})}>
                <option value="game_room">game_room</option>
                <option value="cafe_room">cafe_room</option>
                <option value="bears_room">bears_room</option>
                <option value="apartment_room">apartment_room</option>
                <option value="avalabs_room">avalabs_room</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Scene Key</label>
              <input style={inputStyle} value={form.sceneKey} onChange={e => setForm({...form, sceneKey: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Sort Order</label>
              <input style={inputStyle} type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <button type="submit" style={{ ...btnStyle, background: '#6366f1', color: '#fff', padding: '8px 20px', fontSize: 13 }}>
            {editingRoom ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Display</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Max</th>
              <th style={thStyle}>Order</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td style={tdStyle}><code style={{ color: '#818cf8' }}>{room.name}</code></td>
                <td style={tdStyle}>{room.displayName}</td>
                <td style={tdStyle}><code style={{ fontSize: 12 }}>{room.roomType}</code></td>
                <td style={tdStyle}>{room.maxClients}</td>
                <td style={tdStyle}>{room.sortOrder}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: room.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: room.isActive ? '#4ade80' : '#f87171',
                  }}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(room)} style={{ ...btnStyle, background: '#1e2030', color: '#94a3b8', border: '1px solid #2d3348' }}>
                    Edit
                  </button>
                  {room.isActive ? (
                    <button onClick={() => handleDeactivate(room)} style={{ ...btnStyle, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                      Deactivate
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleActivate(room)} style={{ ...btnStyle, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                        Activate
                      </button>
                      <button onClick={() => handleDelete(room)} style={{ ...btnStyle, background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
