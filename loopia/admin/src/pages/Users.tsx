import { useState, useEffect, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { UserListItem } from '../types'

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 20,
};

const inputStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #1e2030',
  borderRadius: 6,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 14,
};

const btnStyle: CSSProperties = {
  background: '#818cf8',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  borderBottom: '1px solid #1e2030',
};

const tdStyle: CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid #1e2030',
};

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await api.getUsers({ page: p, limit: 20, q: q || undefined });
      setUsers(res.users);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, '');
  }, []);

  const handleSearch = () => {
    setSearchQuery(query);
    fetchUsers(1, query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setSearchQuery('');
    fetchUsers(1, '');
  };

  const goPage = (p: number) => {
    fetchUsers(p, searchQuery);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Users</h1>

      {/* Search */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, width: 280 }}
            placeholder="Search by name or ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button style={btnStyle} onClick={handleSearch} disabled={loading}>
            Search
          </button>
          {searchQuery && (
            <button
              style={{ ...btnStyle, background: '#334155' }}
              onClick={handleClear}
            >
              Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
            {total} user{total !== 1 ? 's' : ''} total
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>Loading...</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>No users found.</p>
        ) : (
          <>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Level</th>
                  <th style={thStyle}>Loopi</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/users/${u.id}`)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e2030')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...tdStyle, color: '#64748b' }}>#{u.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{u.displayName || `Guest${u.id}`}</td>
                    <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 600 }}>{u.level}</td>
                    <td style={{ ...tdStyle, color: '#4ade80' }}>{u.loopi}</td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>
                      {new Date(u.lastSeenAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <button
                  style={{ ...btnStyle, background: page <= 1 ? '#1e2030' : '#334155', padding: '6px 16px', fontSize: 13 }}
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  style={{ ...btnStyle, background: page >= totalPages ? '#1e2030' : '#334155', padding: '6px 16px', fontSize: 13 }}
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
