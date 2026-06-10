-- ──────────────────────────────────────────────────────────────────
-- Le Commerce Agentique — Newsletter backend
-- Migration 0001 · 2026-06-10
-- ──────────────────────────────────────────────────────────────────
-- Tables:
--   • newsletter_subscribers — emails captured, double opt-in flow
--   • newsletter_runs        — log of weekly sends (audit + observability)
--
-- Security:
--   • RLS enabled on both tables
--   • No SELECT/UPDATE/DELETE for anon → only INSERT on subscribers (subscribe flow)
--   • service_role bypasses RLS automatically (server-side cron + API routes)
-- ──────────────────────────────────────────────────────────────────

-- Subscribers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL UNIQUE,
  confirmed         boolean NOT NULL DEFAULT false,
  confirm_token     text,
  unsubscribe_token text NOT NULL,
  source            text NOT NULL DEFAULT 'lecommerceagentique.fr',
  subscribed_at     timestamptz NOT NULL DEFAULT now(),
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_subs_email             ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subs_confirm_token     ON public.newsletter_subscribers(confirm_token) WHERE confirm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subs_unsubscribe_token ON public.newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subs_active            ON public.newsletter_subscribers(confirmed, unsubscribed_at) WHERE confirmed = true AND unsubscribed_at IS NULL;

-- Runs (audit log) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text NOT NULL,
  sent_count    int NOT NULL DEFAULT 0,
  failed_count  int NOT NULL DEFAULT 0,
  article_slugs jsonb,
  ran_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runs_ran_at ON public.newsletter_runs(ran_at DESC);

-- ──────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_runs        ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (idempotent re-run)
DROP POLICY IF EXISTS "no_anon_access_subs"    ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "no_anon_access_runs"    ON public.newsletter_runs;
DROP POLICY IF EXISTS "service_role_full_subs" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "service_role_full_runs" ON public.newsletter_runs;

-- NO anon access at all on subscribers — all writes go through API routes
-- using service_role key. This is the safest setup: anon CANNOT read or write
-- subscriber data directly even with leaked anon key.
CREATE POLICY "no_anon_access_subs"
  ON public.newsletter_subscribers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "no_anon_access_runs"
  ON public.newsletter_runs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- service_role bypasses RLS by default in Supabase, but be explicit:
-- (these policies are redundant with the service_role bypass, kept for clarity)
COMMENT ON TABLE public.newsletter_subscribers IS
  'Newsletter subscribers with double opt-in. Access only via API routes using service_role.';
COMMENT ON TABLE public.newsletter_runs IS
  'Audit log of weekly newsletter sends. Read access via service_role only.';
