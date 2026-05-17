'use client'

import Link from 'next/link'
import Navbar from '../../components/Navbar'

const papers = [
  {
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    authors: 'Dosovitskiy et al.',
    year: 2021,
    venue: 'ICLR 2021',
    url: 'https://arxiv.org/abs/2010.11929',
    relevance: 'Foundation of the Vision Transformer architecture used in this project'
  },
  {
    title: 'Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization',
    authors: 'Selvaraju et al.',
    year: 2017,
    venue: 'ICCV 2017',
    url: 'https://arxiv.org/abs/1610.02391',
    relevance: 'Basis for CNN explainability heatmaps'
  },
  {
    title: 'A Unified Approach to Interpreting Model Predictions (SHAP)',
    authors: 'Lundberg & Lee',
    year: 2017,
    venue: 'NeurIPS 2017',
    url: 'https://arxiv.org/abs/1705.07874',
    relevance: 'Basis for Random Forest explainability via SHAP values'
  },
  {
    title: 'Deep Learning in Medical Imaging: General Overview',
    authors: 'Lee et al.',
    year: 2017,
    venue: 'Korean Journal of Radiology',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5698623/',
    relevance: 'Background on deep learning applications in clinical radiology'
  },
  {
    title: 'Radiomics: Images Are More than Pictures, They Are Data',
    authors: 'Gillies et al.',
    year: 2016,
    venue: 'Radiology',
    url: 'https://pubs.rsna.org/doi/10.1148/radiol.2015151169',
    relevance: 'Foundational paper for the radiomics feature extraction approach used in the RF model'
  },
  {
    title: 'Random Forests',
    authors: 'Breiman',
    year: 2001,
    venue: 'Machine Learning',
    url: 'https://link.springer.com/article/10.1023/A:1010933404324',
    relevance: 'Original Random Forest paper'
  },
]

const tools = [
  { name: 'PyTorch', role: 'CNN and ViT model training', url: 'https://pytorch.org' },
  { name: 'scikit-learn', role: 'Random Forest + evaluation metrics', url: 'https://scikit-learn.org' },
  { name: 'SHAP', role: 'RF explainability', url: 'https://shap.readthedocs.io' },
  { name: 'FastAPI', role: 'Backend inference API', url: 'https://fastapi.tiangolo.com' },
  { name: 'Next.js', role: 'Frontend framework', url: 'https://nextjs.org' },
  { name: 'Supabase', role: 'Auth, database, storage', url: 'https://supabase.com' },
  { name: 'ReportLab', role: 'PDF report generation', url: 'https://www.reportlab.com' },
  { name: 'OpenCV', role: 'Image preprocessing + Grad-CAM', url: 'https://opencv.org' },
  { name: 'Recharts', role: 'Model benchmark charts', url: 'https://recharts.org' },
  { name: 'Render', role: 'Backend deployment', url: 'https://render.com' },
  { name: 'Vercel', role: 'Frontend deployment', url: 'https://vercel.com' },
]

export default function ResourcesPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      <Navbar showAuth={false} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
            color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '0.5rem'
          }}>PUBLIC · NO LOGIN REQUIRED</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Research & resources
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            The datasets, literature, and tools that informed this project
          </p>
        </div>

        {/* dataset */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Dataset
          </h2>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Brain Tumor CT Scan and MRI Images
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Kaggle · 2024 · 9,599 images total
                </div>
              </div>
              <a href="https://www.kaggle.com/datasets/murtozalikhon/brain-tumor-multimodal-image-ct-and-mri/data" target="_blank" style={{
                fontSize: '0.78rem', color: 'var(--accent)',
                textDecoration: 'none', fontWeight: 500,
                border: '1px solid var(--accent)', borderRadius: '5px',
                padding: '0.25rem 0.75rem', whiteSpace: 'nowrap'
              }}>View on Kaggle ↗</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                ['CT scans', '4,618 images — 2,300 Healthy, 2,318 Tumor'],
                ['MRI scans', '4,981 images — 1,997 Healthy, 2,984 Tumor'],
                ['Format', 'JPG/PNG · Grayscale · Variable resolution'],
                ['Published', '2024 — recent and publicly accessible'],
              ].map(([label, val]) => (
                <div key={label} style={{
                  background: 'var(--surface-2)', borderRadius: '6px',
                  padding: '0.6rem 0.85rem'
                }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--accent)', marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* papers */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Research papers
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {papers.map((p, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '1rem 1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem', lineHeight: 1.4 }}>
                    {p.title}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    {p.authors} · {p.venue} · {p.year}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {p.relevance}
                  </div>
                </div>
                <a href={p.url} target="_blank" style={{
                  fontSize: '0.75rem', color: 'var(--accent)',
                  textDecoration: 'none', fontWeight: 500,
                  whiteSpace: 'nowrap', paddingTop: '0.1rem'
                }}>Paper ↗</a>
              </div>
            ))}
          </div>
        </section>

        {/* tools */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Tools & libraries
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem'
          }}>
            {tools.map((t, i) => (
              <a key={i} href={t.url} target="_blank" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '0.85rem 1rem',
                textDecoration: 'none', display: 'block',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
