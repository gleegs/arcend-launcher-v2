import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchLatestArticle } from './sanity'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }): void {
  globalThis.fetch = vi.fn().mockResolvedValue(response) as unknown as typeof fetch
}

describe('fetchLatestArticle', () => {
  it('maps a Sanity row to a LatestArticle with the public site url', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        result: {
          slug: 'mon-article',
          title: 'Titre',
          excerpt: 'Extrait',
          image: 'https://cdn/img.png',
          publishedAt: '2026-06-20T12:00:00Z',
        },
      }),
    })

    expect(await fetchLatestArticle()).toEqual({
      slug: 'mon-article',
      title: 'Titre',
      excerpt: 'Extrait',
      image: 'https://cdn/img.png',
      publishedAt: '2026-06-20T12:00:00Z',
      url: 'https://arcend.fr/actualites/mon-article',
    })
  })

  it('returns null when there is no article', async () => {
    mockFetch({ ok: true, json: async () => ({ result: null }) })
    expect(await fetchLatestArticle()).toBeNull()
  })

  it('returns null when the row has no slug', async () => {
    mockFetch({ ok: true, json: async () => ({ result: { slug: null, title: 'x' } }) })
    expect(await fetchLatestArticle()).toBeNull()
  })

  it('coerces missing fields to empty strings / null', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        result: { slug: 's', title: null, excerpt: null, image: null, publishedAt: null },
      }),
    })

    expect(await fetchLatestArticle()).toEqual({
      slug: 's',
      title: '',
      excerpt: '',
      image: null,
      publishedAt: null,
      url: 'https://arcend.fr/actualites/s',
    })
  })

  it('throws when the response is not ok', async () => {
    mockFetch({ ok: false, status: 500, statusText: 'Server Error' })
    await expect(fetchLatestArticle()).rejects.toThrow(/Sanity fetch error/)
  })
})
