import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_BASE = 'http://localhost:3001';

const getRiskStyle = (risk) => {
  const base = { padding: '3px 10px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 700, display: 'inline-block' };
  switch (risk) {
    case 'Low':    return { ...base, background: 'var(--med-green-light)', color: 'var(--med-green)', border: '1px solid var(--med-green-mid)' };
    case 'Medium': return { ...base, background: 'var(--med-amber-light)', color: 'var(--med-amber)', border: '1px solid rgba(217,119,6,0.2)' };
    case 'High':   return { ...base, background: 'var(--med-red-light)',   color: 'var(--med-red)',   border: '1px solid var(--med-red-mid)' };
    default: return base;
  }
};

const getStatusStyle = (status) => {
  const base = { fontSize: '0.82rem', fontWeight: 600 };
  switch (status) {
    case 'Ready to Submit': return { ...base, color: 'var(--med-green)' };
    case 'Approved':         return { ...base, color: 'var(--med-green)' };
    case 'Missing Documents':return { ...base, color: 'var(--med-red)' };
    case 'Under Appeal':     return { ...base, color: 'var(--med-red)' };
    case 'Rejected':         return { ...base, color: 'var(--med-red)' };
    default:                 return { ...base, color: 'var(--med-amber)' };
  }
};

const CHART_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#a855f7', '#f59e0b'];
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

export default function Dashboard({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [hoveredRow, setHoveredRow] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_BASE + '/api/analytics');
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(data.error || 'Failed to load analytics');
          setAnalytics(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  const stats = analytics?.stats;
  const charts = analytics?.charts;
  const claims = analytics?.claims ?? [];

  const statCards = stats
    ? [
        { label: 'Claims This Week',  value: String(stats.claimsThisWeek ?? stats.totalClaims ?? '—'), sub: stats.successRate || 'Real data', color: 'var(--med-red)',   icon: '📋' },
        { label: 'Approved',          value: String(stats.approved ?? '—'),   sub: stats.approvalRate || '—', color: 'var(--med-green)', icon: '✅' },
        { label: 'Needs Attention',   value: String(stats.needsAttention ?? '—'), sub: 'Gaps in docs',     color: 'var(--med-amber)', icon: '⚠️' },
        { label: 'Avg. Process Time', value: stats.avgProcessTime || '—',    sub: 'Automated', color: '#6366f1', icon: '⏱️' },
      ]
    : [
        { label: 'Claims This Week',  value: '—', sub: 'Load from API', color: 'var(--med-red)',   icon: '📋' },
        { label: 'Approved',          value: '—', sub: '—', color: 'var(--med-green)', icon: '✅' },
        { label: 'Needs Attention',   value: '—', sub: '—', color: 'var(--med-amber)', icon: '⚠️' },
        { label: 'Avg. Process Time', value: '—', sub: '—', color: '#6366f1', icon: '⏱️' },
      ];

  const barData = charts?.byInsurer?.labels?.map((label, i) => ({ name: label, claims: charts.byInsurer.data[i] ?? 0 })) ?? [];
  const pieData = charts?.byStatus?.labels?.map((label, i) => ({ name: label, value: charts.byStatus.data[i] ?? 0 })) ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', transition: 'background 0.35s ease' }}>

      <header style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="animate-heartbeat" style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            ClaimAssist <span style={{ color: 'var(--med-red)' }}>Pro</span>
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {[
            { to: '/', label: 'Dashboard', icon: '🏠' },
            { to: '/new-claim', label: 'New Claim', icon: '➕' },
            { to: '/appeals', label: 'Appeals', icon: '⚖️' },
            { to: '/history', label: 'History', icon: '📜' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.45rem 0.85rem', borderRadius: 8,
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
              color: 'var(--text-secondary)',
              transition: 'all 0.18s ease',
              background: 'transparent',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--med-red-light)'; e.currentTarget.style.color = 'var(--med-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              <span className="hidden-mobile">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={toggleTheme} style={{
            width: 38, height: 38, borderRadius: 9,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--med-red)'; e.currentTarget.style.color = 'var(--med-red)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            )}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem',
            }}>AD</div>
            <button onClick={onLogout} style={{
              padding: '0.5rem 0.9rem', borderRadius: 8,
              background: 'var(--med-red-light)', border: '1px solid var(--med-red-mid)',
              color: 'var(--med-red)', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--med-red)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--med-red-light)'; e.currentTarget.style.color = 'var(--med-red)'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>

        <div className="animate-fadeUp" style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Pre-Authorization Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Live data from processed claims · Automated analytics
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'var(--med-red-light)', color: 'var(--med-red)', borderRadius: 8, marginBottom: '1rem' }}>
            {error} — Ensure backend is running on port 3001.
          </div>
        )}

        {loading && !analytics && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics…</div>
        )}

        <div className="animate-fadeUp delay-100" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem', marginBottom: '2rem',
        }}>
          {statCards.map((stat, i) => (
            <div key={i} className={`animate-fadeUp delay-${(i+1)*100}`} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
              padding: '1.2rem 1.4rem', border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)',
              cursor: 'default',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 3,
                background: stat.color, borderRadius: '12px 12px 0 0',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, margin: '0.3rem 0 0.15rem', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{stat.sub}</p>
                </div>
                <span style={{ fontSize: '1.6rem' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {(barData.length > 0 || pieData.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {barData.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Claims by Insurer</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="claims" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Claims" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {pieData.some(d => d.value > 0) && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Approval vs Rejection</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Claims']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="animate-fadeUp delay-200" style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.2rem 1.6rem', borderBottom: '1px solid var(--border-color)',
          }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Claims Queue
            </h2>
            <Link to="/new-claim" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.55rem 1.1rem', borderRadius: 8,
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
              boxShadow: '0 3px 10px rgba(220,38,38,0.3)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(220,38,38,0.3)'; }}
            >
              + New Prior Auth
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['Claim ID', 'Patient', 'Procedure', 'Insurer', 'Date', 'Risk', 'Status', 'Action'].map(col => (
                    <th key={col} style={{
                      padding: '0.8rem 1.2rem', textAlign: 'left',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px',
                      borderBottom: '1px solid var(--border-color)',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 15).map((claim, i) => (
                  <tr key={claim.id}
                    style={{
                      background: hoveredRow === i ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.18s ease',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`animate-fadeUp delay-${Math.min((i+1)*100, 500)}`}
                  >
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--med-red)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {claim.id}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {claim.patient}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {claim.procedure}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {claim.insurer}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {claim.submitted || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span style={getRiskStyle(claim.risk)}>{claim.risk}</span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span style={getStatusStyle(claim.status)}>{claim.status}</span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <Link to={`/claim/${claim.id}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '0.4rem 0.85rem', borderRadius: 6,
                        background: 'var(--med-red-light)', color: 'var(--med-red)',
                        textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700,
                        border: '1px solid var(--med-red-mid)',
                        transition: 'all 0.18s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--med-red)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--med-red-light)'; e.currentTarget.style.color = 'var(--med-red)'; }}
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
