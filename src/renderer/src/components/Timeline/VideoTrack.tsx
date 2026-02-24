import React from 'react'
import { useVideoClipStore, VideoClip } from '../../store/videoClipStore'

const TRACK_HEIGHT = 56
const LABEL_WIDTH = 120

interface Props {
  pixelsPerSecond: number
  totalWidth: number
}

export function VideoTrack({ pixelsPerSecond, totalWidth }: Props) {
  const { clips, removeClip, mergeWithNext } = useVideoClipStore()

  if (clips.length === 0) return null

  return (
    <div className="flex" style={{ height: TRACK_HEIGHT }}>
      {/* Label */}
      <div
        className="flex-shrink-0 flex items-center px-2 bg-panel border-r border-accent/30"
        style={{ width: LABEL_WIDTH }}
      >
        <svg className="w-3 h-3 text-muted mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        <span className="text-xs text-muted truncate">Video</span>
      </div>

      {/* Clip area */}
      <div
        className="relative border-b border-accent/20 bg-black/20"
        style={{ minWidth: totalWidth, height: TRACK_HEIGHT }}
      >
        {clips.map((clip, idx) => (
          <VideoClipBlock
            key={clip.id}
            clip={clip}
            timelineStart={getClipStart(clips, idx)}
            pixelsPerSecond={pixelsPerSecond}
            onRemove={() => removeClip(clip.id)}
            onMergeNext={idx < clips.length - 1 ? () => mergeWithNext(clip.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function getClipStart(clips: VideoClip[], upTo: number): number {
  return clips.slice(0, upTo).reduce((sum, c) => sum + c.duration, 0)
}

interface BlockProps {
  clip: VideoClip
  timelineStart: number
  pixelsPerSecond: number
  onRemove: () => void
  onMergeNext?: () => void
}

function VideoClipBlock({ clip, timelineStart, pixelsPerSecond, onRemove, onMergeNext }: BlockProps) {
  const left = Math.round(timelineStart * pixelsPerSecond)
  const width = Math.max(Math.round(clip.duration * pixelsPerSecond), 4)

  const isImage = clip.type === 'image'

  return (
    <div
      className="absolute top-1 bottom-1 rounded overflow-hidden flex items-center group select-none"
      style={{
        left,
        width,
        backgroundColor: clip.color + 'cc',
        border: isImage ? `2px dashed ${clip.color}` : `1px solid ${clip.color}`,
      }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-1 px-1.5 flex-1 min-w-0 overflow-hidden">
        {isImage ? (
          <svg className="w-3 h-3 text-white/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        )}
        {width > 48 && (
          <span className="text-[10px] text-white/80 truncate leading-none">{clip.label}</span>
        )}
      </div>

      {/* Action buttons (shown on hover) */}
      <div className="hidden group-hover:flex items-center gap-0.5 px-0.5 flex-shrink-0">
        {/* Merge with next */}
        {onMergeNext && !isImage && width > 32 && (
          <button
            onClick={onMergeNext}
            title="Merge with next clip"
            className="w-4 h-4 flex items-center justify-center rounded bg-black/40 hover:bg-black/70 text-white/70 hover:text-white"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onRemove}
          title="Remove clip"
          className="w-4 h-4 flex items-center justify-center rounded bg-black/40 hover:bg-red-600/80 text-white/70 hover:text-white"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
