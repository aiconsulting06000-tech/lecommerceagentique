/**
 * Server-side Supabase client using service_role key.
 * Returns `null` if env vars are not configured — callers must check.
 * NEVER expose service_role to the client.
 *
 * The URL is normalized defensively: if the user pasted a dashboard URL with
 * a path (e.g. https://xxx.supabase.co/project/yyy/settings/api), we strip
 * the path to keep only `scheme://host`. This pre-empts PGRST125 errors.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    // Keep only scheme + host (no path, no query, no trailing slash)
    return `${u.protocol}//${u.host}`
  } catch {
    // Fallback: just strip trailing slashes and whitespace
    return raw.trim().replace(/\/+$/, '')
  }
}

export function getSupabaseServer(): SupabaseClient | null {
  if (cached) return cached

  const rawUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!rawUrl || !serviceKey) {
    return null
  }

  const url = normalizeUrl(rawUrl)

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
