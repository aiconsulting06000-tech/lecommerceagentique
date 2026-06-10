import Link from 'next/link'
import NewsletterForm from './components/NewsletterForm'
import NewsFeed from './components/NewsFeed'
import { fetchVisibleNews } from '../lib/news'

// Re-fetch the home every 10 min so the news feed stays fresh for bots
export const revalidate = 600

// ════════════════════════════════════════════════════
// DONNÉES
// ════════════════════════════════════════════════════

const GLOSSARY = [
  { id: 'commerce-agentique', term: 'Commerce agentique', short: 'a-commerce', oneLine: "Le commerce où un agent IA achète à votre place.", def: "Modèle de commerce en ligne où des agents logiciels autonomes (IA) exécutent tout ou partie du processus d'achat à la place de l'utilisateur." },
  { id: 'a-commerce', term: 'A-commerce', short: 'Synonyme', oneLine: "Le mot court pour « commerce agentique ».", def: "Désigne la nouvelle catégorie de transactions e-commerce assistées par agents IA, par analogie avec e-commerce (electronic), m-commerce (mobile) et s-commerce (social)." },
  { id: 'agent-autonome', term: 'Agent IA autonome', short: 'Autonomous AI agent', oneLine: "Un LLM qui raisonne, décide et agit seul.", def: "Programme logiciel basé sur un LLM capable de raisonner, planifier et exécuter des actions multi-étapes pour atteindre un objectif." },
  { id: 'mcp', term: 'Model Context Protocol', short: 'MCP — Anthropic', oneLine: "Le câble qui branche les agents IA aux outils.", def: "Protocole ouvert publié par Anthropic le 25 novembre 2024, permettant aux agents IA de se connecter aux systèmes commerciaux." },
  { id: 'acp', term: 'Agentic Commerce Protocol', short: 'ACP — Stripe + OpenAI', oneLine: "Le standard de paiement quand l'agent paie.", def: "Protocole co-publié par Stripe et OpenAI en 2025 pour standardiser les paiements initiés par agents IA." },
  { id: 'tap', term: 'Trusted Agent Protocol', short: 'TAP — Visa', oneLine: "Le passeport cryptographique de l'agent IA.", def: "Protocole Visa du 14 octobre 2025 pour l'authentification des agents IA, basé sur signature Ed25519." },
  { id: 'agent-pay', term: 'Agent Pay', short: 'Mastercard', oneLine: "La carte bancaire de l'agent IA, avec consentement.", def: "Solution Mastercard 2025 pour le règlement de transactions agentiques avec consentement explicite." },
  { id: 'operator', term: 'Operator', short: 'OpenAI', oneLine: "L'agent qui clique sur le web à votre place.", def: "Agent IA publié par OpenAI le 23 janvier 2025, capable de naviguer sur le web pour l'utilisateur." },
  { id: 'mariner', term: 'Project Mariner', short: 'Google', oneLine: "La réponse Google à Operator.", def: "Agent IA navigateur publié par Google en décembre 2024." },
  { id: 'governance', term: 'Gouvernance agentique', short: 'Discipline', oneLine: "L'art d'encadrer un agent IA sans le brider.", def: "Discipline encadrant le comportement des agents IA : autonomie, supervision, traçabilité, kill switch." },
  { id: 'ddao', term: 'DDAO', short: 'Designated Delegated Agent Officer', oneLine: "Le DPO des agents IA — la personne qui en répond.", def: "Rôle nommé proposé par le standard ACF® sur le modèle du DPO ou du CISO. Le DDAO est la personne (ou l'organe collégial) responsable de la supervision continue d'un agent IA autonome en production : validation des décisions critiques, arbitrage en cas d'escalade, suivi des dérives." },
  { id: 'audit-trail', term: 'Audit trail cryptographique', short: 'Preuve technique', oneLine: "La boîte noire scellée qui prouve ce que l'agent a fait.", def: "Chaîne d'événements signés Ed25519 + SHA-256 qui documente chaque décision d'un agent IA." },
]

const ACTORS = [
  { date: 'Nov 2024', actor: 'Anthropic', initiative: 'Model Context Protocol (MCP)', desc: 'Protocole standard pour la connexion d\'agents IA aux systèmes commerciaux.' },
  { date: 'Déc 2024', actor: 'Google', initiative: 'Project Mariner', desc: 'Agent IA navigateur capable d\'exécuter des tâches commerciales.' },
  { date: 'Jan 2025', actor: 'OpenAI', initiative: 'Operator', desc: 'Agent IA web réalisant des achats et réservations.' },
  { date: 'Oct 2025', actor: 'Visa', initiative: 'Trusted Agent Protocol (TAP)', desc: 'Authentification cryptographique des agents IA pour les paiements.' },
  { date: 'Oct 2025', actor: 'Mastercard', initiative: 'Agent Pay', desc: 'Règlement de transactions initiées par agents avec contrôles utilisateur.' },
  { date: '2025', actor: 'Stripe + OpenAI', initiative: 'Agentic Commerce Protocol (ACP)', desc: 'Standard de paiement pour transactions initiées par agents IA.' },
  { date: '2025', actor: 'Forter', initiative: 'Trusted Agentic Commerce Protocol (TACP)', desc: 'Détection de fraude et vérification d\'identité.' },
  { date: '2026', actor: 'ACF®', initiative: 'Agentic Commerce Framework — Standard ouvert', desc: 'Premier référentiel européen de gouvernance des agents : 4 principes, 4 niveaux N0-N3, 6 dimensions de maturité.' },
]

const STEPS = [
  { n: '01', t: 'Expression du besoin', d: 'L\'utilisateur formule en langage naturel ce qu\'il cherche.' },
  { n: '02', t: 'Recherche & comparaison', d: 'L\'agent interroge les catalogues marchands via MCP/ACP.' },
  { n: '03', t: 'Sélection & validation', d: 'L\'agent propose ou décide selon le niveau d\'autonomie configuré.' },
  { n: '04', t: 'Paiement sécurisé', d: 'Exécution via TAP/ACP/Agent Pay avec authentification Ed25519.' },
  { n: '05', t: 'Traçabilité & audit', d: 'Chaque action hashée, signée, archivée. Compatible eIDAS.' },
]

const STATS = [
  {
    figure: '33%',
    label: 'Des applications d\'entreprise',
    desc: 'incluront de l\'IA agentique d\'ici 2028 selon Gartner. Aujourd\'hui : moins de 1%.',
    src: 'Gartner Symposium · Oct 2024',
  },
  {
    figure: '60-70%',
    label: 'Des activités professionnelles',
    desc: 'pourront être automatisées par l\'IA agentique d\'ici 2030 selon McKinsey Global Institute.',
    src: 'McKinsey · The Economic Potential of Generative AI',
  },
  {
    figure: '$4.4T',
    label: 'De valeur ajoutée annuelle',
    desc: 'projetée par la GenAI dans le monde, dont une part majoritaire issue de cas d\'usage commerciaux agentiques.',
    src: 'McKinsey · 2023',
  },
  {
    figure: '1 sur 5',
    label: 'Achats e-commerce US',
    desc: 'pourraient être initiés par des agents IA d\'ici 2028 selon Bain & Company.',
    src: 'Bain Retail Report · 2025',
  },
]

const INTERACTIONS = [
  {
    code: 'A→H',
    title: 'Agent → Humain',
    sub: 'Shop with me',
    desc: 'L\'agent IA accompagne l\'utilisateur pendant son shopping. Il propose, compare, recommande, mais l\'humain valide chaque achat. Mode "copilote".',
    examples: 'Amazon Rufus · Shopify Sidekick · Klarna AI Assistant',
  },
  {
    code: 'A→C',
    title: 'Agent → Commerce',
    sub: 'Shop for me',
    desc: 'L\'agent IA exécute l\'achat à la place de l\'utilisateur, du choix au paiement, selon les contraintes définies en amont. Mode "déléguée".',
    examples: 'OpenAI Operator · Google Mariner · Perplexity Shopping',
  },
  {
    code: 'A↔A',
    title: 'Agent ↔ Agent',
    sub: 'Negotiation',
    desc: 'Deux agents IA négocient une transaction : un agent acheteur dialogue avec un agent vendeur. Émergence des "agent-to-agent markets".',
    examples: 'Salesforce Agentforce · IBM watsonx Agents · ServiceNow AI Agents',
  },
  {
    code: 'A→B',
    title: 'Agent → Broker',
    sub: 'Marketplace agentique',
    desc: 'L\'agent passe par un intermédiaire (broker agent) qui agrège plusieurs marchands, négocie les meilleures offres et exécute la transaction.',
    examples: 'Stripe + OpenAI ACP · Visa TAP · Mastercard Agent Pay',
  },
  {
    code: 'M→A',
    title: 'Marchand → Agent',
    sub: 'Agent-readiness',
    desc: 'Le marchand structure son catalogue, ses API et son contenu pour être "lisible" par les agents IA. Émergence du A-commerce SEO (AEO).',
    examples: 'Shopify Agent API · Stripe ACP Endpoints · Schema.org ProductOffer',
  },
  {
    code: 'H↔A',
    title: 'Humain ↔ Agent',
    sub: 'Conversational commerce',
    desc: 'L\'utilisateur dialogue en langage naturel avec l\'agent qui devient l\'interface unique vers tous les marchands. Disparition progressive des sites web.',
    examples: 'ChatGPT Shopping · Claude Commerce · Perplexity Buy',
  },
]

const ARTICLES = [
  { cat: 'Protocole', date: '9 juin 2026', read: '6 min', title: 'MCP : pourquoi tous les protocoles a‑commerce s\'y rallient', desc: 'En 18 mois, le Model Context Protocol d\'Anthropic est devenu la couche de transport de référence pour connecter les agents IA aux systèmes commerciaux. Analyse de l\'adoption.', slug: 'mcp-couche-transport-a-commerce', published: true },
  { cat: 'Étude', date: '9 juin 2026', read: '12 min', title: 'Shop for me vs Shop with me : 2 modèles, 2 économies', desc: 'La distinction n\'est pas qu\'ergonomique : les modèles "for me" disruptent radicalement les commissions affiliés, tandis que les "with me" maintiennent l\'humain dans la boucle.', slug: 'shop-for-me-vs-shop-with-me', published: true },
  { cat: 'Veille USA', date: '9 juin 2026', read: '5 min', title: 'Stripe ACP : ce que dit la documentation publique', desc: 'Lecture critique de l\'Agentic Commerce Protocol publié conjointement par Stripe et OpenAI. Forces, limites, écart avec le standard ACF® européen.', slug: 'stripe-acp-analyse', published: true },
  { cat: 'Conformité', date: '9 juin 2026', read: '8 min', title: 'EU AI Act : les agents commerciaux sont-ils en classe haut-risque ?', desc: 'L\'Annexe III, point 5 vise les "services essentiels". Un agent qui souscrit une assurance ou réserve un soin médical entre potentiellement dans le périmètre. Analyse juridique.', slug: 'ai-act-agents-commerciaux-haut-risque', published: true },
  { cat: 'Marché', date: '9 juin 2026', read: '7 min', title: 'Visa TAP vs Mastercard Agent Pay : la guerre des standards', desc: 'Octobre 2025 : les deux géants du paiement publient leur protocole. Comparaison technique et stratégique des deux approches.', slug: 'visa-tap-vs-mastercard-agent-pay', published: true },
  { cat: 'Gouvernance', date: '9 juin 2026', read: '10 min', title: 'Le rôle DDAO : qui supervise vraiment un agent IA en production ?', desc: 'Designated Delegated Agent Officer — la proposition ACF® pour combler le vide réglementaire sur la responsabilité opérationnelle des agents autonomes.', slug: 'ddao-supervision-agents-ia', published: true },
  { cat: 'Cas d\'usage', date: '9 juin 2026', read: '9 min', title: 'Banque, retail, voyage : 3 cas d\'usage qui décollent en 2026', desc: 'Wells Fargo expérimente l\'agent réclamation. Walmart teste l\'agent panier. Expedia déploie l\'agent itinéraire complet. Retours terrain.', slug: 'cas-usage-banque-retail-voyage', published: true },
  { cat: 'Classement', date: '9 juin 2026', read: '15 min', title: 'Top 8 des protocoles a‑commerce — édition Juin 2026', desc: 'Notre évaluation des 10 standards qui structurent le commerce agentique : adoption industrielle, maturité technique, ouverture du standard, conformité européenne.', slug: 'top-protocoles-a-commerce', published: true },
  { cat: 'Analyse', date: '9 juin 2026', read: '11 min', title: 'Agent-to-agent : quand les IA se mettent à négocier entre elles', desc: 'L\'émergence des marketplaces inter-agents soulève des questions inédites de gouvernance, sécurité et formation de prix.', slug: 'agent-to-agent-negotiation', published: true },
]

// Top 8 — méthodologie LCA : 5 critères pondérés, score composite sur 100
// (Gouvernance 30%, Conformité EU 25%, Ouverture 20%, Adoption 15%, Maturité technique 10%)
// ⚠️ ACF® (éditeur de ce site) est exclu du classement pour raison de transparence éditoriale.
const RANKING = [
  {
    rank: 1,
    acronym: 'MCP',
    fullName: 'Model Context Protocol',
    editor: 'Anthropic — nov. 2024',
    what: "Protocole standard ouvert pour connecter les agents IA aux systèmes commerciaux (catalogues, paiement, logistique). Devenu la couche de transport de référence — l'équivalent de HTTP pour les agents.",
    score: '88',
    region: '🌍 Global',
    criteria: { gouv: 70, conf: 75, ouv: 100, adop: 99, mat: 95 },
  },
  {
    rank: 2,
    acronym: 'TAP',
    fullName: 'Trusted Agent Protocol',
    editor: 'Visa — oct. 2025',
    what: "Protocole d'authentification cryptographique des agents IA pour les paiements. Chaque agent signe ses transactions avec une clé Ed25519 enregistrée chez Visa. Garantit au marchand qu'il parle bien à un agent autorisé.",
    score: '82',
    region: '🌍 Global',
    criteria: { gouv: 80, conf: 85, ouv: 80, adop: 85, mat: 90 },
  },
  {
    rank: 3,
    acronym: 'ACP',
    fullName: 'Agentic Commerce Protocol',
    editor: 'Stripe + OpenAI — 2025',
    what: "Protocole pour exécuter des paiements initiés par un agent IA via l'infrastructure Stripe. Intégration en quelques heures pour un marchand déjà équipé Stripe. Adoption massive aux USA.",
    score: '79',
    region: '🇺🇸 USA',
    criteria: { gouv: 65, conf: 60, ouv: 75, adop: 95, mat: 95 },
  },
  {
    rank: 4,
    acronym: 'Agent Pay',
    fullName: 'Agent Pay',
    editor: 'Mastercard — oct. 2025',
    what: "Solution de règlement pour les transactions initiées par agents IA. Intègre nativement des contrôles consommateur : plafonds, catégories autorisées, listes blanches de marchands, révocabilité immédiate.",
    score: '76',
    region: '🌍 Global',
    criteria: { gouv: 75, conf: 75, ouv: 70, adop: 80, mat: 85 },
  },
  {
    rank: 5,
    acronym: 'TACP',
    fullName: 'Trusted Agentic Commerce Protocol',
    editor: 'Forter — 2025',
    what: "Protocole anti-fraude spécifiquement conçu pour le commerce agentique. Détecte les abus, vérifie l'identité de l'agent et son mandat, signale les patterns suspects propres aux IA autonomes.",
    score: '70',
    region: '🇮🇱 Israël',
    criteria: { gouv: 75, conf: 70, ouv: 50, adop: 70, mat: 90 },
  },
  {
    rank: 6,
    acronym: 'Mariner',
    fullName: 'Project Mariner',
    editor: 'Google — déc. 2024',
    what: "Agent IA navigateur intégré à Chrome et Google Workspace. Capable de naviguer le web et d'exécuter des tâches commerciales pour l'utilisateur. Standard fermé, écosystème Google.",
    score: '64',
    region: '🇺🇸 USA',
    criteria: { gouv: 50, conf: 50, ouv: 40, adop: 90, mat: 80 },
  },
  {
    rank: 7,
    acronym: 'Operator',
    fullName: 'Operator',
    editor: 'OpenAI — janv. 2025',
    what: "Agent IA généraliste capable d'exécuter des achats et réservations en naviguant sur le web. Mode \"shop for me\". UX accessible mais pas de standard technique ouvert publié.",
    score: '62',
    region: '🇺🇸 USA',
    criteria: { gouv: 45, conf: 45, ouv: 40, adop: 95, mat: 85 },
  },
  {
    rank: 8,
    acronym: 'Schema.org',
    fullName: 'Schema.org ProductOffer',
    editor: 'W3C — extensions 2025-2026',
    what: "Couche sémantique partagée que les agents utilisent pour comprendre une page produit. Extensions a-commerce récentes ajoutent autorisation d'achat, métadonnées de confiance, indicateurs pour agents. Couvre déjà des millions de fiches produit.",
    score: '60',
    region: '🌍 Global',
    criteria: { gouv: 40, conf: 60, ouv: 95, adop: 95, mat: 75 },
  },
]

const VEILLE = [
  { region: '🇺🇸 USA', date: 'Juin 2026', title: 'Stanford HAI publie le rapport "Agentic Commerce Index 2026"', src: 'hai.stanford.edu' },
  { region: '🇺🇸 USA', date: 'Mai 2026', title: 'Forrester estime à $1.2B le marché des agents commerce B2C en 2026', src: 'Forrester Wave' },
  { region: '🇪🇺 EU', date: 'Mai 2026', title: 'AI Office publie ses lignes directrices "Agents IA et droits du consommateur"', src: 'AI Office EU' },
  { region: '🇬🇧 UK', date: 'Avril 2026', title: 'CMA britannique lance une consultation sur les marketplaces agentiques', src: 'gov.uk/cma' },
  { region: '🇨🇳 Chine', date: 'Mai 2026', title: 'Alibaba dévoile son agent commercial autonome pour TaoBao', src: 'Alibaba Cloud' },
  { region: '🇯🇵 Japon', date: 'Avril 2026', title: 'METI publie un livre blanc sur le commerce agentique', src: 'meti.go.jp' },
]

// ════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════

export default async function HomePage() {
  const newsEntries = await fetchVisibleNews(5)
  return (
    <>
      <main>
        {/* ════════════ HEADER ════════════ */}
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
          <div className="container-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 38, height: 38, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--navy)', fontSize: 12, letterSpacing: '0.06em', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 16px var(--gold-glow)' }}>LCA</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>Le Commerce Agentique</div>
                <div style={{ fontSize: 9.5, color: 'var(--gold)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>Décrypter le commerce des agents IA</div>
              </div>
            </Link>
            <nav style={{ display: 'flex', gap: 22, alignItems: 'center', fontSize: 13, fontWeight: 500 }}>
              <a href="#definition" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Définition</a>
              <Link href="/veille" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Veille</Link>
              <a href="#etudes" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Études</a>
              <a href="#conformite" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Conformité</a>
              <a href="#modes" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Modes</a>
              <a href="#articles" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Articles</a>
              <a href="#veille" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Veille</a>
              <a href="#classement" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Classement</a>
              <a href="#glossaire" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Glossaire</a>
              <Link href="https://acfstandard.com" className="badge" style={{ padding: '7px 14px' }}>ACF<span style={{ fontSize: 10 }}> ↗</span></Link>
            </nav>
          </div>
        </header>

        {/* ════════════ HERO ════════════ */}
        <section style={{ position: 'relative', padding: '64px 0 56px', overflow: 'hidden', display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 73px)' }}>
          <div className="hero-bg" />
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
          <div className="noise-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

          <div className="container-x" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.7fr)', gap: 40, alignItems: 'center' }} className="hero-grid">
              <div className="float-up">
                <div className="eyebrow">
                  <span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />
                  Le média francophone du <span style={{ whiteSpace: 'nowrap' }}>a-commerce</span>
                </div>
                <h1 className="display-1" style={{ marginBottom: 28 }}>
                  Le commerce
                  <br />
                  <span className="shimmer-text">agentique.</span>
                </h1>
                <p className="lead" style={{ maxWidth: 620, marginBottom: 32 }}>
                  Quand des <strong style={{ color: 'var(--white)' }}>agents IA autonomes</strong> exécutent vos achats à votre place — du clic au paiement.
                  Études, cartographie, gouvernance, veille internationale.
                </p>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
                  <Link href="#articles" className="btn-gold">Lire les derniers articles<span style={{ fontSize: 18 }}>→</span></Link>
                  <Link href="#newsletter" className="btn-ghost">Recevoir Le Brief A-commerce</Link>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip-gold">MCP</span>
                  <span className="chip-gold">ACP</span>
                  <span className="chip-gold">TAP</span>
                  <span className="chip-gold">Agent Pay</span>
                  <span className="chip-gold">Operator</span>
                  <span className="chip-gold">Mariner</span>
                  <span className="chip-gold">ACF®</span>
                </div>
              </div>

              {/* ── Hero visual : 2 agents qui négocient ── */}
              <div className="agent-viz">
                <div className="agent-orbital" />
                <div className="agent-orbital-inner" />

                <div className="agent-node agent-node-a">
                  AGENT A
                  <div className="agent-node-label">buyer</div>
                </div>
                <div className="agent-node agent-node-b">
                  AGENT B
                  <div className="agent-node-label">seller</div>
                </div>

                <div className="agent-flow">
                  <div className="agent-flow-dot dot-1" />
                  <div className="agent-flow-dot dot-2" />
                  <div className="agent-flow-dot dot-3" />
                  <div className="agent-flow-dot dot-4" />
                </div>

                <div className="agent-token tk-1">MCP · 0x4f…3a</div>
                <div className="agent-token tk-2">ACP · sign Ed25519</div>
                <div className="agent-token tk-3">TAP · auth</div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ CITATION ════════════ */}
        <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--navy-2)' }}>
          <div className="container-narrow" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ flexShrink: 0, color: 'var(--gold)', fontSize: 28, lineHeight: 1 }}>“</div>
            <div style={{ flex: '1 1 auto', maxWidth: 720 }}>
              <p style={{ fontSize: 16, color: 'var(--gray-1)', fontStyle: 'italic', lineHeight: 1.6 }}>
                Le commerce agentique, également appelé <strong style={{ color: 'var(--gold)', fontStyle: 'normal' }}>agentic commerce</strong> ou{' '}
                <strong style={{ color: 'var(--gold)', fontStyle: 'normal', whiteSpace: 'nowrap' }}>a-commerce</strong>, repose sur des agents logiciels autonomes capables de raisonner, planifier et agir sur des systèmes commerciaux pour réaliser des achats.
              </p>
              <p style={{ fontSize: 12, color: 'var(--gray-3)', marginTop: 8, letterSpacing: '0.06em' }}>— DÉFINITION SOURCÉE DE WIKIPÉDIA</p>
            </div>
            <div style={{ flexShrink: 0, color: 'var(--gold)', fontSize: 28, lineHeight: 1, alignSelf: 'flex-end' }}>”</div>
          </div>
        </section>

        {/* ════════════ KPIs ════════════ */}
        <section className="section-tight section-glow">
          <div className="container-x" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
              <div>
                <div className="kpi-number gradient-gold">8<span className="kpi-unit"> protocoles</span></div>
                <p style={{ fontSize: 13, color: 'var(--gray-2)', marginTop: 12, lineHeight: 1.5 }}>publiés depuis novembre 2024 par les acteurs majeurs (Anthropic, Visa, Mastercard, Stripe, OpenAI, Google…)</p>
              </div>
              <div>
                <div className="kpi-number gradient-gold">N0–N3<span className="kpi-unit"> niveaux</span></div>
                <p style={{ fontSize: 13, color: 'var(--gray-2)', marginTop: 12, lineHeight: 1.5 }}>d'autonomie définis par le standard ACF® pour encadrer le déploiement des agents en production</p>
              </div>
              <div>
                <div className="kpi-number gradient-gold">2027<span className="kpi-unit"> AI Act</span></div>
                <p style={{ fontSize: 13, color: 'var(--gray-2)', marginTop: 12, lineHeight: 1.5 }}>enforcement haut-risque de l'EU AI Act (2 décembre 2027) pour les agents en classe Annexe III</p>
              </div>
              <div>
                <div className="kpi-number gradient-gold">Ed25519<span className="kpi-unit"> + SHA-256</span></div>
                <p style={{ fontSize: 13, color: 'var(--gray-2)', marginTop: 12, lineHeight: 1.5 }}>cryptographie standard recommandée par l'ANSSI pour l'audit trail des décisions agentiques</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ NEWS — Veille quotidienne ════════════ */}
        <NewsFeed entries={newsEntries} />

        <div className="divider-glow" />

        {/* ════════════ DÉFINITION ════════════ */}
        <section className="section" id="definition">
          <div className="container-narrow">
            <span className="eyebrow">Définition</span>
            <h2 className="display-2" style={{ marginBottom: 40 }}>
              Qu'est-ce que <span className="gradient-gold">le commerce</span><br />
              <span className="gradient-gold">agentique</span> ?
            </h2>
            <div style={{ fontSize: 18, color: 'var(--gray-1)', lineHeight: 1.8, display: 'grid', gap: 24 }}>
              <p>
                Le <strong style={{ color: 'var(--white)' }}>commerce agentique</strong> — également appelé <em style={{ color: 'var(--gold)', fontStyle: 'normal', whiteSpace: 'nowrap' }}>a-commerce</em> ou en anglais <em style={{ color: 'var(--gold)', fontStyle: 'normal' }}>agentic commerce</em> — est un modèle de commerce en ligne dans lequel des agents logiciels autonomes, basés sur l'intelligence artificielle, exécutent tout ou partie du processus d'achat à la place de l'utilisateur.
              </p>
              <p>
                Contrairement au e-commerce traditionnel, où l'utilisateur navigue manuellement pour comparer et payer, le <span style={{ whiteSpace: 'nowrap' }}>a-commerce</span> permet à un agent IA d'exécuter ces opérations de manière autonome, en se connectant aux systèmes marchands via des protocoles standardisés tels que <strong style={{ color: 'var(--white)' }}>MCP</strong> (Anthropic), <strong style={{ color: 'var(--white)' }}>ACP</strong> (Stripe + OpenAI) ou <strong style={{ color: 'var(--white)' }}>TAP</strong> (Visa).
              </p>
            </div>

            <div className="chronology" style={{ marginTop: 56 }}>
              {[
                { era: '1995', label: 'e-commerce', sub: 'electronic', desc: 'Sites web. L\'utilisateur clique.' },
                { era: '2008', label: 'm-commerce', sub: 'mobile', desc: 'Smartphone. L\'utilisateur tape.' },
                { era: '2015', label: 's-commerce', sub: 'social', desc: 'Réseaux sociaux. L\'utilisateur swipe.' },
                { era: '2025+', label: 'a-commerce', sub: 'agentique', desc: 'L\'agent IA décide et achète.', highlight: true },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className="glow-card chronology-card"
                  style={{
                    padding: 20,
                    ...(c.highlight && { borderColor: 'var(--gold)', background: 'linear-gradient(180deg, var(--navy-3) 0%, var(--navy-2) 100%)' }),
                  }}
                >
                  <div style={{ fontSize: 10, color: c.highlight ? 'var(--gold)' : 'var(--gray-3)', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                    {c.era}
                  </div>
                  {/* Dot sur la timeline */}
                  <div style={{ position: 'absolute', left: '50%', top: 'calc(38% + 1px)', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', background: c.highlight ? 'var(--gold)' : 'var(--navy-3)', border: `2px solid ${c.highlight ? 'var(--gold)' : 'var(--border-strong)'}`, boxShadow: c.highlight ? '0 0 16px var(--gold-glow)' : 'none', zIndex: 2 }} />
                  <div
                    className={c.highlight ? 'gradient-gold' : ''}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      lineHeight: 1,
                      color: c.highlight ? undefined : 'var(--white)',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}
                  >
                    {c.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-2)', fontStyle: 'italic', marginBottom: 16 }}>{c.sub}</div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '0 0 14px' }} />
                  <p style={{ fontSize: 13, color: 'var(--gray-1)', lineHeight: 1.55 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ ÉTUDES & CHIFFRES ════════════ */}
        <section className="section section-dark" id="etudes">
          <div className="container-x">
            <div style={{ maxWidth: 760, marginBottom: 64 }}>
              <span className="eyebrow">Études · Chiffres</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Les chiffres qui<br />
                <span className="gradient-gold">comptent.</span>
              </h2>
              <p className="lead">
                Sélection de projections et d'études publiques sur la trajectoire du commerce agentique, sourcées et vérifiables.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {STATS.map((s) => (
                <div key={s.label} className="glow-card" style={{ padding: 32 }}>
                  <div className="kpi-number gradient-gold">{s.figure}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>{s.label}</div>
                  <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
                  <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{s.src}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--gray-3)', marginTop: 32, lineHeight: 1.6, maxWidth: 720 }}>
              Les chiffres présentés sont des projections issues de rapports publics. Méthodologies disponibles auprès des éditeurs cités.
              Les estimations divergent selon les approches — nous documentons les écarts dans nos articles dédiés.
            </p>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ CONFORMITÉ & SOUVERAINETÉ ════════════ */}
        <section className="section" id="conformite">
          <div className="container-x">
            <div style={{ maxWidth: 820, marginBottom: 56 }}>
              <span className="eyebrow">Conformité · Souveraineté</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Ce dont personne<br />
                <span className="gradient-gold">ne parle assez.</span>
              </h2>
              <p className="lead">
                Pendant que tout le monde s'enthousiasme pour la prochaine démo d'agent, trois sujets se construisent en silence — et conditionnent la possibilité même de mettre un agent IA en production en Europe à partir de 2027.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                {
                  eyebrow: 'Réglementation',
                  title: 'EU AI Act haut-risque',
                  date: '2 décembre 2027',
                  desc: "Enforcement des obligations haut-risque pour les agents qui interviennent dans les services essentiels (crédit, assurance, santé, immobilier). Audit trail certifiable, supervision humaine qualifiée, traçabilité cryptographique exigée par défaut.",
                  href: '/articles/ai-act-agents-commerciaux-haut-risque',
                },
                {
                  eyebrow: 'Gouvernance',
                  title: 'DDAO',
                  date: 'Le DPO des agents IA',
                  desc: "Designated Delegated Agent Officer : la personne ou l'organe collégial nommé responsable d'un agent en production. Validation des décisions critiques, arbitrage en cas d'escalade, suivi des dérives. Le rôle qui n'existait pas il y a 18 mois et qui va devenir incontournable.",
                  href: '/articles/ddao-supervision-agents-ia',
                },
                {
                  eyebrow: 'Cas d\'usage',
                  title: 'Banque · Retail · Voyage',
                  date: 'Là où ça brûle',
                  desc: "Trois secteurs où les agents IA déclenchent déjà des transactions à valeur réelle — et où les enjeux d'auditabilité, de responsabilité et de souveraineté des données ne sont plus théoriques. Études concrètes et architectures observées.",
                  href: '/articles/cas-usage-banque-retail-voyage',
                },
              ].map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="glow-card"
                  style={{
                    padding: 28,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--navy-2)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                    {c.eyebrow}
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'var(--white)', marginBottom: 6 }}>
                    {c.title}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    {c.date}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.65, marginBottom: 18, flex: '1 1 auto' }}>
                    {c.desc}
                  </p>
                  <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>
                    Lire l'analyse <span style={{ fontSize: 14 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--gray-3)', marginTop: 32, lineHeight: 1.6, maxWidth: 820, fontStyle: 'italic' }}>
              La couverture francophone de ces trois sujets reste fragmentaire — c'est précisément ce que ce média s'attache à corriger.
            </p>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ MODES D'INTERACTION ════════════ */}
        <section className="section" id="modes">
          <div className="container-x">
            <div style={{ maxWidth: 760, marginBottom: 64 }}>
              <span className="eyebrow">Modes d'interaction</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Shop with me,<br />
                shop for me,<br />
                <span className="gradient-gold">shop with my agent.</span>
              </h2>
              <p className="lead">
                Le commerce agentique recouvre plusieurs modes d'interaction selon le degré d'autonomie de l'agent et la nature des contreparties.
                Chaque mode appelle un cadre juridique et technique différent.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {INTERACTIONS.map((m) => (
                <div key={m.title} className="glow-card" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '6px 12px',
                      background: 'var(--gold-dim)',
                      border: '1px solid var(--gold-glow)',
                      borderRadius: 8,
                      color: 'var(--gold)',
                      letterSpacing: '0.04em',
                    }}>{m.code}</div>
                    <div>
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{m.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--gray-2)', fontStyle: 'italic', marginTop: 2 }}>{m.sub}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.65, marginBottom: 14 }}>{m.desc}</p>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11, color: 'var(--gold)', letterSpacing: '0.04em', fontFamily: "'JetBrains Mono', monospace" }}>
                    {m.examples}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ FONCTIONNEMENT ════════════ */}
        <section className="section section-dark" id="fonctionnement">
          <div className="container-x">
            <div style={{ maxWidth: 760, marginBottom: 64 }}>
              <span className="eyebrow">Fonctionnement</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Du besoin au paiement,<br />
                <span className="gradient-gold">orchestré par l'agent.</span>
              </h2>
              <p className="lead">Le processus d'achat agentique se déroule typiquement en 5 étapes, sans intervention humaine continue.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {STEPS.map((s) => (
                <div key={s.n} className="glow-card" style={{ padding: 28 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 56, fontWeight: 800, color: 'var(--gold-dim)', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 16 }}>{s.n}</div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.t}</h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-2)', lineHeight: 1.6 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ ARTICLES ════════════ */}
        <section className="section" id="articles">
          <div className="container-x">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 56 }}>
              <div style={{ maxWidth: 720 }}>
                <span className="eyebrow">Articles · Veille critique</span>
                <h2 className="display-2" style={{ marginBottom: 16 }}>
                  Les derniers <span className="gradient-gold">articles.</span>
                </h2>
                <p className="lead">Analyses, études, décryptages réglementaires. Une publication par semaine signée par la rédaction ACF®.</p>
              </div>
              <span className="chip-gold" style={{ alignSelf: 'flex-end' }}>9 articles publiés</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {ARTICLES.map((a, i) => {
                const cardInner = (
                  <article className="glow-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%', opacity: a.published ? 1 : 0.78 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span className="chip-gold">{a.cat}</span>
                      {a.published ? (
                        <>
                          <span style={{ fontSize: 11, color: 'var(--gray-3)' }}>{a.date}</span>
                          <span style={{ fontSize: 11, color: 'var(--gray-3)' }}>· {a.read}</span>
                        </>
                      ) : (
                        <span className="chip" style={{ color: 'var(--gray-2)' }}>{a.date}</span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, marginBottom: 12, lineHeight: 1.25, letterSpacing: '-0.015em' }}>{a.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.65, marginBottom: 20, flex: '1 1 auto' }}>{a.desc}</p>
                    <div style={{ fontSize: 13, color: a.published ? 'var(--gold)' : 'var(--gray-3)', fontWeight: 600 }}>
                      {a.published ? <>Lire l'article <span style={{ fontSize: 14 }}>→</span></> : 'Notifier à la publication'}
                    </div>
                  </article>
                )
                return a.published ? (
                  <Link key={i} href={`/articles/${a.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {cardInner}
                  </Link>
                ) : (
                  <div key={i}>{cardInner}</div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Link href="#newsletter" className="btn-ghost">Recevoir Le Brief A-commerce par email</Link>
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ VEILLE INTERNATIONALE ════════════ */}
        <section className="section section-dark" id="veille">
          <div className="container-narrow">
            <div style={{ marginBottom: 56 }}>
              <span className="eyebrow">Veille internationale</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Ce qui bouge<br />
                <span className="gradient-gold">hors de France.</span>
              </h2>
              <p className="lead">Publications de référence, rapports d'analystes, décisions réglementaires. Six pays scannés chaque semaine.</p>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {VEILLE.map((v, i) => (
                <article key={i} className="glow-card" style={{ padding: 22, display: 'grid', gridTemplateColumns: '70px auto 1fr', gap: 20, alignItems: 'center' }}>
                  <div style={{ fontSize: 22 }}>{v.region.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>{v.date}</div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-3)' }}>Source : {v.src}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ CLASSEMENT ════════════ */}
        <section className="section" id="classement">
          <div className="container-x">
            <div style={{ maxWidth: 760, marginBottom: 40 }}>
              <span className="eyebrow">Classement LCA · Juin 2026</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Le Top 8 des<br />
                protocoles <span className="gradient-gold">a-commerce.</span>
              </h2>
              <p className="lead">Notre évaluation des 8 standards majeurs structurant le commerce agentique, hors ACF® (notre éditeur). Score composite sur 100 — méthodologie publique.</p>
            </div>

            {/* Méthodologie / Légende */}
            <div className="glow-card" style={{ padding: 24, marginBottom: 32, background: 'var(--navy-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>
                  Méthodologie — 5 critères pondérés
                </div>
                <Link href="/methodologie" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.02em' }}>
                  Méthodologie complète →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {[
                  { k: 'gouv', label: 'Gouvernance', pct: '30%', desc: 'Niveaux d\'autonomie, supervision humaine, kill switch' },
                  { k: 'conf', label: 'Conformité EU', pct: '25%', desc: 'AI Act, RGPD, eIDAS, audit trail' },
                  { k: 'ouv', label: 'Ouverture', pct: '20%', desc: 'Standard ouvert, gratuité, gouvernance multi-stakeholders' },
                  { k: 'adop', label: 'Adoption', pct: '15%', desc: 'Volume d\'implémentations, taille de l\'écosystème' },
                  { k: 'mat', label: 'Maturité technique', pct: '10%', desc: 'Stabilité API, documentation, SDK' },
                ].map((c) => (
                  <div key={c.k}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace" }}>{c.pct}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-3)', lineHeight: 1.45 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* En-tête colonnes (desktop seulement) */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px 50px 50px 50px 50px 70px', gap: 12, padding: '0 22px 12px', fontSize: 10, color: 'var(--gray-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }} className="ranking-header">
              <div>Rang</div>
              <div>Standard</div>
              <div style={{ textAlign: 'center' }}>Gouv</div>
              <div style={{ textAlign: 'center' }}>Conf</div>
              <div style={{ textAlign: 'center' }}>Ouv</div>
              <div style={{ textAlign: 'center' }}>Adop</div>
              <div style={{ textAlign: 'center' }}>Mat</div>
              <div style={{ textAlign: 'right' }}>Score</div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {RANKING.map((r) => (
                <div
                  key={r.rank}
                  className="glow-card"
                  style={{
                    padding: 24,
                    ...(r.rank === 1 && {
                      borderColor: 'var(--gold)',
                      background: 'linear-gradient(135deg, var(--navy-3) 0%, var(--navy-2) 100%)',
                    }),
                  }}
                >
                  {/* Ligne 1 : rang, nom complet, score */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 14 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: r.rank === 1 ? 'var(--gold)' : r.rank <= 3 ? 'var(--gold-2)' : 'var(--gray-2)', letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0, minWidth: 50 }}>
                      #{r.rank}
                    </div>
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: r.rank === 1 ? 'var(--gold)' : 'var(--white)', letterSpacing: '-0.02em' }}>{r.acronym}</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--gray-1)' }}>{r.fullName}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-3)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gold)' }}>{r.editor}</span>
                        <span>·</span>
                        <span>{r.region}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, color: 'var(--gold)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{r.score}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-3)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>/ 100</div>
                    </div>
                  </div>

                  {/* Ligne 2 : description pédagogique */}
                  <div style={{ paddingLeft: 70, marginBottom: 16 }}>
                    <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.6 }}>{r.what}</p>
                  </div>

                  {/* Ligne 3 : scores critères en pied (5 mini barres) */}
                  <div style={{ paddingLeft: 70, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    {([
                      ['gouv', 'Gouvernance'],
                      ['conf', 'Conformité EU'],
                      ['ouv', 'Ouverture'],
                      ['adop', 'Adoption'],
                      ['mat', 'Maturité'],
                    ] as const).map(([k, lbl]) => (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--gray-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{lbl}</span>
                          <span style={{ fontSize: 11, color: r.criteria[k] >= 90 ? 'var(--gold)' : r.criteria[k] >= 70 ? 'var(--gray-1)' : 'var(--gray-3)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{r.criteria[k]}</span>
                        </div>
                        <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${r.criteria[k]}%`, height: '100%', background: r.criteria[k] >= 90 ? 'var(--gold)' : r.criteria[k] >= 70 ? 'var(--gold-2)' : 'var(--gray-3)', borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--gray-3)', marginTop: 24, lineHeight: 1.6, maxWidth: 760 }}>
              Mise à jour mensuelle. Sources : documentation officielle des éditeurs, rapports analystes (Gartner, Forrester), audit code source des SDK publics.
              Note : ACF®, éditeur de ce site, n'est pas inclus dans ce classement par souci d'indépendance éditoriale.
            </p>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ ACTEURS — Timeline ════════════ */}
        <section className="section section-dark" id="acteurs">
          <div className="container-narrow">
            <div style={{ marginBottom: 64 }}>
              <span className="eyebrow">Cartographie</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Les acteurs du<br />
                <span className="gradient-gold">commerce agentique.</span>
              </h2>
              <p className="lead">Chronologie des initiatives industrielles depuis fin 2024.</p>
            </div>

            <div style={{ position: 'relative', paddingLeft: 60 }}>
              <div className="timeline-line" />
              {ACTORS.map((a, i) => (
                <div key={i} className="glow-card" style={{ padding: 28, marginBottom: 20, position: 'relative' }}>
                  <div className="timeline-dot" style={{ left: -50, top: 32 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="chip-gold">{a.date}</span>
                    <span style={{ fontSize: 13, color: 'var(--gray-2)', fontWeight: 600 }}>{a.actor}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>{a.initiative}</h3>
                  <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.65 }}>{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ GOUVERNANCE ════════════ */}
        <section className="section" id="gouvernance">
          <div className="container-narrow">
            <span className="eyebrow">Enjeux</span>
            <h2 className="display-2" style={{ marginBottom: 40 }}>
              Gouvernance &<br />
              conformité du <span className="gradient-gold" style={{ whiteSpace: 'nowrap' }}>a-commerce.</span>
            </h2>
            <div style={{ fontSize: 18, color: 'var(--gray-1)', lineHeight: 1.8, display: 'grid', gap: 24 }}>
              <p>Le déploiement du commerce agentique en production soulève des questions réglementaires majeures, sous l'angle du <strong style={{ color: 'var(--white)' }}>Règlement européen sur l'intelligence artificielle (AI Act)</strong> et du <strong style={{ color: 'var(--white)' }}>RGPD</strong>.</p>
              <p>Un agent IA qui exécute des transactions effectue un <strong style={{ color: 'var(--white)' }}>traitement de données personnelles</strong> au sens du RGPD, et peut être classifié comme système à <strong style={{ color: 'var(--white)' }}>haut risque</strong> au titre de l'AI Act (Annexe III). L'enforcement haut-risque est prévu pour le <strong style={{ color: 'var(--gold)' }}>2 décembre 2027</strong> après le report du Digital Omnibus.</p>
            </div>

            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { t: 'Supervision humaine effective', d: 'Article 14 AI Act — mécanismes de validation et reprise en main par l\'humain.' },
                { t: 'Traçabilité cryptographique', d: 'Preuve des décisions de l\'agent, recevable en cas de contrôle CNIL/AI Office.' },
                { t: 'Consentement & finalité', d: 'Articles 6 et 7 RGPD — base légale et information de la personne concernée.' },
                { t: 'Sécurité & anti-fraude', d: 'Authentification de l\'agent, protection contre prompt injection et jailbreak.' },
                { t: 'Responsabilité juridique', d: 'Qui répond en cas de décision erronée ? Éditeur, intégrateur, utilisateur ?' },
                { t: 'Auditabilité tiers', d: 'Vérifiabilité indépendante des décisions agentiques par un auditeur externe.' },
              ].map((d) => (
                <div key={d.t} className="glow-card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="dot" />
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-0.005em' }}>{d.t}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-2)', lineHeight: 1.6 }}>{d.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ GLOSSAIRE ════════════ */}
        <section className="section section-dark" id="glossaire">
          <div className="container-x">
            <div style={{ maxWidth: 760, marginBottom: 64 }}>
              <span className="eyebrow">Glossaire</span>
              <h2 className="display-2" style={{ marginBottom: 24 }}>
                Le vocabulaire du<br />
                <span className="gradient-gold" style={{ whiteSpace: 'nowrap' }}>a-commerce.</span>
              </h2>
              <p className="lead">{GLOSSARY.length} concepts essentiels pour comprendre l'univers du commerce agentique.</p>
            </div>

            <div className="glossary-grid">
              {GLOSSARY.map((g) => (
                <article key={g.id} id={g.id} className="glossary-term glow-card" style={{ padding: 28 }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, color: 'var(--white)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 10 }}>{g.term}</h3>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', marginBottom: 14 }}>{g.short}</div>
                  <p style={{ fontSize: 15, color: 'var(--white)', lineHeight: 1.45, fontWeight: 600, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)', fontStyle: 'italic' }}>« {g.oneLine} »</p>
                  <p style={{ fontSize: 13, color: 'var(--gray-2)', lineHeight: 1.7 }}>{g.def}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════ NEWSLETTER ════════════ */}
        <section className="section section-glow" id="newsletter" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
          <div className="container-narrow" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <span className="eyebrow">Newsletter</span>
            <h2 className="display-2" style={{ marginBottom: 20 }}>
              Le Brief <span className="gradient-gold" style={{ whiteSpace: 'nowrap' }}>A-commerce.</span>
            </h2>
            <p className="lead" style={{ maxWidth: 640, margin: '0 auto 32px' }}>
              L'essentiel du commerce agentique en 5 minutes de lecture, dans votre boîte mail.
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 auto 40px',
              maxWidth: 480,
              display: 'grid',
              gap: 12,
              textAlign: 'left',
              fontSize: 14,
              color: 'var(--gray-1)',
              lineHeight: 1.5,
            }}>
              {[
                'Nouveaux protocoles publiés par Anthropic, Visa, Stripe, OpenAI, Google…',
                'Évolutions de l\'EU AI Act et des cadres réglementaires américains',
                'Cas d\'usage réels : banque, retail, voyage, services publics',
                'Mises à jour du classement LCA des 8 protocoles',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--gold-dim)',
                    border: '1px solid var(--gold-glow)',
                    color: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    marginTop: 2,
                  }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <NewsletterForm />
            </div>
            <p style={{ marginTop: 18, fontSize: 11, color: 'var(--gray-3)', letterSpacing: '0.04em' }}>
              Gratuit. Sans spam. Désinscription en un clic.
            </p>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ════════════ ÉDITEUR — Note discrète ════════════ */}
        <section className="section-tight" style={{ background: 'var(--navy-2)' }}>
          <div className="container-narrow">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center', flexWrap: 'wrap' }} className="editor-note">
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
                À propos de l'éditeur
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-1)', lineHeight: 1.6, margin: 0 }}>
                Le Commerce Agentique est édité par <strong style={{ color: 'var(--white)' }}>ACF®</strong>, organisation portant le standard ouvert européen de gouvernance des agents IA. Notre indépendance éditoriale est garantie par la transparence : ACF® est exclu du classement et signalé partout où il apparaît dans les articles.
              </p>
              <Link href="https://acfstandard.com" className="btn-ghost" style={{ padding: '10px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
                acfstandard.com →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════ FOOTER ════════════ */}
        <footer style={{ padding: '80px 0 40px', borderTop: '1px solid var(--border)', background: 'var(--navy-2)' }}>
          <div className="container-x">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, marginBottom: 48 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--navy)', fontSize: 12, letterSpacing: '0.06em', fontFamily: "'Space Grotesk', sans-serif" }}>LCA</div>
                  <div style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Le Commerce Agentique</div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-2)', lineHeight: 1.6 }}>Le média francophone du commerce assisté par agents IA. Édité par ACF® — Agentic Commerce Framework®.</p>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>Navigation</div>
                <ul style={{ listStyle: 'none', fontSize: 14, color: 'var(--gray-1)', display: 'grid', gap: 10 }}>
                  <li><a href="#definition" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Définition</a></li>
                  <li><a href="#etudes" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Études & chiffres</a></li>
                  <li><a href="#conformite" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Conformité & souveraineté</a></li>
                  <li><a href="#modes" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Modes d'interaction</a></li>
                  <li><a href="#articles" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Articles</a></li>
                  <li><a href="#veille" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Veille internationale</a></li>
                  <li><a href="#classement" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Classement</a></li>
                  <li><Link href="/methodologie" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Méthodologie</Link></li>
                  <li><a href="#glossaire" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Glossaire</a></li>
                  <li><a href="#newsletter" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Newsletter</a></li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>Écosystème ACF®</div>
                <ul style={{ listStyle: 'none', fontSize: 14, color: 'var(--gray-1)', display: 'grid', gap: 10 }}>
                  <li><Link href="https://acfstandard.com" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>ACF Standard ↗</Link></li>
                  <li><Link href="https://www.acf-score.com" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>ACF Score ↗</Link></li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>Légal</div>
                <ul style={{ listStyle: 'none', fontSize: 14, color: 'var(--gray-1)', display: 'grid', gap: 10 }}>
                  <li><Link href="/mentions-legales" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Mentions légales</Link></li>
                  <li><Link href="/politique-confidentialite" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Politique de confidentialité</Link></li>
                  <li><Link href="/cgu" style={{ color: 'var(--gray-1)', textDecoration: 'none' }}>Conditions d'utilisation</Link></li>
                </ul>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--gray-3)' }}>
              <div>© 2026 Le Commerce Agentique — Tous droits réservés.</div>
              <div>Publié sous licence Creative Commons BY 4.0</div>
            </div>
          </div>
        </footer>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': 'https://lecommerceagentique.fr#website',
                name: 'Le Commerce Agentique',
                alternateName: ['LCA', 'a-commerce', 'Commerce agentique'],
                url: 'https://lecommerceagentique.fr',
                description: "Le média francophone du commerce assisté par agents IA. Études, glossaire, acteurs, gouvernance, classement, veille internationale du a-commerce.",
                inLanguage: 'fr-FR',
                datePublished: '2026-06-09',
                dateModified: '2026-06-09',
                publisher: { '@id': 'https://lecommerceagentique.fr#organization' },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://lecommerceagentique.fr/?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'Organization',
                '@id': 'https://lecommerceagentique.fr#organization',
                name: 'Le Commerce Agentique',
                url: 'https://lecommerceagentique.fr',
                logo: 'https://lecommerceagentique.fr/favicon.svg',
                sameAs: ['https://acfstandard.com'],
                publishingPrinciples: 'https://lecommerceagentique.fr/cgu',
                masthead: 'https://lecommerceagentique.fr/mentions-legales',
              },
              {
                '@type': 'DefinedTermSet',
                '@id': 'https://lecommerceagentique.fr#glossary',
                name: 'Glossaire du commerce agentique',
                inLanguage: 'fr-FR',
                hasDefinedTerm: [
                  { '@type': 'DefinedTerm', name: 'Commerce agentique', alternateName: ['a-commerce', 'agentic commerce'], description: "Modèle de commerce en ligne où des agents IA autonomes exécutent tout ou partie du processus d'achat à la place de l'utilisateur.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'A-commerce', description: "Synonyme de commerce agentique. Désigne la nouvelle catégorie de transactions e-commerce assistées par agents IA.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'MCP (Model Context Protocol)', description: "Protocole standard ouvert publié par Anthropic le 25 novembre 2024 pour connecter les agents IA aux systèmes commerciaux.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'ACP (Agentic Commerce Protocol)', description: "Protocole de paiement initié par agents IA publié par Stripe et OpenAI en 2025.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'TAP (Trusted Agent Protocol)', description: "Protocole d'authentification cryptographique Ed25519 des agents IA publié par Visa le 14 octobre 2025.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'DDAO (Designated Delegated Agent Officer)', description: "Rôle nommé proposé par le standard ACF® pour la supervision continue des agents IA autonomes en production, sur le modèle du DPO ou du CISO.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'Shop with me', description: "Mode d'interaction où l'agent IA assiste l'utilisateur dans son shopping. L'humain valide chaque achat.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'Shop for me', description: "Mode d'interaction où l'agent IA exécute l'achat à la place de l'utilisateur, de la recherche au paiement.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                  { '@type': 'DefinedTerm', name: 'Agent-to-agent (A2A)', description: "Interactions directes entre agents IA pour la négociation et l'exécution de transactions sans intervention humaine continue.", inDefinedTermSet: 'https://lecommerceagentique.fr#glossary' },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://lecommerceagentique.fr#faq',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: "Qu'est-ce que le commerce agentique ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Le commerce agentique — également appelé a-commerce ou agentic commerce — est un modèle de commerce en ligne dans lequel des agents logiciels autonomes basés sur l'intelligence artificielle exécutent tout ou partie du processus d'achat à la place de l'utilisateur : recherche, comparaison, négociation, paiement, suivi.",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: "Qu'est-ce que le a-commerce ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Le a-commerce est le synonyme abrégé de commerce agentique. Le terme s'inscrit dans la lignée des modèles précédents : e-commerce (commerce électronique), m-commerce (commerce mobile), s-commerce (commerce social), et désormais a-commerce (commerce agentique).",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: "Quels sont les principaux protocoles du commerce agentique ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Les principaux protocoles du commerce agentique en 2026 sont : MCP (Model Context Protocol, Anthropic), TAP (Trusted Agent Protocol, Visa), ACP (Agentic Commerce Protocol, Stripe + OpenAI), Agent Pay (Mastercard), TACP (Forter), Mariner (Google), Operator (OpenAI), Schema.org ProductOffer. ACF® (Agentic Commerce Framework®) est un standard ouvert européen de gouvernance.",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: "Le commerce agentique est-il soumis à l'EU AI Act ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Oui, partiellement. Les agents commerciaux opérant sur des services essentiels (crédit, assurance santé, services d'urgence) sont susceptibles d'être classifiés haut-risque au titre de l'Annexe III, point 5 du Règlement (UE) 2024/1689. L'enforcement haut-risque entre en vigueur le 2 décembre 2027 après le report du Digital Omnibus.",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: "Qu'est-ce qu'un DDAO ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "DDAO signifie Designated Delegated Agent Officer. C'est un rôle nommé proposé par le standard ACF® (Agentic Commerce Framework®) pour la supervision continue des agents IA autonomes en production. Sur le modèle du DPO (Délégué à la protection des données) ou du CISO (Chief Information Security Officer), le DDAO porte la responsabilité opérationnelle de la supervision effective des agents IA tout au long de leur cycle de vie.",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: "Quelle différence entre Shop with me et Shop for me ?",
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Dans le Shop with me, l'agent IA est un outil dans la main de l'utilisateur — il propose, suggère, compare, mais c'est l'humain qui valide chaque achat. Dans le Shop for me, l'agent IA agit comme mandataire qui exécute l'achat à la place de l'utilisateur de la recherche au paiement. La différence juridique est colossale : régime e-commerce classique vs régime à inventer.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
    </>
  )
}
