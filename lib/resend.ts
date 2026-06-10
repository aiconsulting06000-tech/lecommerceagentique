/**
 * Resend email client.
 * Returns `null` if env var not configured.
 */
import { Resend } from 'resend'

let cached: Resend | null = null

export function getResend(): Resend | null {
  if (cached) return cached
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  cached = new Resend(key)
  return cached
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

// Sender identity
export const NEWSLETTER_FROM = 'Le Brief A-commerce <brief@lecommerceagentique.fr>'
export const NEWSLETTER_REPLY_TO = 'contact@acfstandard.com'
