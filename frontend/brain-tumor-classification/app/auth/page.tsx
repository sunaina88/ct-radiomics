'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setSuccess('Account created! Check your email to confirm, then sign in.')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.9rem',
    border: '1px solid var(--border)', borderRadius: '6px',
    background: '#F8F9FC', color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif'
  }

  const labelStyle = {
    fontSize: '0.78rem', fontWeight: 500,
    color: 'var(--text-muted)', marginBottom: '0.4rem',
    display: 'block', fontFamily: 'DM Sans, sans-serif'
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex' }}>

      {/* left panel */}
      <div style={{
        width: '45%', background: 'var(--accent)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem', position: 'relative', overflow: 'hidden'
      }}>
        {/* grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
  BrainScan<span style={{ color: 'rgba(255,255,255,0.6)' }}>AI</span>
</span>

        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em',
            marginBottom: '1rem', textTransform: 'uppercase'
          }}>Research · KIIT University</div>
          <blockquote style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.4rem',
            fontWeight: 600, color: '#fff', lineHeight: 1.4,
            marginBottom: '1.5rem'
          }}>
            "AI-assisted.<br />Human-verified."
          </blockquote>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '320px' }}>
            Three independent models analyze your scan and flag disagreements
            rather than giving overconfident predictions.
          </p>
        </div>

        <div style={{
          display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1
        }}>
          {[
            { value: '98.5%', label: 'CNN accuracy' },
            { value: '97.3%', label: 'ViT accuracy' },
            { value: '9,599', label: 'Training scans' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '1.1rem',
                fontWeight: 500, color: '#fff'
              }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* tab toggle */}
          <div style={{
            display: 'flex', background: 'var(--surface-2)',
            borderRadius: '8px', padding: '3px',
            marginBottom: '2rem', border: '1px solid var(--border)'
          }}>
            {(['signin', 'signup'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '0.5rem',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                  fontWeight: tab === t ? 600 : 400,
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s'
                }}>
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.4rem',
            fontWeight: 700, color: 'var(--text-primary)',
            marginBottom: '0.4rem'
          }}>
            {tab === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            {tab === 'signin'
              ? 'Sign in to access your scan history and reports.'
              : 'Create an account to start uploading scans.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab === 'signup' && (
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid #FCA5A5',
                borderRadius: '6px', padding: '0.65rem 0.9rem',
                fontSize: '0.8rem', color: '#B91C1C'
              }}>{error}</div>
            )}

            {success && (
              <div style={{
                background: 'var(--success-dim)', border: '1px solid #6EE7B7',
                borderRadius: '6px', padding: '0.65rem 0.9rem',
                fontSize: '0.8rem', color: '#065F46'
              }}>{success}</div>
            )}

            <button
              onClick={tab === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
              style={{
                width: '100%', padding: '0.7rem',
                background: loading ? 'var(--border-2)' : 'var(--accent)',
                color: '#fff', border: 'none', borderRadius: '6px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'opacity 0.15s'
              }}>
              {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </div>

          <p style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
            marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.6
          }}>
            By continuing you agree this tool is for research purposes only
            and all clinical findings require professional review.
          </p>
        </div>
      </div>
    </main>
  )
}