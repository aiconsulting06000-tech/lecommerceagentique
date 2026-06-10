/**
 * GET /api/newsletter/diag?token=ADMIN_SECRET
 * Diagnoses env-var configuration without revealing secret values.
 * Protected by ADMIN_SECRET. Intended for one-shot debugging — safe to leave
 * in production because the auth gate prevents enumeration.
 */
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'
import { isResendConfigured } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEquals(a: string, b: string): boolean {
  if (!a || !b) return false
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  try {
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

function diagnoseSupabaseUrl(raw: string | undefined): {
  set: boolean
  length: number
  startsWithHttps: boolean
  endsWithSupabaseCo: boolean
  hasTrailingSlash: boolean
  hasWhitespace: boolean
  hasQuotes: boolean
  formatLooksValid: boolean
  // Reveal only the host shape (anonymized): "xxxxxxxxxxxxxxxxxxxx.supabase.co"
  hostShape: string
} {
  const v = raw ?? ''
  const hostMatch = v.match(/^https?:\/\/([^/]+)/)
  const host = hostMatch ? hostMatch[1] : ''
  const hostShape = host
    .split('.')
    .map((part, i) => (i === 0 ? 'x'.repeat(part.length) : part))
    .join('.')

  return {
    set: !!v,
    length: v.length,
    startsWithHttps: v.startsWith('https://'),
    endsWithSupabaseCo: v.endsWith('.supabase.co'),
    hasTrailingSlash: v.endsWith('/'),
    hasWhitespace: /\s/.test(v),
    hasQuotes: v.startsWith('"') || v.endsWith('"') || v.startsWith("'") || v.endsWith("'"),
    formatLooksValid: /^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(v),
    hostShape,
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  const adminSecret = process.env.ADMIN_SECRET || ''

  if (!safeEquals(token, adminSecret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = diagnoseSupabaseUrl(process.env.SUPABASE_URL)
  const serviceKeyLen = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length
  const resendKeyLen = (process.env.RESEND_API_KEY || '').length
  const cronSecretLen = (process.env.CRON_SECRET || '').length

  // Try a live Supabase round-trip — the client now normalizes URLs internally,
  // so we always probe if configured (no precondition on formatLooksValid).
  let supabaseProbe: {
    ok: boolean
    error?: string
    rowCount?: number
    activeSubs?: number
  } = { ok: false, error: 'not configured' }

  if (isSupabaseConfigured()) {
    const client = getSupabaseServer()
    if (client) {
      try {
        // Total count
        const { count, error } = await client
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
        if (error) {
          supabaseProbe = { ok: false, error: `${error.code || ''} ${error.message}`.trim() }
        } else {
          // Active count (confirmed & not unsubscribed)
          const { count: activeCount } = await client
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('confirmed', true)
            .is('unsubscribed_at', null)
          supabaseProbe = {
            ok: true,
            rowCount: count ?? 0,
            activeSubs: activeCount ?? 0,
          }
        }
      } catch (e) {
        supabaseProbe = { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: {
        set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: serviceKeyLen,
        looksLikeJWT: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').startsWith('eyJ'),
      },
      RESEND_API_KEY: {
        set: !!process.env.RESEND_API_KEY,
        length: resendKeyLen,
        startsWithRe: (process.env.RESEND_API_KEY || '').startsWith('re_'),
      },
      CRON_SECRET: { set: !!process.env.CRON_SECRET, length: cronSecretLen },
      ADMIN_SECRET: { set: !!process.env.ADMIN_SECRET, length: adminSecret.length },
    },
    flags: {
      supabaseConfigured: isSupabaseConfigured(),
      resendConfigured: isResendConfigured(),
    },
    supabaseProbe,
    hint:
      'PGRST125 = "Invalid path specified in request URL". ' +
      'Usually a trailing slash, an extra path segment, or a wrong TLD (.com vs .co).',
  })
}
