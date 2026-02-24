import { useState, useCallback, useRef } from 'react'
import type { MediaItem, MediaType } from './types'
import { mediaRegistry } from './registry'

export interface MediaSearchState {
  items: MediaItem[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  currentQuery: string
}

const INITIAL: MediaSearchState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  hasMore: false,
  currentPage: 0,
  currentQuery: '',
}

export function useMediaSearch() {
  const [state, setState] = useState<MediaSearchState>(INITIAL)
  // Track the latest query to discard stale responses
  const queryRef = useRef('')

  const search = useCallback(async (
    providerId: string,
    query: string,
    type: MediaType | 'all',
    apiKey: string | null,
    page = 1,
  ) => {
    const provider = mediaRegistry.get(providerId)
    if (!provider) {
      setState(s => ({ ...s, error: `Provider "${providerId}" is not available`, loading: false }))
      return
    }

    queryRef.current = query
    setState(s => ({
      ...s,
      loading: true,
      error: null,
      ...(page === 1 ? { items: [], currentQuery: query, currentPage: 0 } : {}),
    }))

    try {
      const result = await provider.search({ query, type, page, perPage: 20 }, apiKey ?? undefined)

      // Discard if a newer search was started while this one was in-flight
      if (queryRef.current !== query) return

      setState(s => ({
        items: page === 1 ? result.items : [...s.items, ...result.items],
        total: result.total,
        loading: false,
        error: null,
        hasMore: result.hasMore,
        currentPage: page,
        currentQuery: query,
      }))
    } catch (e) {
      if (queryRef.current !== query) return
      setState(s => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [])

  const reset = useCallback(() => {
    queryRef.current = ''
    setState(INITIAL)
  }, [])

  return { ...state, search, reset }
}
