'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabase'
import { predictAll, getGradcam, generateReport, getAttention } from '../../lib/api'
import ExpandableBreakdown from '../../components/ExpandableBreakdown'

type Results = {
  cnn: { prediction: string; confidence: number }
  vit: { prediction: string; confidence: number }
  rf: { prediction: string; confidence: number }
  modality: string
}

type Gradcam = {
  original_image: string
  heatmap_overlay: string
}

type AttentionData = {
  original_image: string
  attention_overlay: string
}

type ShapData = {
  top_features: Array<{
    feature: string
    shap_value: number
    feature_value: number
    direction: string
  }>
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [modality, setModality] = useState<'ct' | 'mri'>('ct')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [gradcam, setGradcam] = useState<Gradcam | null>(null)
  const [attention, setAttention] = useState<AttentionData | null>(null)
  const [shapData, setShapData] = useState<ShapData | null>(null)
  const [sliderValue, setSliderValue] = useState(0.5)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandLoading, setExpandLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults(null)
    setGradcam(null)
    setAttention(null)
    setShapData(null)
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1
  })

  const handleAnalyse = async () => {
    if (!file) return
    setLoading(true)
    setProgress(true)
    setError('')
    setResults(null)
    setGradcam(null)
    setAttention(null)
    setShapData(null)

    try {
      // run predict + gradcam in parallel first (faster)
      const [predResults, gradcamResults] = await Promise.all([
        predictAll(file, modality),
        getGradcam(file, modality).catch(() => null)
      ])

      setResults(predResults)
      setGradcam(gradcamResults)

      // run attention in background after main results show
      setExpandLoading(true)
      getAttention(file, modality).catch(() => null).then((attentionResults) => {
        setAttention(attentionResults)
        setExpandLoading(false)
      })

      // save to supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const predictions = [
          predResults.cnn.prediction,
          predResults.vit.prediction,
          predResults.rf.prediction
        ]
        const disagreement = new Set(predictions).size > 1
        await supabase.from('scans').insert({
          user_id: user.id,
          modality,
          cnn_prediction: predResults.cnn.prediction,
          cnn_confidence: predResults.cnn.confidence,
          vit_prediction: predResults.vit.prediction,
          vit_confidence: predResults.vit.confidence,
          rf_prediction: predResults.rf.prediction,
          rf_confidence: predResults.rf.confidence,
          disagreement
        })
      }
    } catch (e: any) {
      setError('Analysis failed. Make sure the backend is running and try again.')
    }

    setLoading(false)
    setProgress(false)
  }

  const handleReport = async () => {
    if (!file || !results) return
    setReportLoading(true)
    try {
      const blob = await generateReport(
        file, modality,
        results.cnn.prediction, results.cnn.confidence,
        results.vit.prediction, results.vit.confidence,
        results.rf.prediction, results.rf.confidence
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `brainscan_report_${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Report generation failed.')
    }
    setReportLoading(false)
  }

  const getConsensus = () => {
    if (!results) return null
    const votes = [results.cnn.prediction, results.vit.prediction, results.rf.prediction]
    return votes.filter(v => v === 'Tumor').length >= 2 ? 'Tumor' : 'Healthy'
  }

  const hasDisagreement = () => {
    if (!results) return false
    const votes = [results.cnn.prediction, results.vit.prediction, results.rf.prediction]
    return new Set(votes).size > 1
  }

  const getConfidenceWarning = () => {
    if (!results) return false
    const conf = results.cnn.confidence <= 1
      ? results.cnn.confidence * 100
      : results.cnn.confidence
    return conf >= 60 && conf <= 75
  }

  const formatConf = (c: number) =>
    c <= 1 ? `${(c * 100).toFixed(1)}%` : `${c.toFixed(1)}%`

  const consensus = getConsensus()

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* progress bar */}
      {progress && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '3px', background: 'var(--border)', zIndex: 100
        }}>
          <div style={{
            height: '100%', background: 'var(--accent)',
            width: '70%', transition: 'width 2s ease'
          }} />
        </div>
      )}

      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '1.5rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem'
          }}>New scan</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload a CT or MRI brain scan for AI analysis
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* LEFT — upload */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                fontSize: '0.78rem', fontWeight: 500,
                color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem'
              }}>Scan modality</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['ct', 'mri'] as const).map(m => (
                  <button key={m} onClick={() => setModality(m)} style={{
                    padding: '0.4rem 1.25rem',
                    border: `1px solid ${modality === m ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '6px', cursor: 'pointer',
                    background: modality === m ? 'var(--accent-dim)' : 'var(--surface)',
                    color: modality === m ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace', fontSize: '0.8rem',
                    fontWeight: modality === m ? 600 : 400,
                    transition: 'all 0.15s'
                  }}>{m.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {/* dropzone */}
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '10px', padding: '2rem',
              textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'var(--accent-dim)' : 'var(--surface)',
              transition: 'all 0.15s', marginBottom: '1rem',
              minHeight: '220px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <input {...getInputProps()} />
              {preview ? (
                <img src={preview} alt="preview" style={{
                  maxHeight: '160px', maxWidth: '100%',
                  borderRadius: '6px', objectFit: 'contain'
                }} />
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧠</div>
                  <p style={{
                    fontSize: '0.875rem', color: 'var(--text-primary)',
                    fontWeight: 500, marginBottom: '0.25rem'
                  }}>
                    {isDragActive ? 'Drop the scan here' : 'Drag & drop a scan'}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    or click to browse · JPG, PNG
                  </p>
                </>
              )}
            </div>

            {file && (
              <div style={{
                marginBottom: '1rem', padding: '0.6rem 0.9rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '6px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{file.name}</span>
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.72rem', color: 'var(--text-muted)'
                }}>
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
            )}

            <button onClick={handleAnalyse} disabled={!file || loading} style={{
              width: '100%', padding: '0.75rem',
              background: !file || loading ? 'var(--border-2)' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: !file || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s'
            }}>
              {loading ? 'Analysing...' : 'Analyse scan'}
            </button>

            {error && (
              <div style={{
                marginTop: '1rem', background: 'var(--danger-dim)',
                border: '1px solid #FCA5A5', borderRadius: '6px',
                padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: '#B91C1C'
              }}>{error}</div>
            )}
          </div>

          {/* RIGHT — results */}
          <div className={results ? 'animate-slide-in' : ''}>
            {!results ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '3rem 2rem',
                textAlign: 'center', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Results will appear here after analysis
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* disagreement banner */}
                {hasDisagreement() && (
                  <div style={{
                    background: 'var(--amber-dim)', border: '1px solid #FDE68A',
                    borderRadius: '8px', padding: '0.75rem 1rem',
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
                  }}>
                    <span style={{ color: 'var(--amber)' }}>⚠</span>
                    <span style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.5 }}>
                      Models disagree — radiologist review recommended
                    </span>
                  </div>
                )}

                {/* low confidence warning */}
                {getConfidenceWarning() && (
                  <div style={{
                    background: '#FFF7ED', border: '1px solid #FED7AA',
                    borderRadius: '8px', padding: '0.75rem 1rem',
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
                  }}>
                    <span style={{ color: '#EA580C' }}>◐</span>
                    <span style={{ fontSize: '0.8rem', color: '#9A3412', lineHeight: 1.5 }}>
                      Low confidence result (60–75%) — treat with caution
                    </span>
                  </div>
                )}

                {/* consensus */}
                <div style={{
                  background: 'var(--surface)',
                  border: `1px solid ${consensus === 'Tumor' ? '#FCA5A5' : '#6EE7B7'}`,
                  borderRadius: '10px', padding: '1.25rem', textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.72rem', fontFamily: 'DM Mono, monospace',
                    color: 'var(--text-muted)', marginBottom: '0.35rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em'
                  }}>Consensus result</div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 700,
                    color: consensus === 'Tumor' ? 'var(--danger)' : 'var(--success)'
                  }}>{consensus}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {[results.cnn.prediction, results.vit.prediction, results.rf.prediction]
                      .filter(v => v === 'Tumor').length}/3 models detected tumor
                  </div>
                </div>

                {/* CNN primary result */}
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '1.25rem'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '0.75rem'
                  }}>
                    <div>
                      <div style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
                        color: 'var(--accent)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '0.2rem'
                      }}>CNN · Primary model</div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif', fontSize: '1.3rem',
                        fontWeight: 700,
                        color: results.cnn.prediction === 'Tumor' ? 'var(--danger)' : 'var(--success)'
                      }}>{results.cnn.prediction}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
                        color: 'var(--text-muted)', marginBottom: '0.2rem'
                      }}>Confidence</div>
                      <div style={{
                        fontFamily: 'DM Mono, monospace', fontSize: '1.3rem',
                        fontWeight: 500, color: 'var(--text-primary)'
                      }}>{formatConf(results.cnn.confidence)}</div>
                    </div>
                  </div>

                  {/* gradcam slider */}
                  {gradcam && (
                    <div>
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 500,
                        color: 'var(--text-muted)', marginBottom: '0.5rem'
                      }}>Grad-CAM explainability</div>
                      <div style={{
                        position: 'relative', borderRadius: '6px',
                        overflow: 'hidden', marginBottom: '0.6rem'
                      }}>
                        <img src={gradcam.original_image} alt="scan" style={{
                          width: '100%', display: 'block', borderRadius: '6px'
                        }} />
                        <img src={gradcam.heatmap_overlay} alt="heatmap" style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', opacity: sliderValue, borderRadius: '6px'
                        }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.7rem', color: 'var(--text-muted)',
                          fontFamily: 'DM Mono, monospace'
                        }}>Scan</span>
                        <input type="range" min={0} max={1} step={0.05}
                          value={sliderValue}
                          onChange={e => setSliderValue(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--accent)' }}
                        />
                        <span style={{
                          fontSize: '0.7rem', color: 'var(--text-muted)',
                          fontFamily: 'DM Mono, monospace'
                        }}>Heatmap</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* report button */}
                <button onClick={handleReport} disabled={reportLoading} style={{
                  width: '100%', padding: '0.65rem',
                  background: 'var(--surface)', color: 'var(--accent)',
                  border: '1px solid var(--accent)', borderRadius: '6px',
                  fontSize: '0.875rem', fontWeight: 600,
                  cursor: reportLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  {reportLoading ? 'Generating...' : '↓ Download clinical report'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* expandable breakdown — full width below */}
        {results && (
          <ExpandableBreakdown
            vitPrediction={results.vit.prediction}
            vitConfidence={results.vit.confidence}
            attentionImage={attention?.attention_overlay || null}
            rfPrediction={results.rf.prediction}
            rfConfidence={results.rf.confidence}
            shapFeatures={null}
            loading={expandLoading}
            modality={modality}
          />
        )}
      </div>
    </main>
  )
}