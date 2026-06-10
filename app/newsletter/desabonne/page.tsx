import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Désinscription confirmée — Le Commerce Agentique',
  robots: { index: false, follow: false },
}

type Params = Promise<{ [key: string]: string | string[] | undefined }>

interface Props {
  searchParams: Params
}

export default async function NewsletterDesabonnePage({ searchParams }: Props) {
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : 'ok'

  const content =
    status === 'invalid'
      ? {
          title: 'Lien invalide',
          eyebrow: 'Désinscription',
          body: "Ce lien n'est pas reconnu. Si vous souhaitez vous désinscrire, contactez-nous à contact@acfstandard.com.",
        }
      : {
          title: 'Désinscription effective.',
          eyebrow: 'À bientôt',
          body: "Vous ne recevrez plus Le Brief A-commerce. Si c'était une erreur, vous pouvez vous réinscrire à tout moment depuis la page d'accueil.",
        }

  return (
    <main>
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
        </div>
      </header>

      <section className="section" style={{ paddingTop: 100, paddingBottom: 120 }}>
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-2" style={{ marginBottom: 24, marginTop: 12 }}>
            <span className="gradient-gold">{content.title}</span>
          </h1>
          <p className="lead" style={{ maxWidth: 600, margin: '0 auto 32px' }}>{content.body}</p>
          <Link href="/" className="btn-gold">Retour à l'accueil →</Link>
        </div>
      </section>

      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border)', background: 'var(--navy-2)' }}>
        <div className="container-x" style={{ fontSize: 12, color: 'var(--gray-3)', textAlign: 'center' }}>
          © 2026 Le Commerce Agentique — Édité par ACF®.
        </div>
      </footer>
    </main>
  )
}
