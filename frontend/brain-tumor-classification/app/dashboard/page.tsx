'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Scan = {
  id: string
  modality: string
  cnn_prediction: string
  cnn_confidence: number
  vit_prediction: string
  vit_confidence: number
  rf_prediction: string
  rf_confidence: number
  disagreement: boolean
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)

      const { data } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setScans(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalScans = scans.length
  const tumorScans = scans.filter(s => {
    const votes = [s.cnn_prediction, s.vit_prediction, s.rf_prediction]
    return votes.filter(v => v === 'Tumor').length >= 2
  }).length
  const healthyScans = totalScans - tumorScans
  const lastScan = scans[0]?.created_at
    ? new Date(scans[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  const getConsensus = (scan: Scan) => {
    const votes = [scan.cnn_prediction, scan.vit_prediction, scan.rf_prediction]
    return votes.filter(v => v === 'Tumor').length >= 2 ? 'Tumor' : 'Healthy'
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatConf = (c: number) =>
    c <= 1 ? `${(c * 100).toFixed(0)}%` : `${c.toFixed(0)}%`

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  )

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(240, 244, 255, 0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Tumor<span style={{ color: 'var(--accent)' }}>Lens</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[
              { label: 'Dashboard', href: '/dashboard', active: true },
              { label: 'Upload scan', href: '/upload', active: false },
              { label: 'Benchmarks', href: '/models', active: false },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                textDecoration: 'none', fontSize: '0.85rem',
                padding: '0.35rem 0.75rem', borderRadius: '6px',
                color: item.active ? 'var(--accent)' : 'var(--text-muted)',
                background: item.active ? 'var(--accent-dim)' : 'transparent',
                fontWeight: item.active ? 500 : 400
              }}>{item.label}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {user?.email}
          </span>
          <button onClick={handleSignOut} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0.35rem 0.9rem',
            fontSize: '0.8rem', color: 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
          }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem' }}>

        {/* page header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.5rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem'
          }}>Dashboard</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Your scan history and analysis results
          </p>
        </div>

        {/* stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem', marginBottom: '2rem'
        }}>
          {[
            { value: totalScans, label: 'Total scans', mono: false },
            { value: tumorScans, label: 'Tumors detected', mono: false },
            { value: healthyScans, label: 'Healthy', mono: false },
            { value: lastScan, label: 'Last scan', mono: true },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '1.5rem', fontWeight: 600,
                color: i === 1 ? 'var(--danger)' : i === 2 ? 'var(--success)' : 'var(--text-primary)',
                fontFamily: s.mono ? 'DM Mono, monospace' : 'Syne, sans-serif',
                fontSize: s.mono ? '0.95rem' : '1.5rem',
                marginBottom: '0.25rem'
              }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* new scan button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Scan history
          </h2>
          <Link href="/upload" style={{
            background: 'var(--accent)', color: '#fff',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            padding: '0.5rem 1.25rem', borderRadius: '6px'
          }}>+ New scan</Link>
        </div>

        {/* scan list */}
        {scans.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '4rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧠</div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No scans yet
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Upload your first CT or MRI scan to get started
            </p>
            <Link href="/upload" style={{
              background: 'var(--accent)', color: '#fff',
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
              padding: '0.6rem 1.5rem', borderRadius: '6px'
            }}>Upload a scan</Link>
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {/* table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 100px 1fr 1fr 1fr 100px 120px',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)'
            }}>
              {['Date', 'Modality', 'CNN', 'ViT', 'RF', 'Consensus', 'Actions'].map(h => (
                <span key={h} style={{
                  fontSize: '0.72rem', fontWeight: 600,
                  color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{h}</span>
              ))}
            </div>

            {/* table rows */}
            {scans.map((scan, i) => {
              const consensus = getConsensus(scan)
              return (
                <div key={scan.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 100px 1fr 1fr 1fr 100px 120px',
                  padding: '1rem 1.25rem',
                  borderBottom: i < scans.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDate(scan.created_at)}
                  </span>
                  <span style={{
                    display: 'inline-block', fontFamily: 'DM Mono, monospace',
                    fontSize: '0.72rem', padding: '0.2rem 0.6rem',
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                    borderRadius: '4px', width: 'fit-content'
                  }}>{scan.modality?.toUpperCase()}</span>

                  {[
                    { pred: scan.cnn_prediction, conf: scan.cnn_confidence },
                    { pred: scan.vit_prediction, conf: scan.vit_confidence },
                    { pred: scan.rf_prediction, conf: scan.rf_confidence },
                  ].map((m, mi) => (
                    <div key={mi}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 500,
                        color: m.pred === 'Tumor' ? 'var(--danger)' : 'var(--success)'
                      }}>{m.pred}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        {formatConf(m.conf)}
                      </span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: consensus === 'Tumor' ? 'var(--danger)' : 'var(--success)',
                      display: 'inline-block', flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 600,
                      color: consensus === 'Tumor' ? 'var(--danger)' : 'var(--success)'
                    }}>{consensus}</span>
                    {scan.disagreement && (
                      <span style={{
                        fontSize: '0.65rem', color: 'var(--amber)',
                        fontFamily: 'DM Mono, monospace'
                      }}>⚠</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/upload?scan=${scan.id}`} style={{
                      fontSize: '0.75rem', color: 'var(--accent)',
                      textDecoration: 'none', fontWeight: 500
                    }}>View</Link>
                    <span style={{ color: 'var(--border-2)', fontSize: '0.75rem' }}>·</span>
                    <a href="#" style={{
                      fontSize: '0.75rem', color: 'var(--text-muted)',
                      textDecoration: 'none'
                    }}>Report</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}