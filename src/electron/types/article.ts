export interface LatestArticle {
  slug: string
  title: string
  excerpt: string
  image: string | null
  publishedAt: string | null
  /** Lien public vers l'article complet sur le site. */
  url: string
}
