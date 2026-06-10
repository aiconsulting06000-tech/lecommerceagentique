/**
 * News ticker — shared types + server-side fetchers.
 */
import { getSupabaseServer, isSupabaseConfigured } from './supabase-server'

export interface NewsEntry {
  id: string
  title: string
  snippet: string
  category: string
  source_url: string | null
  source_name: string | null
  published_at: string
  display_after: string
  active: boolean
  created_at: string
}

/**
 * Fetch all currently-visible news, sorted by published_at descending.
 * Returns up to `limit` rows (default 5).
 */
export async function fetchVisibleNews(limit = 5): Promise<NewsEntry[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseServer()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('news_ticker')
      .select('*')
      .eq('active', true)
      .lte('display_after', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data || []) as NewsEntry[]
  } catch {
    return []
  }
}

/**
 * Fetch ALL news (visible + future + inactive) — for admin dashboard.
 */
export async function fetchAllNews(): Promise<NewsEntry[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseServer()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('news_ticker')
      .select('*')
      .order('display_after', { ascending: false })
    if (error) return []
    return (data || []) as NewsEntry[]
  } catch {
    return []
  }
}

/**
 * Format an ISO timestamp as a relative French label, à la « il y a 2 h ».
 * Falls back to dd MMM · HH:mm for older items.
 */
export function relativeTimeFr(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 0) return 'à venir'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  // Date format: "10 juin · 14:32"
  const months = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
  ]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} · ${hh}:${mm}`
}
