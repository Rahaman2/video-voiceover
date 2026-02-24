/**
 * Freesound.org audio provider — free music and sound effects.
 * API docs: https://freesound.org/docs/api/
 * Get a free API key at: https://freesound.org/apiv2/apply/
 *
 * NOTE: Pixabay does not have a documented public API for their music library.
 * Freesound is used here as the plug-and-play audio source.
 * When Pixabay makes their music API public, add it the same way in this folder.
 */
import type { MediaProvider, MediaItem, SearchOptions, SearchResult } from '../types'

const API_BASE = 'https://freesound.org/apiv2'

export const freesoundProvider: MediaProvider = {
  id: 'freesound-audio',
  name: 'Freesound Audio',
  description: 'Free music and sound effects (freesound.org)',
  supportedTypes: ['audio'],
  requiresApiKey: true,
  apiKeyLabel: 'Freesound API Key',
  apiKeyHelpUrl: 'https://freesound.org/apiv2/apply/',

  async search(options: SearchOptions, apiKey?: string): Promise<SearchResult> {
    if (!apiKey) throw new Error('A Freesound API key is required. Get one free at freesound.org/apiv2/apply/')

    const { query, page = 1, perPage = 20 } = options
    const params = new URLSearchParams({
      query,
      token: apiKey,
      fields: 'id,name,duration,previews,tags,username,images',
      page_size: String(Math.min(perPage, 150)),
      page: String(page),
      filter: 'duration:[1 TO 600]',
    })

    const res = await fetch(`${API_BASE}/search/text/?${params}`)
    if (res.status === 401) throw new Error('Invalid Freesound API key')
    if (!res.ok) throw new Error(`Freesound API error: ${res.status}`)

    const data = await res.json()
    const results = (data.results ?? []) as Record<string, unknown>[]

    const items: MediaItem[] = results.map(sound => {
      const previews = (sound.previews ?? {}) as Record<string, string>
      const images = (sound.images ?? {}) as Record<string, string>

      return {
        id: String(sound.id),
        type: 'audio' as const,
        title: String(sound.name ?? 'Sound'),
        thumbnail: images['waveform_m'] ?? '',
        previewUrl: previews['preview-lq-mp3'] ?? '',
        downloadUrl: previews['preview-hq-mp3'] ?? previews['preview-lq-mp3'] ?? '',
        attribution: `by ${sound.username ?? 'unknown'} on Freesound (CC license)`,
        provider: 'freesound-audio',
        duration: Number(sound.duration ?? 0),
        tags: Array.isArray(sound.tags) ? (sound.tags as string[]).slice(0, 6) : [],
      }
    })

    const total = Number(data.count ?? 0)

    return {
      items,
      total,
      page,
      hasMore: page * perPage < total,
    }
  },
}
