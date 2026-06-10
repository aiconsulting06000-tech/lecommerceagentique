import { timingSafeEqual } from 'node:crypto'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseServer, isSupabaseConfigured } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin · Newsletter',
  robots: { index: false, follow: false, nocache: true },
}

type Params = Promise<{ [key: string]: string | string[] | undefined }>

interface Sub {
  id: string
  email: string
  confirmed: boolean
  subscribed_at: string
  confirmed_at: string | null
  unsubscribed_at: string | null
  source: string
}

interface Run {
  id: string
  label: string
  sent_count: number
  failed_count: number
  ran_at: string
  article_slugs: string[] | null
}

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

function fmt(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return d
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Params
}) {
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token : ''
  const adminSecret = process.env.ADMIN_SECRET || ''
  const showRaw = sp.raw === '1'

  // ── Auth gate ──────────────────────────────────────────────────
  if (!safeEquals(token, adminSecret)) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--navy)',
          color: 'var(--gray-1)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 42,
              fontWeight: 800,
              color: 'var(--gold)',
              marginBottom: 18,
              letterSpacing: '-0.02em',
            }}
          >
            401
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              marginBottom: 12,
              color: 'var(--white)',
            }}
          >
            Accès refusé.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Cette page est réservée à l&apos;administration. Munissez-vous d&apos;un
            jeton d&apos;accès valide.
          </p>
          <Link href="/" style={{ color: 'var(--gold)', fontSize: 14 }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    )
  }

  // ── Backend offline guard ──────────────────────────────────────
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: 64, color: 'var(--gray-1)' }}>
        <h1 style={{ color: 'var(--gold)', marginBottom: 12 }}>
          Backend non configuré
        </h1>
        <p>
          Les variables d&apos;environnement Supabase ne sont pas posées (
          <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>).
        </p>
      </main>
    )
  }

  const supabase = getSupabaseServer()!
  const [subsRes, runsRes] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false }),
    supabase
      .from('newsletter_runs')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(20),
  ])

  const subs: Sub[] = (subsRes.data as Sub[]) || []
  const runs: Run[] = (runsRes.data as Run[]) || []

  const active = subs.filter((s) => s.confirmed && !s.unsubscribed_at)
  const pending = subs.filter((s) => !s.confirmed && !s.unsubscribed_at)
  const unsub = subs.filter((s) => s.unsubscribed_at)
  const totalSent = runs.reduce((acc, r) => acc + (r.sent_count || 0), 0)
  const totalFailed = runs.reduce((acc, r) => acc + (r.failed_count || 0), 0)
  const lastRun = runs[0] || null

  const kpis = [
    { label: 'Abonnés actifs', value: active.length, accent: true },
    { label: 'En attente', value: pending.length },
    { label: 'Désabonnés', value: unsub.length },
    { label: 'Emails envoyés (total)', value: totalSent },
    { label: 'Emails échoués (total)', value: totalFailed },
    { label: 'Runs effectués', value: runs.length },
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--navy)',
        color: 'var(--gray-1)',
        padding: '32px 24px 80px',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
            paddingBottom: 18,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--gold)',
                letterSpacing: '0.16em',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Admin · Newsletter
            </div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                color: 'var(--white)',
                letterSpacing: '-0.02em',
              }}
            >
              Le Brief A-commerce
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                fontSize: 12,
                color: 'var(--gray-3)',
                textDecoration: 'none',
                padding: '8px 14px',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              ← Site
            </Link>
            <a
              href={`/admin/newsletter?token=${encodeURIComponent(token)}&raw=${showRaw ? '0' : '1'}`}
              style={{
                fontSize: 12,
                color: showRaw ? 'var(--navy)' : 'var(--gold)',
                background: showRaw ? 'var(--gold)' : 'transparent',
                textDecoration: 'none',
                padding: '8px 14px',
                border: '1px solid var(--gold-dim)',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {showRaw ? 'Masquer emails' : 'Afficher emails complets'}
            </a>
          </div>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 40,
          }}
        >
          {kpis.map((k) => (
            <div
              key={k.label}
              className="glow-card"
              style={{
                padding: '18px 20px',
                background: k.accent ? 'var(--navy-2)' : 'var(--navy-2)',
                borderColor: k.accent ? 'var(--gold-dim)' : 'var(--border)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  color: k.accent ? 'var(--gold)' : 'var(--white)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {k.value.toLocaleString('fr-FR')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gray-3)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dernier envoi */}
        {lastRun && (
          <div
            className="glow-card"
            style={{
              padding: 20,
              marginBottom: 32,
              background: 'var(--navy-2)',
              borderColor: 'var(--gold-dim)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gold)',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Dernier envoi
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 18,
                  color: 'var(--white)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {lastRun.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-3)' }}>{fmt(lastRun.ran_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--gold)',
                  }}
                >
                  {lastRun.sent_count}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-3)' }}>envoyés</div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: lastRun.failed_count > 0 ? '#f87171' : 'var(--gray-1)',
                  }}
                >
                  {lastRun.failed_count}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-3)' }}>échoués</div>
              </div>
            </div>
          </div>
        )}

        {/* Section runs */}
        <Section title={`Historique des envois (${runs.length})`}>
          {runs.length === 0 ? (
            <Empty>Aucun envoi pour l&apos;instant. Le 1ᵉʳ Brief partira lundi 15 juin à 10h00 heure de Paris.</Empty>
          ) : (
            <Table
              head={['Date', 'Label', 'Envoyés', 'Échoués', 'Articles']}
              rows={runs.map((r) => [
                fmt(r.ran_at),
                r.label,
                String(r.sent_count),
                r.failed_count > 0 ? (
                  <span style={{ color: '#f87171' }} key="f">
                    {r.failed_count}
                  </span>
                ) : (
                  String(r.failed_count)
                ),
                Array.isArray(r.article_slugs) ? r.article_slugs.length : 0,
              ])}
            />
          )}
        </Section>

        {/* Section subscribers */}
        <Section title={`Abonnés (${subs.length})`}>
          {subs.length === 0 ? (
            <Empty>Aucun abonné pour l&apos;instant.</Empty>
          ) : (
            <Table
              head={['Inscrit le', 'Email', 'Statut', 'Confirmé le', 'Source']}
              rows={subs.slice(0, 100).map((s) => [
                fmt(s.subscribed_at),
                showRaw ? s.email : maskEmail(s.email),
                statusBadge(s),
                fmt(s.confirmed_at),
                s.source,
              ])}
            />
          )}
          {subs.length > 100 && (
            <p style={{ fontSize: 12, color: 'var(--gray-3)', marginTop: 12 }}>
              Affichage des 100 plus récents sur {subs.length} au total.
            </p>
          )}
        </Section>

        {/* Outils */}
        <Section title="Outils">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            <ToolCard
              title="Envoyer le Brief maintenant"
              desc="Déclenche /api/newsletter/send (cron-equivalent). Le brief part aux abonnés confirmés."
              cmd="curl -X POST 'https://lecommerceagentique.fr/api/newsletter/send' -H 'Authorization: Bearer $CRON_SECRET'"
            />
            <ToolCard
              title="Export CSV des abonnés"
              desc="Pour Mailchimp, sauvegarde locale, ou audit RGPD."
              cmd={`Direct depuis Supabase Dashboard → Table Editor → newsletter_subscribers → Export → CSV`}
            />
            <ToolCard
              title="Voir les logs Vercel"
              desc="Inspecter les runs ou les erreurs de /api/newsletter/*"
              cmd="npx vercel logs https://lecommerceagentique.fr/api/newsletter/send --json"
            />
          </div>
        </Section>
      </div>
    </main>
  )
}

/* ───────────── Helpers JSX ───────────── */

function statusBadge(s: Sub) {
  if (s.unsubscribed_at) {
    return (
      <span
        key="b"
        style={{
          fontSize: 11,
          padding: '2px 8px',
          background: '#3a2424',
          color: '#f87171',
          borderRadius: 4,
          letterSpacing: '0.04em',
        }}
      >
        Désabonné
      </span>
    )
  }
  if (s.confirmed) {
    return (
      <span
        key="b"
        style={{
          fontSize: 11,
          padding: '2px 8px',
          background: 'var(--gold-dim)',
          color: 'var(--gold)',
          borderRadius: 4,
          letterSpacing: '0.04em',
        }}
      >
        Actif
      </span>
    )
  }
  return (
    <span
      key="b"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        background: '#2a2f3d',
        color: 'var(--gray-2)',
        borderRadius: 4,
        letterSpacing: '0.04em',
      }}
    >
      En attente
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          color: 'var(--gold)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 24,
        border: '1px dashed var(--border-strong)',
        borderRadius: 8,
        color: 'var(--gray-3)',
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function Table({
  head,
  rows,
}: {
  head: string[]
  rows: (string | number | React.ReactNode)[][]
}) {
  return (
    <div
      style={{
        overflow: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          color: 'var(--gray-1)',
        }}
      >
        <thead>
          <tr
            style={{
              background: 'var(--navy-2)',
            }}
          >
            {head.map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid var(--border)',
              }}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ToolCard({ title, desc, cmd }: { title: string; desc: string; cmd: string }) {
  return (
    <div
      className="glow-card"
      style={{
        padding: 18,
        background: 'var(--navy-2)',
      }}
    >
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--white)',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-2)', lineHeight: 1.55, marginBottom: 12 }}>
        {desc}
      </p>
      <pre
        style={{
          background: 'var(--navy)',
          border: '1px solid var(--border)',
          padding: 10,
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--gold)',
          fontFamily: "'JetBrains Mono', monospace",
          overflow: 'auto',
          margin: 0,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {cmd}
      </pre>
    </div>
  )
}
