import type { MetadataRoute } from 'next'
import { ARTICLE_CONTENT } from './articles/[slug]/articles-content'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://lecommerceagentique.fr'
  const now = new Date('2026-06-09')

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/#definition`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/#etudes`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/#modes`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/#fonctionnement`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/#articles`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/#veille`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/#classement`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/#acteurs`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/#gouvernance`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/#glossaire`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/#newsletter`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/#conformite`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/methodologie`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/veille`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politique-confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const articlePages: MetadataRoute.Sitemap = Object.entries(ARTICLE_CONTENT).map(
    ([slug, article]) => ({
      url: `${base}/articles/${slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.95,
    })
  )

  return [...staticPages, ...articlePages]
}
