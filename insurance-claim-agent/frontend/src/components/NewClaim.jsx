import React, { useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

export default function NewClaim() {
  useTheme();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    patientName: '',
    dob: '',
    policyNumber: '',
    insurerId: '',
    procedureText: '',
    surgeonNoteText: '',
  });

  const patientId = useMemo(() => `PAT_${Date.now()}`, []);

  const handleFiles = (incoming) => {
    const list = Array.from(incoming).map(f => ({ name: f.name, size: (f.size/1024).toFixed(1)+'KB', type: f.type }));
    setFiles(prev => [...prev, ...list]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);
    try {
      const noteText = [form.procedureText, form.surgeonNoteText].filter(Boolean).join('\n\n');
      const res = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          insurerId: form.insurerId,
          patientName: form.patientName,
          dob: form.dob,
          policyNumber: form.policyNumber,
          surgeonNoteText: noteText,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = await res.json();

      const claimKey = data?.request?.claimId || `CLM_${Date.now()}`;
      sessionStorage.setItem(`claim:${claimKey}`, JSON.stringify(data));
      setSubmitted(true);
      navigate(`/claim/${claimKey}`);
    } catch (e2) {
      setError(e2?.message || 'Failed to submit claim');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', transition: 'background 0.35s ease' }}>
      {/* Header */}
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
          transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--med-red)'; e.currentTarget.style.color='var(--med-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-secondary)'; }}
        >←</Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>New Prior Authorization</h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upload surgeon notes and clinical documents</p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1.5rem' }}>
        {submitted ? (
          <div className="animate-fadeUp" style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--med-green-mid)', padding: '3rem 2rem',
            textAlign: 'center', boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--med-green-light)', border: '2px solid var(--med-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: '2rem',
            }}>✓</div>
            <h2 style={{ color: 'var(--med-green)', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Claim Package Created!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your AI agent has parsed the documents and assembled the pre-authorization package.</p>
            <Link to="/" style={{
              display: 'inline-block', padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', textDecoration: 'none',
              borderRadius: 'var(--radius-sm)', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
            }}>Back to Dashboard</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Patient info */}
            <div className="animate-fadeUp" style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)', padding: '1.5rem',
              marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Patient Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Patient Full Name</label>
                  <input
                    value={form.patientName}
                    onChange={e => setForm(prev => ({ ...prev, patientName: e.target.value }))}
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    required
                    style={{
                      width: '100%', padding: '0.65rem 0.8rem',
                      background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Date of Birth</label>
                  <input
                    value={form.dob}
                    onChange={e => setForm(prev => ({ ...prev, dob: e.target.value }))}
                    type="date"
                    required
                    style={{
                      width: '100%', padding: '0.65rem 0.8rem',
                      background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Policy Number</label>
                  <input
                    value={form.policyNumber}
                    onChange={e => setForm(prev => ({ ...prev, policyNumber: e.target.value }))}
                    type="text"
                    placeholder="e.g. POL-2024-88321"
                    required
                    style={{
                      width: '100%', padding: '0.65rem 0.8rem',
                      background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Insurance Provider (Insurer ID)</label>
                  <input
                    value={form.insurerId}
                    onChange={e => setForm(prev => ({ ...prev, insurerId: e.target.value }))}
                    type="text"
                    placeholder="e.g. BlueCross_A"
                    required
                    style={{
                      width: '100%', padding: '0.65rem 0.8rem',
                      background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Procedure / CPT Code</label>
                <input
                  value={form.procedureText}
                  onChange={e => setForm(prev => ({ ...prev, procedureText: e.target.value }))}
                  type="text"
                  placeholder="e.g. Lumbar Discectomy (L4-L5) – CPT 63030"
                  required
                  style={{
                    width: '100%', padding: '0.65rem 0.8rem',
                    background: 'var(--bg-input)', border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Surgeon Note (paste text)</label>
                <textarea
                  value={form.surgeonNoteText}
                  onChange={e => setForm(prev => ({ ...prev, surgeonNoteText: e.target.value }))}
                  placeholder="Paste surgeon note here. Include clinical justification, imaging, failed conservative care, urgency, etc."
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.8rem',
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.4,
                  }}
                  onFocus={e => { e.target.style.borderColor='var(--med-red)'; e.target.style.boxShadow='0 0 0 3px rgba(220,38,38,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='var(--border-color)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Claim will be created as <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{patientId}</span>
              </div>
            </div>

            {/* Document Upload */}
            <div className="animate-fadeUp delay-100" style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)', padding: '1.5rem',
              marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Clinical Documents
              </h3>

              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--med-red)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)', padding: '2.5rem 1.5rem',
                  textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'var(--med-red-light)' : 'var(--bg-secondary)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📎</div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  Drop files here or click to browse
                </p>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Surgeon notes, MRI reports, referrals (PDF, DOCX, JPG)
                </p>
              </div>
              <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

              {files.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {files.map((f, i) => (
                    <div key={i} className="animate-fadeUp" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.6rem 0.9rem', borderRadius: 8,
                      background: 'var(--med-green-light)', border: '1px solid var(--med-green-mid)',
                    }}>
                      <span style={{ color: 'var(--med-green)', fontSize: '1rem' }}>✓</span>
                      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.size}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: 'var(--med-red)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="animate-fadeUp delay-200" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              {error && (
                <div style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  background: 'var(--med-red-light)',
                  border: '1px solid var(--med-red-mid)',
                  color: 'var(--med-red)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}>
                  {error}
                </div>
              )}
              <Link to="/" style={{
                padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
                color: 'var(--text-secondary)', textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: 600,
              }}>Cancel</Link>
              <button type="submit" disabled={processing} style={{
                padding: '0.75rem 2rem', borderRadius: 'var(--radius-sm)',
                background: processing ? '#ef9999' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', border: 'none', fontSize: '0.92rem', fontWeight: 700,
                cursor: processing ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(220,38,38,0.3)', transition: 'all 0.25s',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Inter, sans-serif',
              }}>
                {processing ? (
                  <>
                    <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                    AI Processing...
                  </>
                ) : '🔬 Submit for AI Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}