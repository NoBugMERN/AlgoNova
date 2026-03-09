import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const appeals = [
  { id: 'APL-001', patient: 'Jane Smith', procedure: 'Lumbar Fusion', insurer: 'Aetna', reason: 'Medical Necessity', status: 'In Progress', filed: '2026-03-07', deadline: '2026-03-21' },
  { id: 'APL-002', patient: 'David Kim', procedure: 'Cardiac Stent Placement', insurer: 'Humana', reason: 'Out-of-Network', status: 'Under Review', filed: '2026-03-05', deadline: '2026-03-19' },
  { id: 'APL-003', patient: 'Sarah Lee', procedure: 'Hip Replacement', insurer: 'United', reason: 'Prior Auth Denied', status: 'Won', filed: '2026-02-28', deadline: '2026-03-14' },
];

const statusStyle = (s) => {
  if (s === 'Won')          return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #dcfce7', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
  if (s === 'In Progress')  return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fee2e2', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
  return { color: '#d97706', background: '#fffbeb', border: '1px solid rgba(217,119,6,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700 };
};

export default function AppealCenter() {
  const [hovered, setHovered] = useState(null);

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
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Track and manage denied claim appeals</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="animate-fadeUp" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          <div style={{ padding: '1.2rem 1.6rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Active Appeals ({appeals.length})</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--med-amber-light)', padding: '0.3rem 0.8rem', borderRadius: 20, fontWeight: 600 }}>
              ⚖️ 2 Deadlines this week
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['ID', 'Patient', 'Procedure', 'Insurer', 'Denial Reason', 'Filed', 'Deadline', 'Status'].map(c => (
                    <th key={c} style={{ padding: '0.8rem 1.2rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border-color)' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appeals.map((a, i) => (
                  <tr key={a.id}
                    className={`animate-fadeUp delay-${(i+1)*100}`}
                    style={{ background: hovered === i ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.18s', borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  >
                    <td style={{ padding: '1rem 1.2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--med-red)' }}>{a.id}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.patient}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{a.procedure}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.insurer}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{a.reason}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.filed}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: a.status !== 'Won' ? 'var(--med-amber)' : 'var(--text-muted)', fontWeight: a.status !== 'Won' ? 600 : 400 }}>{a.deadline}</td>
                    <td style={{ padding: '1rem 1.2rem' }}><span style={statusStyle(a.status)}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}