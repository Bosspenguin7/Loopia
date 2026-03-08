import { useState, useEffect, CSSProperties } from 'react'
import { api } from '../services/api'

const cardStyle: CSSProperties = {
  background: '#161822',
  border: '1px solid #1e2030',
  borderRadius: 10,
  padding: 20,
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

const btnStyle: CSSProperties = {
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

interface Submission {
  id: number;
  guestId: number;
  questId: number;
  linkUrl: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  guest: { id: number; displayName: string };
  quest: { id: number; name: string; questKey: string };
}

export default function QuestReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getQuestSubmissions(filter || undefined);
      setSubmissions(data);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this submission and grant rewards?')) return;
    try {
      await api.approveQuestSubmission(id, 'admin');
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    const notes = prompt('Rejection reason (optional):');
    if (notes === null) return;
    try {
      await api.rejectQuestSubmission(id, 'admin', notes || undefined);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: 'rgba(250,204,21,0.15)', color: '#facc15' },
      approved: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
      rejected: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
    };
    const c = colors[status] || colors.pending;
    return (
      <span style={{
        background: c.bg, color: c.color,
        padding: '3px 10px', borderRadius: 12,
        fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Quest Review</h1>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['pending', 'approved', 'rejected', ''].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...btnStyle,
              background: filter === f ? '#818cf8' : '#1e2030',
              color: filter === f ? '#fff' : '#94a3b8',
            }}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading...</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No submissions found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Quest</th>
                <th style={thStyle}>Link</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{s.guest.displayName}</span>
                    <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>#{s.guest.id}</span>
                  </td>
                  <td style={tdStyle}>{s.quest.name}</td>
                  <td style={tdStyle}>
                    <a
                      href={s.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, wordBreak: 'break-all' }}
                    >
                      {s.linkUrl.length > 50 ? s.linkUrl.slice(0, 50) + '...' : s.linkUrl}
                    </a>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#94a3b8' }}>
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td style={tdStyle}>{statusBadge(s.status)}</td>
                  <td style={tdStyle}>
                    {s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleApprove(s.id)}
                          style={{ ...btnStyle, background: '#34d399', color: '#fff' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(s.id)}
                          style={{ ...btnStyle, background: '#f87171', color: '#fff' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {s.status !== 'pending' && s.reviewedBy && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        by {s.reviewedBy}
                        {s.reviewNotes && ` - ${s.reviewNotes}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
