import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:3001';

const statusStyle = (s) => {
  if (s === 'Won' || s === 'approved') return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #dcfce7', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
  if (s === 'In Progress' || s === 'draft') return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fee2e2', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
  return { color: '#d97706', background: '#fffbeb', border: '1px solid rgba(217,119,6,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
};

export default function AppealCenter() {
  const [hovered, setHovered] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectForm, setRejectForm] = useState({ claimId: '', patientId: '', rejectionReason: '', rejectionCategory: 'MISSING_DOCUMENT' });
  const [submitting, setSubmitting] = useState(false);
  const [monitorChecking, setMonitorChecking] = useState(false);
  const [monitorResult, setMonitorResult] = useState(null);

  const fetchAppeals = async () => {
    try {
      const res = await fetch(API_BASE + '/api/appeals');
      const data = await res.json();
      if (data.appeals) setAppeals(data.appeals);
    } catch (_e) {}
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAppeals();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCheckRejections = async () => {
    setMonitorChecking(true);
    setMonitorResult(null);
    try {
      const res = await fetch(API_BASE + '/api/agent/check-rejections');
      const data = await res.json();
      setMonitorResult(data);
      await fetchAppeals();
    } catch (e) {
      setMonitorResult({ success: false, error: e.message });
    } finally {
      setMonitorChecking(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectForm.claimId || !rejectForm.rejectionReason) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + '/api/appeals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectForm),
      });
      const data = await res.json();
      if (data.success && data.appeal) {
        setAppeals(prev => [data.appeal, ...prev]);
        setRejectForm({ claimId: '', patientId: '', rejectionReason: '', rejectionCategory: 'MISSING_DOCUMENT' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', transition: 'background 0.35s ease' }}>
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Link to="/" style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1rem',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--med-red)'; e.currentTarget.style.color='var(--med-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-secondary)'; }}
        >←</Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Appeal Center</h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Agent monitors insurer responses; rejections → auto actions &amp; appeal draft</p>
        </div>
        <button type="button" onClick={handleCheckRejections} disabled={monitorChecking} style={{
          padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--med-red)', color: '#fff', border: 'none', fontWeight: 600,
          cursor: monitorChecking ? 'wait' : 'pointer', fontSize: '0.85rem',
        }}>
          {monitorChecking ? 'Checking…' : '🔍 Check for new rejections'}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
        {monitorResult && (
          <div style={{
            marginBottom: '1rem', padding: '1rem', borderRadius: 8,
            background: monitorResult.success ? 'var(--med-green-light)' : 'var(--med-red-light)',
            color: monitorResult.success ? 'var(--med-green)' : 'var(--med-red)',
            border: `1px solid ${monitorResult.success ? 'var(--med-green-mid)' : 'var(--med-red-mid)'}`,
          }}>
            {monitorResult.success ? (
              <>
                {monitorResult.message}
                {monitorResult.newAppeals && monitorResult.newAppeals.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                    {monitorResult.newAppeals.length} new rejection(s) → appeal draft(s) created. Review below.
                  </div>
                )}
              </>
            ) : (
              monitorResult.error || monitorResult.message || 'Monitor check failed.'
            )}
          </div>
        )}


        <div className="animate-fadeUp" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
          padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Record rejection (bonus)</h3>
          <form onSubmit={handleRejectSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Claim ID</span>
              <input value={rejectForm.claimId} onChange={e => setRejectForm(prev => ({ ...prev, claimId: e.target.value }))} placeholder="CLM_123" style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient ID</span>
              <input value={rejectForm.patientId} onChange={e => setRejectForm(prev => ({ ...prev, patientId: e.target.value }))} placeholder="PAT_001" style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </label>
            <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rejection reason</span>
              <input value={rejectForm.rejectionReason} onChange={e => setRejectForm(prev => ({ ...prev, rejectionReason: e.target.value }))} placeholder="Missing Certificate of Medical Necessity" required style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</span>
              <select value={rejectForm.rejectionCategory} onChange={e => setRejectForm(prev => ({ ...prev, rejectionCategory: e.target.value }))} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <option value="MISSING_DOCUMENT">Missing document</option>
                <option value="INCORRECT_CODING">Incorrect coding</option>
                <option value="POLICY_MISMATCH">Policy mismatch</option>
                <option value="STALE_DOCUMENT">Stale document</option>
                <option value="INVALID_DOCUMENT">Invalid document</option>
              </select>
            </label>
            <button type="submit" disabled={submitting} style={{ padding: '0.55rem 1rem', borderRadius: 8, background: 'var(--med-red)', color: '#fff', border: 'none', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>
              {submitting ? 'Creating…' : 'Create appeal draft'}
            </button>
          </form>
        </div>

        <div className="animate-fadeUp" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          <div style={{ padding: '1.2rem 1.6rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Appeals ({appeals.length})</h2>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['ID', 'Claim', 'Patient', 'Reason', 'Category', 'Filed', 'Status'].map(c => (
                      <th key={c} style={{ padding: '0.8rem 1.2rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border-color)' }}>{c}</th>
                    ))}
                    <th style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid var(--border-color)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((a, i) => (
                    <tr key={a.id}
                      style={{ background: hovered === i ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.18s', borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                    >
                      <td style={{ padding: '1rem 1.2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--med-red)' }}>{a.id}</td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{a.claimId}</td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.patientId}</td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 200 }} title={a.rejectionReason}>{String(a.rejectionReason).slice(0, 40)}…</td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.rejectionCategory}</td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(a.createdAt)}</td>
                      <td style={{ padding: '1rem 1.2rem' }}><span style={statusStyle(a.status)}>{a.status}</span></td>
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <button type="button" onClick={() => setSelected(selected?.id === a.id ? null : a)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.78rem' }}>View letter</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selected && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <h4 style={{ margin: '0 0 0.5rem' }}>Recommended actions</h4>
              <ul style={{ margin: '0 0 1rem', paddingLeft: '1.2rem' }}>
                {(selected.recommendedActions || []).map((act, i) => <li key={i} style={{ marginBottom: 4 }}>{act}</li>)}
              </ul>
              <h4 style={{ margin: '0 0 0.5rem' }}>Appeal letter (draft)</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', margin: 0, padding: '1rem', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>{selected.appealLetter}</pre>
              <button type="button" onClick={() => setSelected(null)} style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer' }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
