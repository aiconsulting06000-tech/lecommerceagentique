import Link from 'next/link'
import type { Metadata } from 'next'
import NewsFeed from '../components/NewsFeed'
import { fetchVisibleNews } from '../../lib/news'

export const revalidate = 600 // Re-fetch every 10 min

export const metadata: Metadata = {
  title: 'Veille du commerce agentique — actualités quotidiennes',
  description:
    "Le fil de veille quotidienne du Commerce Agentique. Annonces de standards, évolutions réglementaires, cas d'usage, sécurité, adoption marchande — décryptés au fil de l'eau.",
  alternates: { canonical: 'https://lecommerceagentique.fr/veille' },
  openGraph: {
    type: 'website',
    url: 'https://lecommerceagentique.fr/veille',
    siteName: 'Le Commerce Agentique',
    title: 'Veille du commerce agentique',
    description:
      "Le fil de veille quotidienne — standards, régulation, cas d'usage, adoption.",
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
}

export default async function VeillePage() {
  const entries = await fetchVisibleNews(100)
  const url = 'https://lecommerceagentique.fr/veille'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    headline: 'Veille du commerce agentique',
    description:
      "Le fil de veille quotidienne du Commerce Agentique : annonces de standards, évolutions réglementaires, cas d'usage, adoption marchande.",
    inLanguage: 'fr-FR',
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: entries.length,
      itemListElement: entries.slice(0, 20).map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'NewsArticle',
          headline: e.title,
          datePublished: e.published_at,
          description: e.snippet,
          articleSection: e.category,
          ...(e.source_url && { sameAs: [e.source_url] }),
        },
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Le Commerce Agentique — édité par ACF®',
      url: 'https://lecommerceagentique.fr',
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header sticky */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '18px 0',
          position: 'sticky',
          top: 0,
          background: 'rgba(5, 12, 26, 0.78)',
          backdropFilter: 'blur(20px)',
          zIndex: 50,
        }}
      >
        <div
          className="container-x"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: 'var(--gold)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'var(--navy)',
                fontSize: 12,
                letterSpacing: '0.06em',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              LCA
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Le Commerce Agentique
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--gold)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Décrypter le commerce des agents IA
              </div>
            </div>
          </Link>
          <Link href="/" className="badge" style={{ padding: '7px 14px' }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section style={{ padding: '64px 0 24px' }}>
        <div className="container-narrow">
          <span className="eyebrow">Veille · Mise à jour quotidienne</span>
          <h1 className="display-2" style={{ marginBottom: 24, lineHeight: 1.1 }}>
            Le fil de veille du<br />
            <span className="gradient-gold">commerce agentique.</span>
          </h1>
          <p className="lead" style={{ maxWidth: 740, marginBottom: 32 }}>
            Annonces de standards, évolutions réglementaires, cas d&apos;usage, sécurité,
            adoption marchande. Décryptés au fil de l&apos;eau par la rédaction LCA.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className="chip-gold">{entries.length} entrées</span>
            <span className="chip">Mis à jour quotidiennement</span>
            <span className="chip">Sources publiques</span>
          </div>
        </div>
      </section>

      {/* Feed complet */}
      <NewsFeed entries={entries} hideMore eyebrow="Toutes les actualités" />

      {/* Footer */}
      <footer
        style={{
          padding: '40px 0',
          borderTop: '1px solid var(--border)',
          background: 'var(--navy-2)',
          marginTop: 64,
        }}
      >
        <div
          className="container-x"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12,
            color: 'var(--gray-3)',
          }}
        >
          <div>© 2026 Le Commerce Agentique — Édité par ACF®.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/mentions-legales" style={{ color: 'var(--gray-3)' }}>
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" style={{ color: 'var(--gray-3)' }}>
              Confidentialité
            </Link>
            <Link href="/cgu" style={{ color: 'var(--gray-3)' }}>
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
