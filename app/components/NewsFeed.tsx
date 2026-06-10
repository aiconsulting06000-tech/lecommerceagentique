import Link from 'next/link'
import { relativeTimeFr, type NewsEntry } from '../../lib/news'

interface Props {
  entries: NewsEntry[]
  /** When true, hides the "Voir tout" footer link (used on /veille page itself) */
  hideMore?: boolean
  /** Section eyebrow override */
  eyebrow?: string
}

/**
 * Feed Twitter/Stratechery-style with a red "NEWS" badge at the top.
 * Server-renderable. Used on the home (5 entries) and on /veille (all).
 */
export default function NewsFeed({ entries, hideMore, eyebrow }: Props) {
  return (
    <section className="section" id="news" style={{ position: 'relative' }}>
      <div className="container-narrow">
        {/* Header avec badge rouge NEWS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#ef4444',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.18em',
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.6)',
                animation: 'news-pulse 1.8s infinite',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  background: '#fff',
                  borderRadius: '50%',
                  animation: 'news-dot 1.8s infinite',
                }}
              />
              NEWS
            </span>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--white)',
                margin: 0,
              }}
            >
              {eyebrow || 'Veille du commerce agentique'}
            </h2>
          </div>
          {!hideMore && (
            <Link
              href="/veille"
              style={{
                color: 'var(--gold)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Voir toute la veille →
            </Link>
          )}
        </div>

        {/* Feed des entrées */}
        {entries.length === 0 ? (
          <div
            style={{
              padding: 32,
              border: '1px dashed var(--border-strong)',
              borderRadius: 10,
              textAlign: 'center',
              color: 'var(--gray-3)',
              fontSize: 14,
            }}
          >
            Aucune actualité publiée pour l&apos;instant. Première édition imminente.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {entries.map((e) => (
              <article
                key={e.id}
                className="glow-card"
                style={{
                  background: 'var(--navy-2)',
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr',
                  gap: 18,
                  alignItems: 'start',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      background: 'var(--gold-dim)',
                      color: 'var(--gold)',
                      border: '1px solid var(--gold-glow)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    {e.category}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: 'var(--gray-3)',
                      textAlign: 'center',
                    }}
                  >
                    {relativeTimeFr(e.published_at)}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: 'var(--white)',
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                      margin: '0 0 8px',
                    }}
                  >
                    {e.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--gray-1)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {e.snippet}
                  </p>
                  {e.source_url && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--gray-3)',
                        marginTop: 10,
                      }}
                    >
                      Source :{' '}
                      <a
                        href={e.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        style={{
                          color: 'var(--gold)',
                          textDecoration: 'none',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                        }}
                      >
                        {e.source_name || new URL(e.source_url).hostname.replace(/^www\./, '')} ↗
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Keyframes pour les animations (inline car SSR-safe) */}
      <style>{`
        @keyframes news-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          50%      { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        @keyframes news-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </section>
  )
}
