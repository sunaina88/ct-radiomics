'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(var(--border) 1px, transparent 1px),
          linear-gradient(90deg, var(--border) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        opacity: 0.6
      }} />

      {/* navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(248, 249, 252, 0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em'
        }}>
          Tumor<span style={{ color: 'var(--accent)' }}>Lens</span>
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/models" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>Benchmarks</Link>
          <Link href="/resources" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>Research</Link>
          <Link href="/auth" style={{
            color: 'var(--text-primary)', fontSize: '0.85rem', textDecoration: 'none',
            padding: '0.35rem 0.9rem',
            border: '1px solid var(--border-2)', borderRadius: '6px',
            background: 'var(--surface)'
          }}>Sign in</Link>
          <Link href="/auth" style={{
            background: 'var(--accent)', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600,
            textDecoration: 'none', padding: '0.35rem 0.9rem', borderRadius: '6px'
          }}>Get started</Link>
        </div>
      </nav>

      {/* hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: '860px', margin: '0 auto',
        padding: '5rem 2.5rem 3rem'
      }}>
        <div className="animate-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
          color: 'var(--accent)', letterSpacing: '0.06em',
          border: '1px solid var(--accent)', borderRadius: '4px',
          padding: '0.2rem 0.7rem', marginBottom: '1.75rem',
          background: 'var(--accent-dim)'
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Research project · KIIT University · IEEE submission
        </div>

        <h1 className="animate-fade-up delay-1" style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
          lineHeight: 1.15, color: 'var(--text-primary)',
          marginBottom: '1.25rem', letterSpacing: '-0.025em'
        }}>
          Clinical decision support<br />for brain tumor detection
        </h1>

        <p className="animate-fade-up delay-2" style={{
          fontSize: '0.95rem', color: 'var(--text-muted)',
          lineHeight: 1.8, marginBottom: '2rem', maxWidth: '520px'
        }}>
          Upload a CT or MRI scan and receive predictions from three independent
          models — CNN, Vision Transformer, and Random Forest — with Grad-CAM
          spatial explainability and structured clinical reports.
        </p>

        <div className="animate-fade-up delay-3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <Link href="/auth" style={{
            background: 'var(--accent)', color: '#fff',
            fontWeight: 600, fontSize: '0.875rem',
            textDecoration: 'none', padding: '0.65rem 1.5rem',
            borderRadius: '6px', display: 'inline-block'
          }}>Upload a scan</Link>
          <Link href="/models" style={{
            color: 'var(--text-primary)', fontSize: '0.875rem',
            textDecoration: 'none', padding: '0.65rem 1.5rem',
            border: '1px solid var(--border-2)', borderRadius: '6px',
            display: 'inline-block', background: 'var(--surface)'
          }}>View model benchmarks →</Link>
        </div>

        {/* stats bar */}
        <div className="animate-fade-up delay-4" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid var(--border)', borderRadius: '10px',
          overflow: 'hidden', background: 'var(--surface)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          {[
            { value: '98.5%', label: 'CNN accuracy', sub: 'CT + MRI' },
            { value: '97.3%', label: 'ViT accuracy', sub: 'CT + MRI' },
            { value: '9,599', label: 'Training scans', sub: 'CT + MRI combined' },
            { value: '3', label: 'Model ensemble', sub: 'CNN · ViT · RF' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '1.25rem 1.5rem',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '1.4rem',
                fontWeight: 500, color: 'var(--accent)', marginBottom: '0.2rem'
              }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.15rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* disclaimer */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '0 2.5rem' }}>
        <div style={{
          background: 'var(--amber-dim)', border: '1px solid #FDE68A',
          borderRadius: '8px', padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
        }}>
          <span style={{ color: 'var(--amber)', fontSize: '0.85rem', marginTop: '1px' }}>⚠</span>
          <span style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.6 }}>
            This tool is intended for <strong>research and educational purposes only</strong>.
            All findings must be reviewed and confirmed by a qualified radiologist before any clinical decision is made.
          </span>
        </div>
      </section>

      {/* feature cards */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: '860px', margin: '0 auto',
        padding: '3rem 2.5rem 5rem',
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        {[
          {
            tag: 'Ensemble',
            title: 'Three-model consensus',
            desc: 'CNN, Vision Transformer, and Random Forest predictions shown side by side. When models disagree, the case is flagged for radiologist review rather than giving an overconfident result.',
          },
          {
            tag: 'Explainability',
            title: 'Grad-CAM + SHAP analysis',
            desc: 'Spatial heatmaps highlight which region of the scan the CNN attended to. SHAP values explain which radiomics features drove the Random Forest decision.',
          },
          {
            tag: 'Modality',
            title: 'CT and MRI support',
            desc: 'Separate models trained on CT (4,618 scans) and MRI (4,981 scans). CT for emergency settings, MRI for greater soft-tissue detail.',
          },
          {
            tag: 'Reporting',
            title: 'Structured clinical reports',
            desc: 'One-click PDF with scan image, heatmap overlay, all three model predictions with confidence scores, and a mandatory clinical disclaimer.',
          }
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,160,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: '0.68rem',
              color: 'var(--accent)', letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>{card.tag}</span>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontSize: '0.95rem',
              fontWeight: 600, color: 'var(--text-primary)',
              margin: '0.4rem 0 0.6rem'
            }}>{card.title}</h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </section>

      {/* footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 2.5rem',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
        background: 'var(--surface)'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            TumorLens · KIIT University
          </span>
          <Link href="https://github.com/sunaina88" target="_blank" style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
            color: 'var(--text-muted)', textDecoration: 'none'
          }}>GitHub ↗</Link>
          <Link href="/resources" style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
            color: 'var(--text-muted)', textDecoration: 'none'
          }}>Research →</Link>
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          For research use only · Not a diagnostic tool
        </span>
      </footer>
    </main>
  )
}