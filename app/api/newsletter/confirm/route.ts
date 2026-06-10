/**
 * GET /api/newsletter/confirm?token=...
 * Confirms a double-opt-in subscription.
 *
 * - Validates token format
 * - Looks up by confirm_token, checks not expired (7 days)
 * - Sets confirmed=true, clears confirm_token (one-time use)
 * - Redirects to /newsletter/confirme
 *
 * If backend not configured, redirects to /newsletter/confirme anyway (UX).
 */
import { NextResponse } from 'next/server'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://lecommerceagentique.fr'
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=invalid`)
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=ok`)
  }

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=ok`)
  }

  try {
    const { data: row, error: fetchErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, subscribed_at, confirmed')
      .eq('confirm_token', token)
      .maybeSingle()

    if (fetchErr || !row) {
      return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=invalid`)
    }

    // Already confirmed — idempotent success
    if (row.confirmed) {
      return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=ok`)
    }

    // Check 7-day TTL
    const subscribedAt = new Date(row.subscribed_at).getTime()
    if (Date.now() - subscribedAt > TOKEN_TTL_MS) {
      return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=expired`)
    }

    await supabase
      .from('newsletter_subscribers')
      .update({
        confirmed: true,
        confirm_token: null, // one-time use
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=ok`)
  } catch (err) {
    console.error('[newsletter/confirm] error:', err)
    return NextResponse.redirect(`${BASE_URL}/newsletter/confirme?status=invalid`)
  }
}
