/**
 * POST   /api/admin/news       — create a news entry
 * PATCH  /api/admin/news?id=…  — update active flag, title, snippet, etc.
 * DELETE /api/admin/news?id=…  — soft delete via active=false (we keep history)
 *
 * Auth: Bearer ADMIN_SECRET (Authorization header).
 */
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'

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

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.ADMIN_SECRET
  if (!expected || !auth.startsWith('Bearer ')) return false
  return safeEquals(auth.slice(7), expected)
}

interface NewsInput {
  title?: string
  snippet?: string
  category?: string
  source_url?: string | null
  source_name?: string | null
  published_at?: string
  display_after?: string
  active?: boolean
}

function clean(input: NewsInput, isCreate: boolean) {
  const out: Record<string, unknown> = {}
  if (typeof input.title === 'string') {
    const t = input.title.trim()
    if (t.length < 3 || t.length > 240) throw new Error('title length out of bounds (3-240)')
    out.title = t
  } else if (isCreate) {
    throw new Error('title is required')
  }
  if (typeof input.snippet === 'string') {
    const s = input.snippet.trim()
    if (s.length < 3 || s.length > 800) throw new Error('snippet length out of bounds (3-800)')
    out.snippet = s
  } else if (isCreate) {
    throw new Error('snippet is required')
  }
  if (typeof input.category === 'string') {
    const c = input.category.trim()
    if (c.length < 2 || c.length > 40) throw new Error('category length out of bounds (2-40)')
    out.category = c
  } else if (isCreate) {
    throw new Error('category is required')
  }
  if (input.source_url !== undefined) {
    if (input.source_url === null || input.source_url === '') {
      out.source_url = null
    } else if (typeof input.source_url === 'string') {
      try {
        new URL(input.source_url)
        out.source_url = input.source_url
      } catch {
        throw new Error('source_url is not a valid URL')
      }
    }
  }
  if (input.source_name !== undefined) {
    if (input.source_name === null || input.source_name === '') {
      out.source_name = null
    } else if (typeof input.source_name === 'string') {
      const n = input.source_name.trim()
      if (n.length > 100) throw new Error('source_name too long')
      out.source_name = n
    }
  }
  if (typeof input.published_at === 'string') {
    if (Number.isNaN(Date.parse(input.published_at))) {
      throw new Error('published_at is not a valid ISO timestamp')
    }
    out.published_at = input.published_at
  } else if (isCreate) {
    throw new Error('published_at is required')
  }
  if (typeof input.display_after === 'string') {
    if (Number.isNaN(Date.parse(input.display_after))) {
      throw new Error('display_after is not a valid ISO timestamp')
    }
    out.display_after = input.display_after
  }
  if (typeof input.active === 'boolean') {
    out.active = input.active
  }
  return out
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'backend_not_configured' }, { status: 503 })
  }

  let body: NewsInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let row: Record<string, unknown>
  try {
    row = clean(body, true)
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'invalid_input' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseServer()!
  const { data, error } = await supabase.from('news_ticker').insert(row).select().single()
  if (error) {
    console.error('[admin/news POST]', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'insert_failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, entry: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'backend_not_configured' }, { status: 503 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 })
  }

  let body: NewsInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let patch: Record<string, unknown>
  try {
    patch = clean(body, false)
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'invalid_input' },
      { status: 400 },
    )
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: 'nothing_to_update' }, { status: 400 })
  }

  const supabase = getSupabaseServer()!
  const { data, error } = await supabase
    .from('news_ticker')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('[admin/news PATCH]', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'update_failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, entry: data })
}

export async function DELETE(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'backend_not_configured' }, { status: 503 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 })
  }

  const supabase = getSupabaseServer()!
  const { error } = await supabase.from('news_ticker').update({ active: false }).eq('id', id)
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'delete_failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true })
}
