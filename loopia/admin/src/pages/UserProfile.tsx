import { useState, useEffect, CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { UserProfile as UserProfileType } from '../types'

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
  width: '100%',
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

const labelStyle: CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  fontWeight: 600,
};

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Grant form
  const [currency] = useState<'loopi'>('loopi');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [grantMsg, setGrantMsg] = useState('');

  const fetchUser = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUserProfile(Number(id));
      setUser(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const grantCurrency = async () => {
    if (!user) return;
    const amt = parseInt(amount);
    if (isNaN(amt) || amt === 0) {
      setGrantMsg('Invalid amount');
      return;
    }
    setGrantMsg('');
    try {
      await api.grantCurrency({
        guestId: user.id,
        currency,
        amount: amt,
        reason: reason || undefined,
      });
      setGrantMsg(`${amt > 0 ? '+' : ''}${amt} Loopi granted!`);
      setAmount('');
      setReason('');
      await fetchUser();
    } catch (e: any) {
      setGrantMsg(e.message || 'Grant failed');
    }
  };

  if (loading) {
    return (
      <div>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <button
          onClick={() => navigate('/users')}
          style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, marginBottom: 16 }}
        >
          &larr; Back to Users
        </button>
        <p style={{ color: '#ef4444' }}>{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/users')}
        style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, marginBottom: 16 }}
      >
        &larr; Back to Users
      </button>

      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        {user.displayName || `Guest${user.id}`}
        <span style={{ color: '#64748b', fontSize: 14, fontWeight: 400, marginLeft: 8 }}>#{user.id}</span>
      </h1>

      {/* Profile card */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          <div>
            <div style={labelStyle}>Display Name</div>
            <div style={{ marginTop: 4 }}>{user.displayName || '-'}</div>
          </div>
          <div>
            <div style={labelStyle}>Motto</div>
            <div style={{ marginTop: 4 }}>{user.motto || '-'}</div>
          </div>
          <div>
            <div style={labelStyle}>Level</div>
            <div style={{ marginTop: 4, color: '#fbbf24', fontWeight: 700 }}>{user.level}</div>
          </div>
          <div>
            <div style={labelStyle}>Respects</div>
            <div style={{ marginTop: 4 }}>{user.respectsReceived}</div>
          </div>
          <div>
            <div style={labelStyle}>Created</div>
            <div style={{ marginTop: 4 }}>{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={labelStyle}>Last Seen</div>
            <div style={{ marginTop: 4 }}>{new Date(user.lastSeenAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Economy cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Balances */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Economy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{user.loopi}</div>
              <div style={labelStyle}>Loopi</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{user.xp}</div>
              <div style={labelStyle}>XP</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#818cf8' }}>{user.loginStreak}</div>
              <div style={labelStyle}>Streak</div>
            </div>
          </div>
          {user.lastLoginRewardAt && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              Last reward: {new Date(user.lastLoginRewardAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Grant Form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Grant Currency</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: '#4ade80', fontWeight: 600 }}>
              Loopi
            </div>
            <input
              style={inputStyle}
              type="number"
              placeholder="Amount (negative to deduct)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Reason (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <button style={btnStyle} onClick={grantCurrency}>Grant</button>
            {grantMsg && (
              <p style={{
                fontSize: 13,
                color: grantMsg.includes('granted') ? '#4ade80' : '#ef4444',
              }}>
                {grantMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Transactions</h2>
        {user.transactions.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>No transactions yet.</p>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Currency</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {user.transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ padding: '8px', color: '#94a3b8' }}>
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(74, 222, 128, 0.15)',
                      color: '#4ade80',
                    }}>
                      {tx.currency === 'duckets' ? 'loopi' : tx.currency}
                    </span>
                  </td>
                  <td style={{
                    padding: '8px',
                    fontWeight: 600,
                    color: tx.amount > 0 ? '#4ade80' : '#ef4444',
                  }}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td style={{ padding: '8px', color: '#94a3b8' }}>{tx.reason}</td>
                  <td style={{ padding: '8px' }}>{tx.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
