'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Navbar({ showAuth = true }: { showAuth?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2.5rem',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(240,244,255,0.9)',
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
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Upload scan', href: '/upload' },
            { label: 'Benchmarks', href: '/models' },
            { label: 'Research', href: '/resources' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              textDecoration: 'none', fontSize: '0.85rem',
              padding: '0.35rem 0.75rem', borderRadius: '6px',
              color: isActive(item.href) ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive(item.href) ? 'var(--accent-dim)' : 'transparent',
              fontWeight: isActive(item.href) ? 500 : 400
            }}>{item.label}</Link>
          ))}
        </div>
      </div>

      {showAuth && (
        <button onClick={handleSignOut} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '0.35rem 0.9rem',
          fontSize: '0.8rem', color: 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
        }}>Sign out</button>
      )}
    </nav>
  )
}