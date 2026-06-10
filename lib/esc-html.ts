/**
 * HTML escaping for safe interpolation in email templates.
 * Required for any user-provided string (email address, name, etc.)
 * before insertion into HTML email bodies.
 */
export function escHtml(s: string | null | undefined): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Strict email validation: RFC 5322 simplified pattern + length cap.
 * Returns normalized lowercase email or null if invalid.
 */
export function validateEmail(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length < 5 || trimmed.length > 254) return null
  // Pragmatic regex: localpart@domain.tld with reasonable chars
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) return null
  return trimmed
}
