import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLE_CONTENT, type ArticleContent } from './articles-content'
import ReadingProgress from '../../components/ReadingProgress'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  return Object.keys(ARTICLE_CONTENT).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const a = ARTICLE_CONTENT[slug]
  if (!a) return { title: 'Article introuvable' }
  const url = `https://lecommerceagentique.fr/articles/${slug}`
  return {
    title: a.title,
    description: a.desc.length > 160 ? a.desc.slice(0, 157) + '…' : a.desc,
    keywords: a.tags,
    authors: [{ name: a.author }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: 'Le Commerce Agentique',
      title: a.title,
      description: a.desc,
      publishedTime: a.publishedAt,
      modifiedTime: a.publishedAt,
      authors: [a.author],
      tags: a.tags,
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: a.title,
      description: a.desc,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    category: a.category,
  }
}

const H2: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  marginTop: 56,
  marginBottom: 20,
  color: 'var(--white)',
  lineHeight: 1.2,
}

const H3: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 20,
  fontWeight: 600,
  marginTop: 32,
  marginBottom: 12,
  color: 'var(--white)',
}

function renderBlock(block: ArticleContent['body'][number], i: number) {
  if (block.t === 'p') return <p key={i} style={{ marginBottom: 20 }}>{block.c}</p>
  if (block.t === 'h2') return <h2 key={i} style={H2}>{block.c}</h2>
  if (block.t === 'h3') return <h3 key={i} style={H3}>{block.c}</h3>
  if (block.t === 'ul')
    return (
      <ul key={i} style={{ paddingLeft: 24, marginBottom: 24, marginTop: 8 }}>
        {block.items.map((it, j) => (
          <li key={j} style={{ marginBottom: 10, lineHeight: 1.7 }}>{it}</li>
        ))}
      </ul>
    )
  if (block.t === 'quote')
    return (
      <blockquote
        key={i}
        style={{
          borderLeft: '3px solid var(--gold)',
          paddingLeft: 20,
          margin: '28px 0',
          fontSize: 17,
          fontStyle: 'italic',
          color: 'var(--gray-1)',
          lineHeight: 1.6,
        }}
      >
        {block.c}
        {block.author && <footer style={{ fontSize: 13, color: 'var(--gray-3)', marginTop: 8, fontStyle: 'normal' }}>— {block.author}</footer>}
      </blockquote>
    )
  if (block.t === 'callout')
    return (
      <div
        key={i}
        className="glow-card"
        style={{ padding: 24, margin: '28px 0', background: 'var(--navy-2)' }}
      >
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
          {block.label || 'À retenir'}
        </div>
        <div style={{ fontSize: 15, color: 'var(--gray-1)', lineHeight: 1.7 }}>{block.c}</div>
      </div>
    )
  return null
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params
  const a = ARTICLE_CONTENT[slug]
  if (!a) notFound()

  const url = `https://lecommerceagentique.fr/articles/${slug}`
  const articleBody = a.body
    .filter((b) => b.t === 'p' || b.t === 'h2' || b.t === 'h3')
    .map((b) => (b as { c: string }).c)
    .join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        headline: a.title,
        description: a.desc,
        articleSection: a.category,
        articleBody: articleBody.slice(0, 5000),
        keywords: a.tags.join(', '),
        inLanguage: 'fr-FR',
        url,
        datePublished: a.publishedAt,
        dateModified: a.publishedAt,
        wordCount: articleBody.split(/\s+/).length,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: {
          '@type': 'Organization',
          name: a.author,
          url: 'https://lecommerceagentique.fr',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Le Commerce Agentique — édité par ACF®',
          url: 'https://lecommerceagentique.fr',
          logo: {
            '@type': 'ImageObject',
            url: 'https://lecommerceagentique.fr/favicon.svg',
          },
        },
        isAccessibleForFree: true,
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://lecommerceagentique.fr#website',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://lecommerceagentique.fr' },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: 'https://lecommerceagentique.fr/#articles' },
          { '@type': 'ListItem', position: 3, name: a.title, item: url },
        ],
      },
    ],
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      {/* Header */}
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
        <div className="container-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 38, height: 38, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--navy)', fontSize: 12, letterSpacing: '0.06em', fontFamily: "'Space Grotesk', sans-serif" }}>LCA</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>Le Commerce Agentique</div>
              <div style={{ fontSize: 9.5, color: 'var(--gold)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>Décrypter le commerce des agents IA</div>
            </div>
          </Link>
          <Link href="/#articles" className="badge" style={{ padding: '7px 14px' }}>← Tous les articles</Link>
        </div>
      </header>

      {/* Article header */}
      <section style={{ padding: '64px 0 32px' }}>
        <div className="container-narrow">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <span className="chip-gold">{a.category}</span>
            <span style={{ fontSize: 12, color: 'var(--gray-2)' }}>{a.publishedAtFormatted}</span>
            <span style={{ fontSize: 12, color: 'var(--gray-3)' }}>· {a.readTime}</span>
          </div>
          <h1 className="display-2" style={{ marginBottom: 24, lineHeight: 1.1 }}>
            {a.title}
          </h1>
          <p className="lead" style={{ marginBottom: 32, maxWidth: 740 }}>{a.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, background: 'var(--gold-dim)', border: '1px solid var(--gold-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>
              {a.author.slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{a.author}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-3)' }}>Rédaction LCA — édité par ACF®</div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <article style={{ padding: '0 0 80px' }}>
        <div className="container-narrow" style={{ fontSize: 16, color: 'var(--gray-1)', lineHeight: 1.75 }}>
          {a.body.map(renderBlock)}

          {/* Tags */}
          <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Tags</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {a.tags.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          </div>

          {/* CTA newsletter */}
          <div className="glow-card" style={{ padding: 32, marginTop: 56, background: 'linear-gradient(135deg, var(--navy-3) 0%, var(--navy-2) 100%)', borderColor: 'var(--gold-dim)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Newsletter</div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Recevez Le Brief A-commerce chaque lundi</h3>
            <p style={{ fontSize: 14, color: 'var(--gray-1)', marginBottom: 20 }}>L'essentiel de la semaine en 5 minutes : protocoles, études, décisions réglementaires.</p>
            <Link href="/#newsletter" className="btn-gold">S'abonner gratuitement →</Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border)', background: 'var(--navy-2)' }}>
        <div className="container-x" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--gray-3)' }}>
          <div>© 2026 Le Commerce Agentique — Édité par ACF®.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/mentions-legales" style={{ color: 'var(--gray-3)' }}>Mentions légales</Link>
            <Link href="/politique-confidentialite" style={{ color: 'var(--gray-3)' }}>Confidentialité</Link>
            <Link href="/cgu" style={{ color: 'var(--gray-3)' }}>CGU</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
