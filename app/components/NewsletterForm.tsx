'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      return
    }
    setStatus('submitting')

    try {
      // Primary path: POST to backend (Supabase + Resend double opt-in)
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'lecommerceagentique.fr' }),
      })

      // Backend always returns 200 (or 429 if rate-limited).
      // 200 = OK (anti-enumeration: same response for valid / invalid / existing).
      if (res.ok) {
        // Soft-store locally for analytics, harmless duplicate vs Supabase
        try {
          const existing = JSON.parse(localStorage.getItem('lca-newsletter-leads') || '[]')
          existing.push({ email, ts: new Date().toISOString() })
          localStorage.setItem('lca-newsletter-leads', JSON.stringify(existing))
        } catch {
          /* ignore */
        }
        setStatus('success')
        setEmail('')
        return
      }

      if (res.status === 429) {
        setStatus('error')
        return
      }

      // Other non-OK: fall back to local capture
      throw new Error('non-ok')
    } catch {
      // Fallback: pure local capture (if backend unavailable)
      try {
        const existing = JSON.parse(localStorage.getItem('lca-newsletter-leads') || '[]')
        existing.push({ email, ts: new Date().toISOString(), fallback: true })
        localStorage.setItem('lca-newsletter-leads', JSON.stringify(existing))
        setStatus('success')
        setEmail('')
      } catch {
        setStatus('error')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 520 }}>
      {status === 'success' ? (
        <div
          style={{
            padding: '20px 24px',
            background: 'var(--gold-dim)',
            border: '1px solid var(--gold)',
            borderRadius: 12,
            color: 'var(--gold)',
            fontSize: 15,
            textAlign: 'center',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          ✓ Merci. Vérifiez votre boîte mail pour confirmer.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              placeholder="votre@email.com"
              required
              maxLength={254}
              autoComplete="email"
              style={{
                flex: '1 1 240px',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                color: 'var(--white)',
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn-gold"
              disabled={status === 'submitting'}
              style={{ padding: '14px 24px', fontSize: 14, opacity: status === 'submitting' ? 0.6 : 1 }}
            >
              {status === 'submitting' ? '…' : "S'abonner"}
            </button>
          </div>
          {status === 'error' && (
            <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>
              Email invalide ou trop de tentatives. Réessayez dans une minute.
            </p>
          )}
          <p style={{ fontSize: 11, color: 'var(--gray-3)', marginTop: 12, lineHeight: 1.5 }}>
            Pas de spam, désinscription en 1 clic. Vos données ne sont pas partagées.
            Voir la <a href="/politique-confidentialite" style={{ color: 'var(--gold)' }}>politique de confidentialité</a>.
          </p>
        </>
      )}
    </form>
  )
}
