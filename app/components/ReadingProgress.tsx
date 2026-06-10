'use client'

import { useEffect, useState } from 'react'

/**
 * Thin reading progress bar fixed at the top of the viewport.
 * Tracks document scroll progress (0–100%).
 * Use on long article pages.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight
        const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
        setProgress(pct)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 60,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--gold-2) 0%, var(--gold) 100%)',
          boxShadow: '0 0 8px var(--gold-glow)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}
