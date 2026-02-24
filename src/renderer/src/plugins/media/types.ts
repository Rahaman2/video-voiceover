export type MediaType = 'image' | 'audio' | 'video'

export interface MediaItem {
  id: string
  type: MediaType
  title: string
  thumbnail: string
  previewUrl?: string
  downloadUrl: string
  attribution: string
  provider: string
  duration?: number   // seconds, for audio/video
  width?: number
  height?: number
  tags?: string[]
}

export interface SearchOptions {
  query: string
  type?: MediaType | 'all'
  page?: number
  perPage?: number
}

export interface SearchResult {
  items: MediaItem[]
  total: number
  page: number
  hasMore: boolean
}

/**
 * Implement this interface to add a new media source.
 * Register your provider in plugins/media/providers/index.ts.
 */
export interface MediaProvider {
  id: string
  name: string
  description: string
  supportedTypes: MediaType[]
  requiresApiKey: boolean
  apiKeyLabel?: string
  apiKeyHelpUrl?: string
  search(options: SearchOptions, apiKey?: string): Promise<SearchResult>
}
