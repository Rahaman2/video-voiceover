import React, { useState, useEffect, useCallback, useRef } from 'react'
import { mediaRegistry } from '../../plugins/media'
import { useMediaSearch } from '../../plugins/media/useMediaSearch'
import type { MediaItem, MediaProvider } from '../../plugins/media/types'
import { MediaCard } from './MediaCard'
import { useTimelineStore } from '../../store/timelineStore'
import { useVideoStore } from '../../store/videoStore'
import { useVideoClipStore } from '../../store/videoClipStore'
import { getAudioDuration } from '../../utils/audioUtils'

interface Props {
  onClose: () => void
}

const API_KEY_STORAGE_PREFIX = 'media:apikey:'

function getStoredKey(providerId: string): string {
  return localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${providerId}`) ?? ''
}

function setStoredKey(providerId: string, key: string): void {
  if (key.trim()) {
    localStorage.setItem(`${API_KEY_STORAGE_PREFIX}${providerId}`, key.trim())
  } else {
    localStorage.removeItem(`${API_KEY_STORAGE_PREFIX}${providerId}`)
  }
}

export function MediaBrowser({ onClose }: Props) {
  const providers = mediaRegistry.getAll()
  const [activeProviderId, setActiveProviderId] = useState(providers[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [apiKey, setApiKey] = useState(() => getStoredKey(providers[0]?.id ?? ''))
  const [apiKeyInput, setApiKeyInput] = useState(apiKey)
  const [showApiKey, setShowApiKey] = useState(false)

  const { items, loading, error, hasMore, currentPage, currentQuery, search, reset } = useMediaSearch()
  const { tracks, addClip } = useTimelineStore()
  const { setVideoPath, currentTime, videoPath } = useVideoStore()
  const { insertImageAt } = useVideoClipStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const activeProvider: MediaProvider | undefined = mediaRegistry.get(activeProviderId)

  // When provider changes, load its saved API key and reset results
  useEffect(() => {
    const saved = getStoredKey(activeProviderId)
    setApiKey(saved)
    setApiKeyInput(saved)
    reset()
    setQuery('')
  }, [activeProviderId, reset])

  // Dismiss on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSaveApiKey() {
    setStoredKey(activeProviderId, apiKeyInput)
    setApiKey(apiKeyInput)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    search(activeProviderId, query, 'all', apiKey || null, 1)
  }

  function handleLoadMore() {
    search(activeProviderId, currentQuery, 'all', apiKey || null, currentPage + 1)
  }

  // Action handler for each card — varies by media type
  const handleItemAction = useCallback(async (item: MediaItem) => {
    if (item.type === 'audio') {
      await addMediaToTimeline(item, tracks, addClip)
    } else if (item.type === 'video') {
      await useAsVideoSource(item, setVideoPath)
    } else {
      // image — insert into the video timeline at the current playhead position
      if (videoPath) {
        await insertImageIntoVideo(item, currentTime, insertImageAt)
      } else {
        // No video loaded yet — just open in browser as a fallback
        window.open(item.downloadUrl)
      }
    }
  }, [tracks, addClip, setVideoPath, currentTime, videoPath, insertImageAt])

  function actionLabel(item: MediaItem): string {
    if (item.type === 'audio') return 'Add to Timeline'
    if (item.type === 'video') return 'Use as Source'
    return videoPath ? 'Insert in Video' : 'Open Image'
  }

  const needsKey = activeProvider?.requiresApiKey && !apiKey

  if (providers.length === 0) {
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
          <p className="text-lg font-semibold text-white">No media providers registered</p>
          <p className="text-sm">Add providers in <code>plugins/media/providers/index.ts</code></p>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div
        className="flex flex-col h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/30 flex-shrink-0">
          <h2 className="text-white font-semibold text-base tracking-wide">Media Browser</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-accent/40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar: provider list */}
          <div className="w-44 flex-shrink-0 border-r border-accent/30 flex flex-col py-2 gap-0.5 overflow-y-auto">
            <p className="text-muted text-xs uppercase tracking-wider px-3 py-1">Sources</p>
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProviderId(p.id)}
                className={`text-left px-3 py-2 text-sm rounded mx-1 transition-colors
                  ${p.id === activeProviderId
                    ? 'bg-highlight/20 text-white border border-highlight/40'
                    : 'text-muted hover:text-white hover:bg-accent/30'
                  }`}
              >
                <span className="block font-medium">{p.name}</span>
                <span className="block text-xs opacity-60 truncate">{p.description}</span>
              </button>
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* API key bar */}
            {activeProvider?.requiresApiKey && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-accent/30 bg-accent/10 flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="text-muted text-xs flex-shrink-0">{activeProvider.apiKeyLabel ?? 'API Key'}:</span>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
                  placeholder="Paste your API key…"
                  className="flex-1 min-w-0 bg-transparent text-white text-xs border border-accent/40 rounded px-2 py-1
                             focus:outline-none focus:border-highlight/60 placeholder:text-muted/40"
                />
                <button
                  onClick={() => setShowApiKey(v => !v)}
                  className="text-muted hover:text-white transition-colors text-xs px-1"
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? '🙈' : '👁'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="text-xs px-2 py-1 rounded bg-highlight/70 hover:bg-highlight text-white transition-colors flex-shrink-0"
                >
                  Save
                </button>
                {activeProvider.apiKeyHelpUrl && (
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); window.open(activeProvider.apiKeyHelpUrl) }}
                    className="text-xs text-highlight hover:underline flex-shrink-0"
                    title="Get an API key"
                  >
                    Get key
                  </a>
                )}
              </div>
            )}

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2 border-b border-accent/30 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-accent/20 border border-accent/40 rounded px-3 py-1.5 focus-within:border-highlight/50">
                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={needsKey ? 'Enter API key above first…' : 'Search for images, videos…'}
                  disabled={needsKey}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted/50 disabled:opacity-40"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || needsKey || loading}
                className="px-3 py-1.5 rounded bg-highlight/80 hover:bg-highlight text-white text-sm font-medium
                           disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {loading ? 'Searching…' : 'Search'}
              </button>
            </form>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3">
              {/* No API key notice */}
              {needsKey && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <svg className="w-10 h-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <p className="text-muted text-sm">Paste your <strong className="text-white">{activeProvider?.apiKeyLabel}</strong> above to start browsing.</p>
                  {activeProvider?.apiKeyHelpUrl && (
                    <a
                      href="#"
                      onClick={e => { e.preventDefault(); window.open(activeProvider.apiKeyHelpUrl) }}
                      className="text-highlight text-sm hover:underline"
                    >
                      Get a free API key →
                    </a>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-3 p-3 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && !needsKey && items.length === 0 && currentQuery && (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No results for "{currentQuery}"</p>
                </div>
              )}

              {/* Initial state */}
              {!loading && !error && !needsKey && items.length === 0 && !currentQuery && (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm">Search for stock media above</p>
                  <p className="text-xs opacity-60">Powered by {activeProvider?.name}</p>
                </div>
              )}

              {/* Results grid */}
              {items.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map(item => (
                      <MediaCard
                        key={`${item.provider}-${item.id}`}
                        item={item}
                        onAction={handleItemAction}
                        actionLabel={actionLabel(item)}
                      />
                    ))}
                  </div>

                  {/* Load more / status */}
                  <div className="flex items-center justify-center mt-4 pb-2">
                    {loading ? (
                      <span className="text-muted text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading…
                      </span>
                    ) : hasMore ? (
                      <button
                        onClick={handleLoadMore}
                        className="px-4 py-1.5 text-sm text-muted border border-accent/40 rounded hover:border-accent/80 hover:text-white transition-colors"
                      >
                        Load more ({items.length} / {currentPage * 20}+ results)
                      </button>
                    ) : (
                      <span className="text-muted text-xs">{items.length} results</span>
                    )}
                  </div>
                </>
              )}

              {/* Skeleton loader for first search */}
              {loading && items.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-accent/20 border border-accent/20 overflow-hidden animate-pulse">
                      <div className="aspect-video bg-accent/30" />
                      <div className="p-2 flex flex-col gap-1.5">
                        <div className="h-2.5 bg-accent/40 rounded w-3/4" />
                        <div className="h-2 bg-accent/30 rounded w-1/2" />
                        <div className="h-5 bg-accent/40 rounded mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

// ─── Helper: modal overlay ───────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[90vw] h-[82vh] max-w-5xl bg-panel border border-accent/40 rounded-xl shadow-2xl
                   flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Helper: add audio to timeline ───────────────────────────────────────────

async function addMediaToTimeline(
  item: MediaItem,
  tracks: ReturnType<typeof useTimelineStore.getState>['tracks'],
  addClip: ReturnType<typeof useTimelineStore.getState>['addClip'],
): Promise<void> {
  const ext = getExt(item.downloadUrl) || 'mp3'
  const localPath = await window.electronAPI.downloadMediaUrl(item.downloadUrl, ext)
  const duration = await getAudioDuration(localPath)
  const trackId = tracks[0]?.id
  if (!trackId) throw new Error('No track available. Add a track first.')
  addClip({
    trackId,
    audioPath: localPath,
    label: item.title,
    startTime: 0,
    duration,
    trimStart: 0,
    trimEnd: 0,
    volume: 0.8,
  })
}

// ─── Helper: use video as source ─────────────────────────────────────────────

async function useAsVideoSource(
  item: MediaItem,
  setVideoPath: (path: string) => void,
): Promise<void> {
  const ext = getExt(item.downloadUrl) || 'mp4'
  const localPath = await window.electronAPI.downloadMediaUrl(item.downloadUrl, ext)
  setVideoPath(localPath)
}

// ─── Helper: insert image into video timeline ────────────────────────────────

async function insertImageIntoVideo(
  item: MediaItem,
  insertTime: number,
  insertImageAt: ReturnType<typeof useVideoClipStore.getState>['insertImageAt'],
): Promise<void> {
  const ext = getExt(item.downloadUrl) || 'jpg'
  const localPath = await window.electronAPI.downloadMediaUrl(item.downloadUrl, ext)
  // Default image hold duration: 3 seconds
  insertImageAt(insertTime, localPath, item.title, 3)
}

// ─── Helper: extract file extension from URL ─────────────────────────────────

function getExt(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return pathname.split('.').pop()?.split('?')[0]?.toLowerCase() ?? ''
  } catch {
    return url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? ''
  }
}
