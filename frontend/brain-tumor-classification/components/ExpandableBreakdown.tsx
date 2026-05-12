'use client'

import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts'

interface ShapFeature {
  feature: string
  shap_value: number
  feature_value: number
  direction: string
}

interface Props {
  vitPrediction: string
  vitConfidence: number
  attentionImage: string | null
  rfPrediction: string
  rfConfidence: number
  shapFeatures: ShapFeature[] | null
  loading?: boolean
}

const featureLabels: Record<string, string> = {
  entropy: 'Entropy',
  glcm_homogeneity: 'Homogeneity',
  glcm_contrast: 'Contrast',
  glcm_correlation: 'Correlation',
  glcm_energy: 'Energy',
  glcm_ASM: 'ASM',
  glcm_dissimilarity: 'Dissimilarity',
  solidity: 'Solidity',
  extent: 'Extent',
  eccentricity: 'Eccentricity',
  mean_intensity: 'Mean Intensity',
  std_intensity: 'Std Intensity',
  skewness: 'Skewness',
  kurtosis: 'Kurtosis',
  area: 'Area',
  perimeter: 'Perimeter',
  roundness: 'Roundness',
  aspect_ratio: 'Aspect Ratio',
  percentile_50: 'Median',
  percentile_90: 'P90',
  variance: 'Variance',
  energy: 'Energy',
}

export default function ExpandableBreakdown({
  vitPrediction,
  vitConfidence,
  attentionImage,
  rfPrediction,
  rfConfidence,
  shapFeatures,
  loading = false
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const maxShap = shapFeatures
    ? Math.max(...shapFeatures.map(f => Math.abs(f.shap_value)), 0.001)
    : 1

  // build radar data from top 6 shap features
  const radarData = shapFeatures?.slice(0, 6).map(f => ({
    feature: featureLabels[f.feature] || f.feature,
    value: Math.abs(f.feature_value),
    fullMark: Math.abs(f.feature_value) * 1.5 || 1
  })) || []

  const predColor = (pred: string) =>
    pred === 'Tumor' ? 'var(--danger)' : 'var(--success)'

  const predBg = (pred: string) =>
    pred === 'Tumor' ? 'var(--danger-dim)' : 'var(--success-dim)'

  const formatFeatureName = (name: string) =>
    featureLabels[name] || name.replace(/_/g, ' ')

  const formatConf = (c: number) =>
    c <= 1 ? `${(c * 100).toFixed(1)}%` : `${c.toFixed(1)}%`

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          background: isExpanded ? 'var(--accent-dim)' : 'var(--surface)',
          border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '8px',
          padding: '0.75rem 1.25rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.7rem',
            color: isExpanded ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>▼</span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: isExpanded ? 'var(--accent)' : 'var(--text-primary)',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {isExpanded ? 'Hide' : 'View'} detailed model breakdown
          </span>
        </div>
        <span style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em'
        }}>
          ViT · Attention map · RF · SHAP
        </span>
      </button>

      {/* expanded content */}
      {isExpanded && (
        <div style={{
          marginTop: '1rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          animation: 'fadeUp 0.3s ease forwards'
        }}>

          {/* ViT card */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {/* header */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--accent)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem'
              }}>Vision Transformer</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Captures global spatial relationships via self-attention across 64 image patches
              </p>
            </div>

            {/* prediction row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: predBg(vitPrediction),
              border: `1px solid ${predColor(vitPrediction)}20`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Prediction</div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: predColor(vitPrediction)
                }}>{vitPrediction}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Confidence</div>
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>{formatConf(vitConfidence)}</div>
              </div>
            </div>

            {/* attention map */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.5rem'
              }}>Attention map — ViT focus areas</div>

              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {loading ? (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }} />
                ) : attentionImage ? (
                  <img
                    src={attentionImage}
                    alt="ViT Attention Map"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '2px',
                      marginBottom: '0.5rem'
                    }}>
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} style={{
                          aspectRatio: '1',
                          borderRadius: '2px',
                          background: `rgba(37, 99, 235, ${Math.random() * 0.6 + 0.1})`
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Attention map unavailable
                    </p>
                  </div>
                )}
              </div>
              <p style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '0.4rem',
                fontFamily: 'DM Mono, monospace'
              }}>
                Warmer patches = higher model attention
              </p>
            </div>
          </div>

          {/* RF card */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {/* header */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--accent)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem'
              }}>Random Forest · Radiomics</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Interpretable decision from 30 quantitative radiomics features via SHAP analysis
              </p>
            </div>

            {/* prediction row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: predBg(rfPrediction),
              border: `1px solid ${predColor(rfPrediction)}20`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Prediction</div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: predColor(rfPrediction)
                }}>{rfPrediction}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Confidence</div>
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>{formatConf(rfConfidence)}</div>
              </div>
            </div>

            {/* SHAP bars */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.75rem'
              }}>SHAP feature importance — this scan</div>

              {shapFeatures ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {shapFeatures.map((f) => (
                    <div key={f.feature}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--text-primary)'
                        }}>{formatFeatureName(f.feature)}</span>
                        <span style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '0.7rem',
                          color: f.direction === 'tumor' ? 'var(--danger)' : 'var(--success)'
                        }}>
                          {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                        </span>
                      </div>
                      <div style={{
                        background: 'var(--surface-2)',
                        borderRadius: '4px',
                        height: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '4px',
                          background: f.direction === 'tumor' ? 'var(--danger)' : 'var(--success)',
                          width: `${(Math.abs(f.shap_value) / maxShap) * 100}%`,
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                      <div style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '0.62rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.15rem'
                      }}>
                        value: {f.feature_value.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem'
                }}>
                  {loading ? 'Computing SHAP values...' : 'SHAP values unavailable'}
                </div>
              )}
            </div>

            {/* radar chart */}
            {radarData.length > 0 && (
              <div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem'
                }}>Feature profile — radar view</div>
                <div style={{ height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="feature"
                        tick={{
                          fontSize: 9,
                          fill: 'var(--text-muted)',
                          fontFamily: 'DM Mono, monospace'
                        }}
                      />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar
                        name="Feature value"
                        dataKey="value"
                        stroke="var(--accent)"
                        fill="var(--accent)"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'DM Mono, monospace'
                        }}
                        formatter={(value: any) => [Number(value).toFixed(4), 'Value']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p style={{
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  fontFamily: 'DM Mono, monospace',
                  marginTop: '0.25rem'
                }}>
                  Top 6 SHAP features · absolute values
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}