-- ──────────────────────────────────────────────────────────────────
-- Le Commerce Agentique — News ticker (veille programmable)
-- Migration 0002 · 2026-06-10
-- ──────────────────────────────────────────────────────────────────
-- Table:
--   • news_ticker — feed Twitter-style avec backlog programmable
--
-- Pattern :
--   - On insère 30+ entrées d'avance avec display_after future
--   - La home et /veille n'affichent que celles où display_after <= now()
--   - Toggle active=false pour cacher sans supprimer
--
-- Security :
--   - RLS enabled
--   - Lecture publique anon (le ticker doit être visible sur la home)
--   - Pas d'écriture anon (admin uniquement via service_role)
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.news_ticker (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  snippet         text NOT NULL,
  category        text NOT NULL,
  source_url      text,
  source_name     text,
  published_at    timestamptz NOT NULL,
  display_after   timestamptz NOT NULL DEFAULT now(),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_visible
  ON public.news_ticker(display_after DESC)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_news_published
  ON public.news_ticker(published_at DESC);

ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_news_active" ON public.news_ticker;
DROP POLICY IF EXISTS "no_anon_write_news"     ON public.news_ticker;

-- Public read for visible news only
CREATE POLICY "public_read_news_active"
  ON public.news_ticker
  FOR SELECT
  TO anon, authenticated
  USING (active = true AND display_after <= now());

-- No anon insert/update/delete
CREATE POLICY "no_anon_write_news"
  ON public.news_ticker
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

COMMENT ON TABLE public.news_ticker IS
  'News ticker for the home feed. Programmable backlog via display_after. Read public, write via service_role only.';
