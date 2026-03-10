import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const history = [
  { id: 'REQ-098', patient: 'Alice Brown',   procedure: 'Knee Replacement',       status: 'Approved', date: '2026-02-28', amount: '$24,500', insurer: 'BlueCross' },
  { id: 'REQ-097', patient: 'James Wilson',  procedure: 'Spinal Cord Stimulator', status: 'Denied',   date: '2026-02-25', amount: '$38,000', insurer: 'Aetna' },
  { id: 'REQ-096', patient: 'Priya Patel',   procedure: 'Hysterectomy',           status: 'Approved', date: '2026-02-20', amount: '$18,200', insurer: 'United' },
  { id: 'REQ-095', patient: 'Carlos Ruiz',   procedure: 'LASIK Eye Surgery',      status: 'Denied',   date: '2026-02-18', amount: '$4,200',  insurer: 'Cigna' },
  { id: 'REQ-094', patient: 'Nadia Hassan',  procedure: 'Tonsillectomy',          status: 'Approved', date: '2026-02-15', amount: '$8,000',  insurer: 'Humana' },
];

export default function History() {
  const [filter, setFilter] = useState('All');
  const [hovered, setHovered] = useState(null);

  const filtered = filter === 'All' ? history : history.filter(h => h.status === filter);

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
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Claim History</h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Past submitted and resolved claims</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
        {/* Summary cards */}
        <div className="animate-fadeUp" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Submitted', value: history.length, color: 'var(--med-red)', icon: '📋' },
            { label: 'Approved', value: history.filter(h=>h.status==='Approved').length, color: 'var(--med-green)', icon: '✅' },
            { label: 'Denied', value: history.filter(h=>h.status==='Denied').length, color: 'var(--med-amber)', icon: '❌' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)', padding: '1.2rem 1.4rem',
              boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="animate-fadeUp delay-100" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.6rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
            {['All', 'Approved', 'Denied'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '0.45rem 1rem', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${filter === f ? (f === 'Approved' ? 'var(--med-green)' : f === 'Denied' ? 'var(--med-red)' : 'var(--border-color)') : 'var(--border-color)'}`,
                background: filter === f ? (f === 'Approved' ? 'var(--med-green-light)' : f === 'Denied' ? 'var(--med-red-light)' : 'var(--bg-secondary)') : 'transparent',
                color: filter === f ? (f === 'Approved' ? 'var(--med-green)' : f === 'Denied' ? 'var(--med-red)' : 'var(--text-primary)') : 'var(--text-secondary)',
                fontSize: '0.83rem', fontWeight: 600, transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}>{f}</button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['ID', 'Patient', 'Procedure', 'Insurer', 'Amount', 'Date', 'Status'].map(c => (
                    <th key={c} style={{ padding: '0.8rem 1.2rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border-color)' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, i) => (
                  <tr key={h.id}
                    className={`animate-fadeUp delay-${Math.min((i+1)*100, 500)}`}
                    style={{ background: hovered === i ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.18s', borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  >
                    <td style={{ padding: '1rem 1.2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--med-red)' }}>{h.id}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{h.patient}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{h.procedure}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{h.insurer}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{h.amount}</td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.date}</td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700,
                        background: h.status === 'Approved' ? 'var(--med-green-light)' : 'var(--med-red-light)',
                        color: h.status === 'Approved' ? 'var(--med-green)' : 'var(--med-red)',
                        border: `1px solid ${h.status === 'Approved' ? 'var(--med-green-mid)' : 'var(--med-red-mid)'}`,
                      }}>{h.status}</span>
                    </td>
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