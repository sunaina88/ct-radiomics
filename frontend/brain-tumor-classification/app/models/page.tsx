'use client'

import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const metrics = [
  { model: 'CT CNN',  accuracy: 98.1, auc: 0.996, sensitivity: 98.1, specificity: 98.9 },
  { model: 'CT ViT',  accuracy: 97.2, auc: 0.991, sensitivity: 96.6, specificity: 97.8 },
  { model: 'CT RF',   accuracy: 89.2, auc: 0.925, sensitivity: 88.0, specificity: 91.0 },
  { model: 'MRI CNN', accuracy: 98.5, auc: 0.998, sensitivity: 99.2, specificity: 97.5 },
  { model: 'MRI ViT', accuracy: 97.3, auc: 0.989, sensitivity: 98.3, specificity: 95.8 },
  { model: 'MRI RF',  accuracy: 92.7, auc: 0.962, sensitivity: 91.0, specificity: 93.0 },
]

const chartData = metrics.map(m => ({
  name: m.model,
  Accuracy: m.accuracy,
  Sensitivity: m.sensitivity,
  Specificity: m.specificity,
}))

export default function ModelsPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(240,244,255,0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Tumor<span style={{ color: 'var(--accent)' }}>Lens</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/resources" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Research</Link>
          <Link href="/upload" style={{
            background: 'var(--accent)', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600,
            textDecoration: 'none', padding: '0.35rem 0.9rem', borderRadius: '6px'
          }}>Upload scan</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
            color: 'var(--accent)', letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}>PUBLIC · NO LOGIN REQUIRED</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Model benchmarks
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Performance metrics for all 6 models across CT and MRI modalities
          </p>
        </div>

        {/* chart */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Accuracy · Sensitivity · Specificity (%)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: 'var(--text-muted)' }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'DM Mono, monospace'
                }}
                formatter={(v: any) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'DM Mono, monospace' }} />
              <Bar dataKey="Accuracy"    fill="#2563EB" radius={[3,3,0,0]} />
              <Bar dataKey="Sensitivity" fill="#0EA5A0" radius={[3,3,0,0]} />
              <Bar dataKey="Specificity" fill="#64748B" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* metrics table */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem'
        }}>
          {/* header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr',
            padding: '0.75rem 1.25rem', background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)'
          }}>
            {['Model', 'Accuracy', 'AUC', 'Sensitivity', 'Specificity'].map(h => (
              <span key={h} style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
                fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{h}</span>
            ))}
          </div>
          {metrics.map((m, i) => (
            <div key={m.model} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr',
              padding: '0.9rem 1.25rem',
              borderBottom: i < metrics.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {m.model}
              </span>
              {[`${m.accuracy}%`, m.auc.toFixed(3), `${m.sensitivity}%`, `${m.specificity}%`].map((val, j) => (
                <span key={j} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {val}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* methodology note */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Methodology
          </div>
          {[
            ['Dataset', 'CT: 4,618 images (2,300 Healthy / 2,318 Tumor) · MRI: 4,981 images (1,997 Healthy / 2,984 Tumor)'],
            ['Split', '80% training / 20% test · Stratified · random_state=42'],
            ['CNN training', 'AdamW · lr=0.0001 · CosineAnnealing · gradient clipping · 30 epochs'],
            ['ViT training', 'AdamW · lr=0.0005 · CosineAnnealing · 4 layers · 4 heads · 128 embed dim · 20 epochs'],
            ['RF training',  '100 estimators · max_depth=6 · 5-fold cross-validation · 30 radiomics features'],
            ['Explainability', 'Grad-CAM on CNN conv4 layer · SHAP TreeExplainer on RF · ViT attention rollout'],
          ].map(([label, val]) => (
            <div key={label} style={{
              display: 'flex', gap: '1rem', paddingBottom: '0.5rem',
              marginBottom: '0.5rem', borderBottom: '1px solid var(--border)'
            }}>
              <span style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.72rem',
                color: 'var(--accent)', minWidth: '120px', fontWeight: 600
              }}>{label}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}