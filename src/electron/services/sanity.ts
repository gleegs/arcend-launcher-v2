import type { LatestArticle } from '../types/article'

// Lecture publique du CMS Sanity (mêmes données que le site arcend.fr).
// Le projectId / dataset sont publics (NEXT_PUBLIC_* côté site) ; aucune
// clé secrète n'est nécessaire pour lire les articles publiés.
const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'bnr3oy53'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = process.env.SANITY_API_VERSION || '2024-10-01'
const SITE_URL = 'https://arcend.fr'

// Dernier article publié (cf. app/actualites/articles.ts du site).
const LATEST_ARTICLE_QUERY =
  '*[_type == "article"]|order(publishedAt desc)[0]{"slug": slug.current, title, excerpt, "image": mainImage.asset->url, publishedAt}'

interface SanityArticleRow {
  slug: string | null
  title: string | null
  excerpt: string | null
  image: string | null
  publishedAt: string | null
}

interface SanityQueryResponse {
  result: SanityArticleRow | null
}

export async function fetchLatestArticle(): Promise<LatestArticle | null> {
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(LATEST_ARTICLE_QUERY)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Sanity fetch error: ${response.status} ${response.statusText}`)
  }

  const { result } = (await response.json()) as SanityQueryResponse
  if (!result || !result.slug) return null

  return {
    slug: result.slug,
    title: result.title ?? '',
    excerpt: result.excerpt ?? '',
    image: result.image ?? null,
    publishedAt: result.publishedAt ?? null,
    url: `${SITE_URL}/actualites/${result.slug}`,
  }
}
