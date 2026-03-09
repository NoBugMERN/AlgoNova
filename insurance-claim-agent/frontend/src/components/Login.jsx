import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin();
      navigate('/');
    }, 900);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      display: 'flex',
      transition: 'background 0.35s ease',
    }}>
      {/* Left Panel – Branding */}
      <div className="animate-slideInLeft" style={{
        display: 'none',
        flex: '0 0 45%',
        background: 'linear-gradient(155deg, #b91c1c 0%, #dc2626 40%, #991b1b 100%)',
        padding: '3rem',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
      ref={el => el && (el.style.display = window.innerWidth >= 768 ? 'flex' : 'none')
      }>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)',
        }} />
        {/* Cross symbol */}
        <div style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)' }}>
          <div className="animate-heartbeat" style={{
            width: '200px', height: '200px', opacity: 0.07,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='white'%3E%3Crect x='35' y='10' width='30' height='80' rx='8'/%3E%3Crect x='10' y='35' width='80' height='30' rx='8'/%3E%3C/svg%3E")`,
            backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
              ClaimAssist Pro
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 1rem' }}>
            Smarter Claims.<br />Fewer Rejections.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
            AI-assisted pre-authorization that auto-parses surgeon notes, 
            identifies rejection risks, and assembles evidence-based claim packages.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: '✓', label: '98.2% first-pass approval rate' },
            { icon: '✓', label: 'HIPAA-compliant end-to-end' },
            { icon: '✓', label: 'Avg. 4-min claim assembly time' },
          ].map((item, i) => (
            <div key={i} className={`animate-fadeUp delay-${(i+1)*100}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '0.6rem',
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.9rem', fontWeight: 500,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
              }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel – Form */}
      <div className="animate-slideInRight" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        position: 'relative',
      }}>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          width: 42, height: 42, borderRadius: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)',
          color: 'var(--text-secondary)',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--med-red)'; e.currentTarget.style.color = 'var(--med-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="animate-fadeUp" style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px rgba(220,38,38,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h2 className="animate-fadeUp delay-100" style={{
              fontSize: '1.75rem', fontWeight: 800,
              color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px',
            }}>
              Welcome back
            </h2>
            <p className="animate-fadeUp delay-200" style={{
              color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem',
            }}>
              Sign in to your ClaimAssist workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="animate-fadeUp delay-300" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Hospital Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'email' ? 'var(--med-red)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%', padding: '0.7rem 0.75rem 0.7rem 2.6rem',
                    background: 'var(--bg-input)', border: `1.5px solid ${focused === 'email' ? 'var(--med-red)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.92rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <a href="#" style={{ fontSize: '0.8rem', color: 'var(--med-red)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'pass' ? 'var(--med-red)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%', padding: '0.7rem 0.75rem 0.7rem 2.6rem',
                    background: 'var(--bg-input)', border: `1.5px solid ${focused === 'pass' ? 'var(--med-red)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.92rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focused === 'pass' ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem',
                background: loading ? '#ef9999' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                transition: 'all 0.25s ease', marginTop: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transform: 'translateY(0)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(220,38,38,0.4)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(220,38,38,0.35)'; }}
            >
              {loading ? (
                <>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="animate-fadeUp delay-400" style={{
            textAlign: 'center', marginTop: '1.5rem',
            fontSize: '0.875rem', color: 'var(--text-muted)',
          }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--med-red)', fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}