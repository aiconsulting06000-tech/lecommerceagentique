# Newsletter backend — Setup Vincent (15 min)

Le code est déjà déployé. Pour activer le flow complet (collecte → double opt-in → envoi auto chaque lundi), il faut faire 4 choses chez 3 prestataires.

Tant que ces étapes ne sont pas faites, **le site continue de tourner** — le formulaire répond OK et capture en localStorage. L'utilisateur ne voit pas d'erreur, mais aucun email n'est envoyé.

---

## 1️⃣ Supabase — créer le projet + appliquer la migration (5 min)

### a) Créer le projet
1. Va sur https://supabase.com/dashboard
2. **New project** → Nom : `lecommerceagentique` · Région : `eu-west-3 (Paris)` (ou `eu-central-1` Frankfurt)
3. Génère un mot de passe DB fort, sauvegarde-le ailleurs (1Password / pwm)

### b) Récupérer les clés
Une fois le projet créé :
- `Settings → API → Project URL` → copie-le (= `SUPABASE_URL`)
- `Settings → API → Project API keys → service_role` → copie-le (= `SUPABASE_SERVICE_ROLE_KEY`)

⚠️ **JAMAIS** publier la `service_role` côté client. Elle bypasse RLS.

### c) Appliquer la migration
1. Dashboard Supabase → `SQL Editor` → `New query`
2. Colle TOUT le contenu du fichier `supabase/migrations/0001_newsletter.sql`
3. `Run` → tu dois voir `Success. No rows returned.`
4. Vérifie : `Table Editor` → tu dois voir `newsletter_subscribers` et `newsletter_runs`

---

## 2️⃣ Resend — créer le compte + authentifier le domaine (5 min)

### a) Créer le compte
1. Va sur https://resend.com → Sign up (free tier suffit, 100 emails/jour, 3000/mois)
2. **API Keys → Create API Key** → name `lecommerceagentique-prod` · permission `Full access`
3. Copie la clé (= `RESEND_API_KEY`). Tu ne pourras plus la voir après — sauvegarde-la.

### b) Authentifier le domaine
1. **Domains → Add domain** : `lecommerceagentique.fr`
2. Resend te donne 3 records DNS à ajouter (SPF, DKIM, MX optionnel)
3. Va dans Hostinger → DNS zone de `lecommerceagentique.fr` et ajoute les 3 records exactement comme indiqué par Resend
4. Reviens sur Resend → clique **Verify** (peut prendre 5-30 min de propagation)

Une fois vérifié, le sender `brief@lecommerceagentique.fr` est utilisable.

---

## 3️⃣ Vercel — déclarer les env vars (3 min)

```bash
# Génère un secret cron robuste
openssl rand -hex 32
# → copie le résultat, c'est ton CRON_SECRET
```

Puis dans le terminal :

```bash
cd C:\Users\vdora\Documents\lecommerceagentique

npx vercel env add SUPABASE_URL production
# Colle ton Supabase URL

npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Colle ta service_role key

npx vercel env add RESEND_API_KEY production
# Colle ta Resend API key

npx vercel env add CRON_SECRET production
# Colle le hex 32 généré ci-dessus
```

Pour avoir les mêmes vars en preview/dev :
```bash
npx vercel env add SUPABASE_URL preview
npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
npx vercel env add RESEND_API_KEY preview
npx vercel env add CRON_SECRET preview
```

Puis redéploie :
```bash
npx vercel --prod --yes
```

---

## 4️⃣ Vérification (2 min)

### a) Test du subscribe
1. Va sur https://lecommerceagentique.fr/#newsletter
2. Inscris une adresse à toi (gmail jetable type vincent+test@gmail.com)
3. Tu dois recevoir un email de confirmation en ~30 secondes
4. Clique le lien → tu atterris sur https://lecommerceagentique.fr/newsletter/confirme?status=ok

### b) Test manuel du send (avant le 1er cron du lundi)
```bash
# Récupère CRON_SECRET depuis ton mot de passe
curl -i -X POST "https://lecommerceagentique.fr/api/newsletter/send" \
  -H "Authorization: Bearer TON_CRON_SECRET_ICI"
```

Attendu :
```json
{"ok":true,"sent":1,"failed":0,"label":"Semaine du 10 juin 2026","articles":3}
```

Tu dois recevoir le brief avec les 3 derniers articles dans ta boîte.

### c) Vérifier le cron Vercel
1. Vercel Dashboard → projet `lecommerceagentique` → `Settings → Cron Jobs`
2. Tu dois voir : `/api/newsletter/send · 0 8 * * 1 (Mondays 08:00 UTC)`
3. Premier run automatique : **lundi 15 juin 2026 à 10h00 heure de Paris** (08:00 UTC + 2 GMT été)

---

## 🛡️ Checks sécurité effectués dans le code

- [X] **Hardcode** : aucun secret ou mdp dans le code, tout en env vars
- [X] **Secrets server-only** : `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` jamais en `NEXT_PUBLIC_*`
- [X] **Rate limit** : 5 subs/min par IP, 60/min global (in-memory bucket)
- [X] **Validation email** : RFC 5322 simplifié + cap longueur 254 chars
- [X] **escHtml** : tous les templates échappent les inputs user (`buildConfirmEmail`, `buildBriefEmail`)
- [X] **Anti-énumération** : `/subscribe` répond toujours 200, même si email invalide / inexistant / déjà inscrit
- [X] **Token unique** : `randomBytes(32)` = 256 bits d'entropie, jamais réutilisé après confirmation
- [X] **Token lookup** : par token (jamais par email seul pour confirm/unsub)
- [X] **CRON auth** : `Bearer ${CRON_SECRET}` obligatoire, sinon 401
- [X] **RLS** : tables Supabase totalement bloquées en anon, accès uniquement via service_role (API routes)
- [X] **Désinscription 1-clic** : header `List-Unsubscribe` + `List-Unsubscribe-Post` pour Gmail/Yahoo
- [X] **DNS authentification** : SPF + DKIM via Resend (anti-spoof, deliverability)

## 🔥 Si quelque chose part en vrille

- Désactiver le cron : Vercel Dashboard → Settings → Cron Jobs → toggle off
- Désactiver le backend : retirer la var `SUPABASE_URL` dans Vercel → le formulaire fallback sur localStorage automatiquement
- Voir les sends : Dashboard Supabase → Table Editor → `newsletter_runs`
- Voir les abonnés : Dashboard Supabase → Table Editor → `newsletter_subscribers`
