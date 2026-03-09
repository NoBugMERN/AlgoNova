import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

export default function ClaimDetails() {
  const { theme } = useTheme();
  const [activeHighlight, setActiveHighlight] = useState(null);

  const rawText = "Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. MRI confirms L4-L5 disc herniation with significant nerve root compression. Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief. The patient reports a pain score of 8/10 on the Visual Analog Scale. I strongly recommend proceeding with Lumbar Discectomy (L4-L5) to decompress the nerve root and restore function. The procedure is medically necessary to prevent permanent neurological damage.";

  const renderTextWithHighlights = () => {
    const parts = [
      { text: "Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain radiating to the left leg for over 14 months. ", key: null },
      { text: "MRI confirms L4-L5 disc herniation with significant nerve root compression.", key: "diagnosis" },
      { text: " ", key: null },
      { text: "Conservative treatments including 6 weeks of physiotherapy and two epidural steroid injections have failed to provide lasting relief.", key: "treatments" },
      { text: " The patient reports a pain score of 8/10 on the Visual Analog Scale. I strongly recommend proceeding with ", key: null },
      { text: "Lumbar Discectomy (L4-L5)", key: "procedure" },
      { text: " to decompress the nerve root and restore function. The procedure is ", key: null },
      { text: "medically necessary to prevent permanent neurological damage.", key: "necessity" }
    ];

    const getHighlightStyle = (key) => {
      if (activeHighlight !== key) return { background: 'rgba(255,255,255,0.05)', color: 'var(--text-inverse)' };
      switch (key) {
        case 'diagnosis': return { background: 'rgba(220,38,38,0.25)', color: '#fca5a5', boxShadow: '0 0 15px rgba(220,38,38,0.4)', border: '1px solid rgba(220,38,38,0.5)' };
        case 'procedure': return { background: 'rgba(22,163,74,0.25)', color: '#86efac', boxShadow: '0 0 15px rgba(22,163,74,0.4)', border: '1px solid rgba(22,163,74,0.5)' };
        case 'treatments':return { background: 'rgba(217,119,6,0.25)', color: '#fcd34d', boxShadow: '0 0 15px rgba(217,119,6,0.4)', border: '1px solid rgba(217,119,6,0.5)' };
        case 'necessity': return { background: 'rgba(56,189,248,0.25)', color: '#7dd3fc', boxShadow: '0 0 15px rgba(56,189,248,0.4)', border: '1px solid rgba(56,189,248,0.5)' };
        default: return {};
      }
    };

    return (
      <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontSize: '0.95rem', fontWeight: 500 }}>
        {parts.map((part, i) => (
          <span 
            key={i} 
            style={{
              transition: 'all 0.3s ease',
              borderRadius: part.key ? 6 : 0,
              padding: part.key ? '2px 4px' : 0,
              cursor: part.key ? 'pointer' : 'default',
              ...(part.key ? getHighlightStyle(part.key) : {})
            }}
            onMouseEnter={() => part.key && setActiveHighlight(part.key)}
            onMouseLeave={() => part.key && setActiveHighlight(null)}
          >
            {part.text}
          </span>
        ))}
      </p>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '2rem', transition: 'background 0.35s ease' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Link to="/" style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
              }}>←</Link>
              <span style={{
                background: 'var(--med-red-light)', color: 'var(--med-red)',
                padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                border: '1px solid var(--med-red-mid)', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span className="animate-pulse-ring" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--med-red)' }}></span>
                AI Assisted Processing
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Pre-Authorization Request
            </h1>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Review the extracted clinical details before final submission.
            </p>
          </div>
          <div style={{
            background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', textAlign: 'right',
          }}>
            <p style={{ margin: '0 0 0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Claim ID: <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>REQ-001</span></p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mar 09, 2026</span></p>
          </div>
        </header>

        {/* Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Extracted Patient Records
            </h2>
            
            {/* Patient Info Card */}
            <div className="animate-fadeUp" style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'var(--med-red-light)', borderRadius: '0 0 0 100%', zIndex: 0, opacity: 0.5 }}></div>
              <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', position: 'relative', zIndex: 1 }}>Demographics & Insurance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rajesh Kumar</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age & Gender</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>45, Male</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Group</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--med-red)' }}>B+</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policy Number</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', border: '1px solid var(--border-color)' }}>POL-2024-88321</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Insurer ID</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>BlueCross_A</p>
                </div>
              </div>
            </div>

            {/* Diagnosis & Procedure Card */}
            <div className="animate-fadeUp delay-100" style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Request Details</h3>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>Hover over sections below to trace evidence in the AI panel.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                
                {/* Diagnosis */}
                <div 
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s', cursor: 'pointer',
                    background: activeHighlight === 'diagnosis' ? 'var(--med-red-light)' : 'transparent',
                    border: `1px solid ${activeHighlight === 'diagnosis' ? 'var(--med-red-mid)' : 'transparent'}`,
                  }}
                  onMouseEnter={() => setActiveHighlight("diagnosis")} onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div style={{ width: '35%' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: activeHighlight === 'diagnosis' ? 'var(--med-red)' : 'var(--text-secondary)' }}>Primary Diagnosis</p>
                  </div>
                  <div style={{ width: '65%' }}>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lumbar disc herniation</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ICD-10 Code: <span style={{ fontFamily: 'JetBrains Mono', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: 4 }}>M51.1</span></p>
                  </div>
                </div>

                {/* Procedure */}
                <div 
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s', cursor: 'pointer',
                    background: activeHighlight === 'procedure' ? 'var(--med-green-light)' : 'transparent',
                    border: `1px solid ${activeHighlight === 'procedure' ? 'var(--med-green-mid)' : 'transparent'}`,
                  }}
                  onMouseEnter={() => setActiveHighlight("procedure")} onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div style={{ width: '35%' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: activeHighlight === 'procedure' ? 'var(--med-green)' : 'var(--text-secondary)' }}>Requested Procedure</p>
                  </div>
                  <div style={{ width: '65%' }}>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lumbar Discectomy (L4-L5)</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPT Code: <span style={{ fontFamily: 'JetBrains Mono', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: 4 }}>CPT_63030</span></p>
                  </div>
                </div>

                {/* Treatments */}
                <div 
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s', cursor: 'pointer',
                    background: activeHighlight === 'treatments' ? 'var(--med-amber-light)' : 'transparent',
                    border: `1px solid ${activeHighlight === 'treatments' ? 'rgba(217,119,6,0.2)' : 'transparent'}`,
                  }}
                  onMouseEnter={() => setActiveHighlight("treatments")} onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div style={{ width: '35%' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: activeHighlight === 'treatments' ? 'var(--med-amber)' : 'var(--text-secondary)' }}>Prior Treatments</p>
                  </div>
                  <div style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: 8, boxShadow: 'var(--shadow-sm)' }}>
                      <span style={{ color: 'var(--med-red)', fontSize: '0.9rem', marginTop: 2 }}>✕</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Physiotherapy <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(6 wks)</span></p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--med-red)', textTransform: 'uppercase', marginTop: 2 }}>Failed - Partial relief</p>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: 8, boxShadow: 'var(--shadow-sm)' }}>
                      <span style={{ color: 'var(--med-red)', fontSize: '0.9rem', marginTop: 2 }}>✕</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Epidural steroid injection</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--med-red)', textTransform: 'uppercase', marginTop: 2 }}>Failed - Temp relief</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Necessity */}
                <div 
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s', cursor: 'pointer',
                    background: activeHighlight === 'necessity' ? 'rgba(56,189,248,0.1)' : 'transparent',
                    border: `1px solid ${activeHighlight === 'necessity' ? 'rgba(56,189,248,0.3)' : 'transparent'}`,
                  }}
                  onMouseEnter={() => setActiveHighlight("necessity")} onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div style={{ width: '35%' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: activeHighlight === 'necessity' ? '#0284c7' : 'var(--text-secondary)' }}>Medical Urgency</p>
                  </div>
                  <div style={{ width: '65%' }}>
                    <span style={{
                      background: 'rgba(56,189,248,0.15)', color: '#0369a1', border: '1px solid rgba(56,189,248,0.3)',
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, display: 'inline-block',
                    }}>
                      Elective but time-sensitive
                    </span>
                  </div>
                </div>

              </div>
            </div>
            
          </div>

          {/* Right Column: AI Evidence Panel & Action */}
          <div className="animate-fadeUp delay-200" style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{
              background: '#0a0f12', borderRadius: 'var(--radius-xl)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column',
              minHeight: 500,
            }}>
              {/* Top Header */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: '1.2rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="animate-pulse-ring" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--med-red)' }}></div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>AI Evidence Trace</h3>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--med-red)', border: '1px solid rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: 4 }}>SOURCE: SURGEON NOTES</span>
              </div>
              
              {/* Body */}
              <div style={{ padding: '1.5rem', flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 2, textTransform: 'uppercase' }}>Attending Physician</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Dr. Anand Sharma</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 2, textTransform: 'uppercase' }}>Specialty</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Orthopedic Spine</span>
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {renderTextWithHighlights()}
                </div>
                
                {/* Fallback instruction */}
                {!activeHighlight && (
                  <div style={{
                    position: 'absolute', bottom: '1.5rem', left: 0, right: 0, textAlign: 'center',
                    pointerEvents: 'none', animation: 'fadeIn 0.5s',
                  }}>
                    <span style={{
                      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', padding: '6px 14px', borderRadius: 20,
                      backdropFilter: 'blur(4px)',
                    }}>
                      Hover form fields to trace source text
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Footer */}
              <div style={{ background: '#05080a', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', padding: '4px 10px', borderRadius: 20 }}>
                    <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>✓</span>
                    <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}>All Rules Passed</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Confidence</span>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>99.8%</span>
                  </div>
                </div>

                <Link to="/" style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 800,
                  boxShadow: '0 4px 20px rgba(22,163,74,0.4)', transition: 'all 0.25s',
                  fontFamily: 'Inter, sans-serif',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(22,163,74,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.4)'; }}
                >
                  Submit Final Claim Package →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

