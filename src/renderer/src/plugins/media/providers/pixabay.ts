/**
 * Pixabay media provider.
 * Covers: Images, Videos
 * API docs: https://pixabay.com/api/docs/
 *
 * To add a new provider, create a file here and export a MediaProvider object,
 * then register it in ./index.ts.
 */
import type { MediaProvider, MediaItem, SearchOptions, SearchResult } from '../types'

const IMAGES_API = 'https://pixabay.com/api/'
const VIDEOS_API = 'https://pixabay.com/api/videos/'

export const pixabayImagesProvider: MediaProvider = {
  id: 'pixabay-images',
  name: 'Pixabay Images',
  description: 'Free stock photos and illustrations',
  supportedTypes: ['image'],
  requiresApiKey: true,
  apiKeyLabel: 'Pixabay API Key',
  apiKeyHelpUrl: 'https://pixabay.com/api/docs/',

  async search(options: SearchOptions, apiKey?: string): Promise<SearchResult> {
    if (!apiKey) throw new Error('A Pixabay API key is required. Get one free at pixabay.com/api/docs')

    const { query, page = 1, perPage = 20 } = options
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      image_type: 'all',
      per_page: String(Math.min(perPage, 200)),
      page: String(page),
      safesearch: 'true',
    })

    const res = await fetch(`${IMAGES_API}?${params}`)
    if (res.status === 400) throw new Error('Invalid Pixabay API key or bad request')
    if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`)

    const data = await res.json()
    const hits = (data.hits ?? []) as Record<string, unknown>[]

    const items: MediaItem[] = hits.map(hit => ({
      id: String(hit.id),
      type: 'image' as const,
      title: String(hit.tags ?? '').split(',')[0]?.trim() || 'Photo',
      thumbnail: String(hit.previewURL ?? ''),
      previewUrl: String(hit.webformatURL ?? ''),
      downloadUrl: String(hit.largeImageURL ?? ''),
      attribution: `by ${hit.user} on Pixabay`,
      provider: 'pixabay-images',
      width: Number(hit.imageWidth ?? 0),
      height: Number(hit.imageHeight ?? 0),
      tags: String(hit.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
    }))

    return {
      items,
      total: Number(data.totalHits ?? 0),
      page,
      hasMore: page * perPage < Number(data.totalHits ?? 0),
    }
  },
}

export const pixabayVideosProvider: MediaProvider = {
  id: 'pixabay-videos',
  name: 'Pixabay Videos',
  description: 'Free stock video clips for B-roll or as video source',
  supportedTypes: ['video'],
  requiresApiKey: true,
  apiKeyLabel: 'Pixabay API Key',
  apiKeyHelpUrl: 'https://pixabay.com/api/docs/',

  async search(options: SearchOptions, apiKey?: string): Promise<SearchResult> {
    if (!apiKey) throw new Error('A Pixabay API key is required. Get one free at pixabay.com/api/docs')

    const { query, page = 1, perPage = 20 } = options
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      per_page: String(Math.min(perPage, 200)),
      page: String(page),
    })

    const res = await fetch(`${VIDEOS_API}?${params}`)
    if (res.status === 400) throw new Error('Invalid Pixabay API key or bad request')
    if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`)

    const data = await res.json()
    const hits = (data.hits ?? []) as Record<string, unknown>[]

    const items: MediaItem[] = hits.map(hit => {
      const vids = (hit.videos ?? {}) as Record<string, Record<string, string>>
      const tiny = vids.tiny ?? {}
      const small = vids.small ?? {}
      const medium = vids.medium ?? {}

      return {
        id: String(hit.id),
        type: 'video' as const,
        title: String(hit.tags ?? '').split(',')[0]?.trim() || 'Video',
        thumbnail: tiny.thumbnail ?? small.thumbnail ?? '',
        previewUrl: tiny.url ?? '',
        downloadUrl: medium.url ?? small.url ?? tiny.url ?? '',
        attribution: `by ${hit.user} on Pixabay`,
        provider: 'pixabay-videos',
        duration: Number(hit.duration ?? 0),
        tags: String(hit.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
      }
    })

    return {
      items,
      total: Number(data.totalHits ?? 0),
      page,
      hasMore: page * perPage < Number(data.totalHits ?? 0),
    }
  },
}
