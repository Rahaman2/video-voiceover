import React, { useState } from 'react'
import type { MediaItem } from '../../plugins/media/types'

interface Props {
  item: MediaItem
  onAction: (item: MediaItem) => Promise<void>
  actionLabel: string
}

export function MediaCard({ item, onAction, actionLabel }: Props) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleAction() {
    setBusy(true)
    setErr(null)
    try {
      await onAction(item)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col rounded-lg overflow-hidden bg-accent/20 border border-accent/30 hover:border-accent/60 transition-colors group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-accent/30 overflow-hidden flex-shrink-0">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <MediaTypeIcon type={item.type} />
          </div>
        )}

        {/* Duration badge for video/audio */}
        {item.duration != null && item.duration > 0 && (
          <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1 rounded">
            {formatDuration(item.duration)}
          </span>
        )}

        {/* Type badge */}
        <span className={`absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded font-medium ${typeBadgeClass(item.type)}`}>
          {item.type}
        </span>
      </div>

      {/* Info + action */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-white text-xs font-medium truncate" title={item.title}>{item.title}</p>
        <p className="text-muted text-xs truncate">{item.attribution}</p>

        {err && <p className="text-red-400 text-xs truncate" title={err}>{err}</p>}

        <button
          onClick={handleAction}
          disabled={busy}
          className={`mt-auto w-full text-xs py-1 rounded font-medium transition-colors
            ${done
              ? 'bg-green-600/80 text-white'
              : 'bg-highlight/80 hover:bg-highlight text-white disabled:opacity-50'
            }`}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-1">
              <SpinnerIcon />
              Loading…
            </span>
          ) : done ? (
            '✓ Done'
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </div>
  )
}

function MediaTypeIcon({ type }: { type: MediaItem['type'] }) {
  if (type === 'image') return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
  if (type === 'audio') return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function typeBadgeClass(type: MediaItem['type']): string {
  if (type === 'image') return 'bg-blue-600/80 text-white'
  if (type === 'audio') return 'bg-green-600/80 text-white'
  return 'bg-purple-600/80 text-white'
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
