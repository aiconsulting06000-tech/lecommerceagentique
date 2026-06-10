/**
 * GET/POST /api/newsletter/send
 * Triggered by Vercel Cron every Monday 08:00 UTC.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 *   Vercel Cron automatically sends this header when CRON_SECRET is set.
 *
 * Behavior:
 *  - Compose this week's Brief from the 3 most recent published articles
 *  - Fetch all confirmed, non-unsubscribed subscribers from Supabase
 *  - Send via Resend (batched, throttled)
 *  - Record run in newsletter_runs table
 *
 * Safe to call manually for testing (just include the Bearer token).
 */
import { NextResponse } from 'next/server'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'
import { getResend, isResendConfigured, NEWSLETTER_FROM, NEWSLETTER_REPLY_TO } from '@/lib/resend'
import { buildBriefEmail, type BriefArticle } from '@/lib/email-templates'
import { ARTICLE_CONTENT } from '@/app/articles/[slug]/articles-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Vercel max for cron

const BASE_URL = 'https://lecommerceagentique.fr'

// Throttle: Resend allows ~10 emails/sec on free tier. We batch with delay.
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 1100

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return auth === `Bearer ${expected}`
}

function weekLabel(d: Date): string {
  // "Semaine du 10 juin 2026"
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  // Monday of the current ISO week
  const monday = new Date(d)
  const day = monday.getUTCDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  monday.setUTCDate(monday.getUTCDate() + diff)
  return `Semaine du ${monday.getUTCDate()} ${months[monday.getUTCMonth()]} ${monday.getUTCFullYear()}`
}

function pickArticles(now: Date, count = 3): BriefArticle[] {
  const all = Object.entries(ARTICLE_CONTENT).map(([slug, a]) => ({
    slug,
    title: a.title,
    desc: a.desc,
    category: a.category,
    readTime: a.readTime,
    publishedAt: a.publishedAt,
  }))
  // Most recent first; only those already published (publishedAt <= now)
  return all
    .filter((a) => new Date(a.publishedAt).getTime() <= now.getTime())
    .sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime())
    .slice(0, count)
    .map((a) => ({
      title: a.title,
      desc: a.desc,
      url: `${BASE_URL}/articles/${a.slug}`,
      category: a.category,
      readTime: a.readTime,
    }))
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function GET(req: Request) {
  return POST(req)
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured() || !isResendConfigured()) {
    return NextResponse.json({
      ok: false,
      error: 'backend_not_configured',
      hint: 'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY env vars.',
    }, { status: 503 })
  }

  const supabase = getSupabaseServer()
  const resend = getResend()
  if (!supabase || !resend) {
    return NextResponse.json({ ok: false, error: 'backend_init_failed' }, { status: 500 })
  }

  const now = new Date()
  const articles = pickArticles(now, 3)

  if (articles.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_articles_to_send' }, { status: 200 })
  }

  const intro =
    "L'essentiel de la semaine sur le commerce agentique, en 5 minutes de lecture. " +
    "Trois analyses sélectionnées par la rédaction LCA."

  // ── Fetch active subscribers ─────────────────────────────────────
  const { data: subs, error: subsErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, unsubscribe_token')
    .eq('confirmed', true)
    .is('unsubscribed_at', null)

  if (subsErr) {
    console.error('[newsletter/send] fetch subs error:', subsErr)
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 })
  }

  if (!subs || subs.length === 0) {
    // Still record a run for visibility
    await supabase.from('newsletter_runs').insert({
      sent_count: 0,
      failed_count: 0,
      label: weekLabel(now),
      article_slugs: articles.map((a) => a.url.split('/').pop()),
    })
    return NextResponse.json({ ok: true, sent: 0, message: 'No active subscribers.' })
  }

  // ── Send in batches ──────────────────────────────────────────────
  const label = weekLabel(now)
  let sent = 0
  let failed = 0

  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (s) => {
        try {
          const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${s.unsubscribe_token}`
          const { subject, html, text } = buildBriefEmail({
            email: s.email,
            unsubUrl,
            weekLabel: label,
            intro,
            articles,
          })
          await resend.emails.send({
            from: NEWSLETTER_FROM,
            to: s.email,
            subject,
            html,
            text,
            replyTo: NEWSLETTER_REPLY_TO,
            headers: {
              // RFC 8058 — one-click unsubscribe in Gmail / Yahoo
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          sent++
        } catch (e) {
          failed++
          console.error('[newsletter/send] email failed for', s.email, e)
        }
      }),
    )
    if (i + BATCH_SIZE < subs.length) await sleep(BATCH_DELAY_MS)
  }

  // ── Record the run ───────────────────────────────────────────────
  await supabase.from('newsletter_runs').insert({
    sent_count: sent,
    failed_count: failed,
    label,
    article_slugs: articles.map((a) => a.url.split('/').pop()),
  })

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    label,
    articles: articles.length,
  })
}
