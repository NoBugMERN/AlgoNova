import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const ROLES = [
  { value: 'billing-specialist', label: 'Billing Specialist', icon: '📋' },
  { value: 'claims-manager',     label: 'Claims Manager',     icon: '🗂️' },
  { value: 'provider-admin',     label: 'Provider Admin',     icon: '🏥' },
  { value: 'physician',          label: 'Physician / Surgeon', icon: '👨‍⚕️' },
];

export default function Signup({ onSignup }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [step, setStep] = useState(1); // 1 = details, 2 = role selection

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    setTimeout(() => {
      if (onSignup) onSignup();
      navigate('/');
    }, 1000);
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.72rem 0.75rem 0.72rem 2.6rem',
    background: 'var(--bg-input)',
    border: `1.5px solid ${focused === field ? 'var(--med-red)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '0.92rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
    fontFamily: 'Inter, sans-serif',
  });

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-secondary)',
      display: 'flex', transition: 'background 0.35s ease',
    }}>
      {/* Left branding panel */}
      <div className="animate-slideInLeft" style={{
        flex: '0 0 38%',
        background: 'linear-gradient(155deg, #15803d 0%, #16a34a 45%, #14532d 100%)',
        padding: '3rem', display: 'none', flexDirection: 'column',
        justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      }}
        ref={el => el && (el.style.display = window.innerWidth >= 900 ? 'flex' : 'none')}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1.05rem' }}>ClaimAssist Pro</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.25, margin: '0 0 1rem' }}>
            Join the future of medical billing.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '0.95rem', margin: 0 }}>
            Streamline prior authorizations, reduce denials, and get claims submitted faster with AI assistance built for healthcare professionals.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Used by 500+ hospital networks' },
            { label: 'Avg. 76% reduction in denials' },
            { label: 'Setup in under 5 minutes' },
          ].map((item, i) => (
            <div key={i} className={`animate-fadeUp delay-${(i+1)*100}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.6rem',
              color: 'rgba(255,255,255,0.88)', fontSize: '0.88rem', fontWeight: 500,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem',
              }}>✓</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="animate-slideInRight" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '2rem', position: 'relative',
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
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--med-green)'; e.currentTarget.style.color = 'var(--med-green)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="animate-fadeUp" style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <h2 className="animate-fadeUp delay-100" style={{
              fontSize: '1.75rem', fontWeight: 800,
              color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px',
            }}>
              {step === 1 ? 'Create your account' : 'Choose your role'}
            </h2>
            <p className="animate-fadeUp delay-200" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              {step === 1 ? 'Step 1 of 2 – Personal details' : 'Step 2 of 2 – Your clinical role'}
            </p>

            {/* Progress bar */}
            <div style={{ marginTop: '1rem', height: 4, background: 'var(--border-color)', borderRadius: 4 }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                width: step === 1 ? '50%' : '100%',
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleNext} className="animate-fadeUp delay-300" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'name' ? 'var(--med-green)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    name="name" type="text" required value={form.name}
                    onChange={handleChange} placeholder="Dr. Jane Smith"
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                    style={inputStyle('name')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? 'var(--med-green)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    name="email" type="email" required value={form.email}
                    onChange={handleChange} placeholder="you@hospital.com"
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'pass' ? 'var(--med-green)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      name="password" type="password" required value={form.password}
                      onChange={handleChange} placeholder="Create password"
                      onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                      style={inputStyle('pass')}
                    />
                  </div>
                </div>
                {/* Confirm */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Confirm</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'confirm' ? 'var(--med-green)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      name="confirm" type="password" required value={form.confirm}
                      onChange={handleChange} placeholder="Re-type"
                      onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                      style={inputStyle('confirm')}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" style={{
                width: '100%', padding: '0.85rem',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                transition: 'all 0.25s ease', marginTop: '0.4rem',
                fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(22,163,74,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.35)'; }}
              >
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                {ROLES.map(role => (
                  <button
                    key={role.value} type="button"
                    onClick={() => setSelectedRole(role.value)}
                    style={{
                      padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left',
                      border: `2px solid ${selectedRole === role.value ? 'var(--med-green)' : 'var(--border-color)'}`,
                      background: selectedRole === role.value ? 'var(--med-green-light)' : 'var(--bg-card)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: selectedRole === role.value ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{role.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: selectedRole === role.value ? 'var(--med-green)' : 'var(--text-primary)' }}>
                      {role.label}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: '0 0 auto', padding: '0.85rem 1.2rem',
                  background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                }}>← Back</button>

                <button type="submit" disabled={!selectedRole || loading} style={{
                  flex: 1, padding: '0.85rem',
                  background: !selectedRole || loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem', fontWeight: 700,
                  cursor: !selectedRole || loading ? 'not-allowed' : 'pointer',
                  boxShadow: selectedRole ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
                  transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                      Creating account...
                    </>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="animate-fadeUp delay-400" style={{
            textAlign: 'center', marginTop: '1.5rem',
            fontSize: '0.875rem', color: 'var(--text-muted)',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--med-green)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
