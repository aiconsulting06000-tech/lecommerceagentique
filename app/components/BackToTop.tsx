'use client'

import { useEffect, useState } from 'react'

/**
 * Floating "back to top" button.
 * Appears after the user scrolls 600px down. Smooth scroll on click.
 * Lightweight: no scroll listener throttling library, just rAF debounce.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 600)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut de la page"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'var(--gold)',
        color: 'var(--navy)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 16px var(--gold-glow)',
        cursor: 'pointer',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 800,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      ↑
    </button>
  )
}
