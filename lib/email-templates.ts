/**
 * HTML + plain-text email templates for the newsletter flow.
 * All user input is escaped via escHtml().
 */
import { escHtml } from './esc-html'

const BASE = 'https://lecommerceagentique.fr'
const BRAND = 'Le Commerce Agentique'
const TAGLINE = 'Décrypter le commerce des agents IA'

const layoutCss = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #050c1a; color: #c8d1e0; margin: 0; padding: 0; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .card { background: #0a1428; border: 1px solid #1e2a44; border-radius: 12px; padding: 32px; }
  .brand { font-family: 'Space Grotesk', sans-serif; font-weight: 800; color: #ffd16a; letter-spacing: -0.02em; font-size: 22px; margin-bottom: 4px; }
  .eyebrow { color: #ffd16a; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; margin-bottom: 24px; }
  h1 { color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-size: 26px; line-height: 1.2; margin: 0 0 18px; letter-spacing: -0.02em; }
  h2 { color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-size: 18px; margin: 28px 0 10px; }
  p { line-height: 1.65; margin: 0 0 16px; color: #c8d1e0; font-size: 15px; }
  a.btn { display: inline-block; background: #ffd16a; color: #050c1a; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 12px 0; }
  a { color: #ffd16a; }
  .small { font-size: 12px; color: #6b7894; }
  .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #1e2a44; font-size: 11px; color: #6b7894; text-align: center; line-height: 1.6; }
  .article { margin: 0 0 20px; padding: 0 0 20px; border-bottom: 1px solid #1e2a44; }
  .article:last-child { border-bottom: none; }
  .article h3 { color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-size: 17px; margin: 0 0 8px; line-height: 1.3; }
  .article p { font-size: 14px; margin: 0 0 8px; }
  .meta { color: #6b7894; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 6px; }
`

function shell(title: string, body: string, unsubUrl?: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escHtml(title)}</title>
<style>${layoutCss}</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="brand">${escHtml(BRAND)}</div>
    <div class="eyebrow">${escHtml(TAGLINE)}</div>
    ${body}
  </div>
  <div class="footer">
    <p>${escHtml(BRAND)} &mdash; édité par ACF&reg;<br>
    <a href="${BASE}">${BASE.replace('https://', '')}</a></p>
    ${unsubUrl
      ? `<p>Ne souhaitez plus recevoir ce brief ? <a href="${escHtml(unsubUrl)}">Se désinscrire en un clic</a>.</p>`
      : ''}
  </div>
</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────
// 1. Email de confirmation (double opt-in)
// ─────────────────────────────────────────────────────────────────
export function buildConfirmEmail(opts: { email: string; confirmUrl: string }) {
  const safeEmail = escHtml(opts.email)
  const safeUrl = escHtml(opts.confirmUrl)
  const subject = "Confirmez votre inscription au Brief A-commerce"
  const html = shell(subject, `
    <h1>Une dernière étape.</h1>
    <p>Vous avez demandé à recevoir <strong>Le Brief A-commerce</strong> à l'adresse <strong>${safeEmail}</strong>.</p>
    <p>Confirmez votre inscription en cliquant sur le bouton ci-dessous :</p>
    <p><a class="btn" href="${safeUrl}">Confirmer mon inscription</a></p>
    <p class="small">Le lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
  `)
  const text = `Le Brief A-commerce — Confirmation d'inscription

Vous avez demandé à recevoir Le Brief A-commerce à l'adresse ${opts.email}.

Confirmez votre inscription en ouvrant ce lien :
${opts.confirmUrl}

Le lien est valable 7 jours.
Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

— ${BRAND}
${BASE}
`
  return { subject, html, text }
}

// ─────────────────────────────────────────────────────────────────
// 2. Brief hebdomadaire (newsletter)
// ─────────────────────────────────────────────────────────────────
export interface BriefArticle {
  title: string
  desc: string
  url: string
  category: string
  readTime: string
}

export function buildBriefEmail(opts: {
  email: string
  unsubUrl: string
  weekLabel: string
  intro: string
  articles: BriefArticle[]
}) {
  const subject = `Le Brief A-commerce — ${escHtml(opts.weekLabel)}`
  const articlesHtml = opts.articles
    .map((a) => `
    <div class="article">
      <div class="meta">${escHtml(a.category)} · ${escHtml(a.readTime)}</div>
      <h3><a href="${escHtml(a.url)}">${escHtml(a.title)}</a></h3>
      <p>${escHtml(a.desc)}</p>
      <p><a href="${escHtml(a.url)}">Lire l'analyse →</a></p>
    </div>`)
    .join('')

  const html = shell(subject, `
    <div class="eyebrow" style="margin-top:-12px">${escHtml(opts.weekLabel)}</div>
    <h1>Le Brief A-commerce</h1>
    <p>${escHtml(opts.intro)}</p>
    <h2>Cette semaine sur le site</h2>
    ${articlesHtml}
    <p style="margin-top:28px"><a class="btn" href="${BASE}/#articles">Tous les articles</a></p>
  `, opts.unsubUrl)

  const text =
    `Le Brief A-commerce — ${opts.weekLabel}\n\n` +
    `${opts.intro}\n\n` +
    `Cette semaine sur le site :\n\n` +
    opts.articles
      .map((a) => `[${a.category}] ${a.title}\n${a.desc}\n${a.url}\n`)
      .join('\n') +
    `\n\nTous les articles : ${BASE}/#articles\n\n` +
    `Se désinscrire en un clic : ${opts.unsubUrl}\n\n— ${BRAND}\n${BASE}\n`

  return { subject, html, text }
}
