/**
 * POST /api/newsletter/subscribe
 * Body: { email: string, source?: string }
 *
 * Behavior:
 *  - Validates email (RFC 5322 simplified + length cap)
 *  - Rate limits per IP (5/min) and globally (60/min) — DoS / brute force protection
 *  - Upserts subscriber in Supabase (creates if new, regenerates token if already pending)
 *  - Sends double opt-in confirmation email via Resend
 *  - Returns generic 200 response regardless (anti-enumeration)
 *
 * Falls back to "OK without backend" if Supabase / Resend env vars not configured,
 * so the form remains usable while infra is being provisioned.
 */
import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'
import { getResend, isResendConfigured, NEWSLETTER_FROM, NEWSLETTER_REPLY_TO } from '@/lib/resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateEmail } from '@/lib/esc-html'
import { buildConfirmEmail } from '@/lib/email-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://lecommerceagentique.fr'

// Generic response — never reveal whether email exists / why a request failed.
function ok() {
  return NextResponse.json(
    { ok: true, message: 'Si votre adresse est valide, un email de confirmation arrive.' },
    { status: 200 },
  )
}

export async function POST(req: Request) {
  // ── Rate limiting (per IP + global) ────────────────────────────
  const ip = getClientIp(req)
  const rl = rateLimit(ip, {
    perIp: 5,
    perIpWindowMs: 60_000, // 5 subs/min per IP
    global: 60,
    globalWindowMs: 60_000, // 60 subs/min global
  })
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: 'Trop de requêtes. Réessayez dans une minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } },
    )
  }

  // ── Input validation ───────────────────────────────────────────
  let body: { email?: string; source?: string }
  try {
    body = await req.json()
  } catch {
    return ok() // Don't reveal parser errors
  }
  const email = validateEmail(body.email)
  if (!email) return ok() // Always 200 (anti-enumeration)

  const source = typeof body.source === 'string' && body.source.length <= 100
    ? body.source
    : 'lecommerceagentique.fr'

  // ── If backend not configured, return OK anyway (UX fallback) ──
  if (!isSupabaseConfigured() || !isResendConfigured()) {
    console.log('[newsletter] backend not configured, accepting silently:', email)
    return ok()
  }

  const supabase = getSupabaseServer()
  const resend = getResend()
  if (!supabase || !resend) return ok()

  try {
    // ── Token generation (separate confirm + unsubscribe) ─────────
    const confirmToken = randomBytes(32).toString('hex')
    const unsubscribeToken = randomBytes(32).toString('hex')

    // Upsert: if email already exists & not confirmed, regenerate tokens
    // If already confirmed, do not regenerate confirmToken but still return OK
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, confirmed, unsubscribed_at')
      .eq('email', email)
      .maybeSingle()

    if (existing?.confirmed && !existing.unsubscribed_at) {
      // Already an active subscriber — return OK silently (no re-confirm spam)
      return ok()
    }

    if (existing) {
      // Re-pending or re-subscribing after unsubscribe — refresh tokens
      await supabase
        .from('newsletter_subscribers')
        .update({
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('newsletter_subscribers').insert({
        email,
        confirm_token: confirmToken,
        unsubscribe_token: unsubscribeToken,
        source,
      })
    }

    // ── Send confirmation email ────────────────────────────────────
    const confirmUrl = `${BASE_URL}/api/newsletter/confirm?token=${confirmToken}`
    const { subject, html, text } = buildConfirmEmail({ email, confirmUrl })

    await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: email,
      subject,
      html,
      text,
      replyTo: NEWSLETTER_REPLY_TO,
    })

    return ok()
  } catch (err) {
    // Never leak internal errors to caller
    console.error('[newsletter/subscribe] error:', err)
    return ok()
  }
}
