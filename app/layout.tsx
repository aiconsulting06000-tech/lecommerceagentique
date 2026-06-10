import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import CookieBanner from './components/CookieBanner'
import BackToTop from './components/BackToTop'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://lecommerceagentique.fr'),
  title: {
    default: 'Le Commerce Agentique — Le média francophone du commerce assisté par agents IA',
    template: '%s | Le Commerce Agentique',
  },
  description:
    "Définition, glossaire, classement des protocoles, veille internationale et études du commerce agentique (a-commerce) — quand des agents IA autonomes exécutent vos achats à votre place.",
  keywords: [
    'commerce agentique',
    'a-commerce',
    'agentic commerce',
    'agents IA commerce',
    'commerce IA',
    'agent commerce protocol',
    'ACP',
    'TAP',
    'Visa Trusted Agent Protocol',
    'Stripe Agentic Commerce',
    'OpenAI Operator',
    'gouvernance IA',
    'AI Act',
    'RGPD agents IA',
    'ACF',
    'Agentic Commerce Framework',
  ],
  authors: [{ name: 'ACF® — Agentic Commerce Framework', url: 'https://acfstandard.com' }],
  creator: 'Vincent Dorange',
  publisher: 'ACF® — Agentic Commerce Framework',
  alternates: { canonical: 'https://lecommerceagentique.fr' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://lecommerceagentique.fr',
    siteName: 'Le Commerce Agentique',
    title: 'Le Commerce Agentique — Définition, acteurs, gouvernance',
    description:
      'Le média francophone du commerce assisté par agents IA. Glossaire, veille réglementaire, cartographie des acteurs du a-commerce.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Le Commerce Agentique',
    description:
      'Le média francophone du commerce assisté par agents IA. Glossaire, acteurs, gouvernance.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <BackToTop />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
