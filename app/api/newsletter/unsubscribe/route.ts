/**
 * GET /api/newsletter/unsubscribe?token=...
 * One-click unsubscribe (RFC 8058 compatible).
 *
 * - Validates token format
 * - Sets unsubscribed_at to now()
 * - Token remains valid (idempotent re-clicks redirect to OK page)
 */
import { NextResponse } from 'next/server'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://lecommerceagentique.fr'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=invalid`)
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=ok`)
  }

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=ok`)
  }

  try {
    const { data: row } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('unsubscribe_token', token)
      .maybeSingle()

    if (!row) {
      return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=invalid`)
    }

    await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', row.id)

    return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=ok`)
  } catch (err) {
    console.error('[newsletter/unsubscribe] error:', err)
    return NextResponse.redirect(`${BASE_URL}/newsletter/desabonne?status=invalid`)
  }
}

// RFC 8058: One-click unsubscribe via POST is also supported by some clients (Gmail / Yahoo).
export async function POST(req: Request) {
  return GET(req)
}
