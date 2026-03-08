import React from 'react'
import { useCaptionStore } from '../../store/captionStore'
import { CaptionClip } from './CaptionClip'

const TRACK_HEIGHT = 56
const LABEL_WIDTH = 120

interface Props {
  pixelsPerSecond: number
  totalWidth: number
}

export function CaptionTrack({ pixelsPerSecond, totalWidth }: Props) {
  const { clips, clearAll } = useCaptionStore()

  return (
    <div className="flex" style={{ height: TRACK_HEIGHT }}>
      {/* Label sidebar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-2 bg-panel border-r border-accent/30"
        style={{ width: LABEL_WIDTH }}
      >
        <div className="flex items-center min-w-0">
          {/* CC icon */}
          <svg className="w-3 h-3 text-muted mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 8h10M7 12h6m-6 4h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
          <span className="text-xs text-muted truncate">Captions</span>
        </div>

        {/* Clear all button (only shown when there are clips) */}
        {clips.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all captions?')) clearAll()
            }}
            title="Clear all captions"
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-600/30 text-muted hover:text-red-400 flex-shrink-0"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Clip area */}
      <div
        className="relative border-b border-accent/20 bg-black/20"
        style={{ minWidth: totalWidth, height: TRACK_HEIGHT }}
      >
        {clips.map((clip) => (
          <CaptionClip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={TRACK_HEIGHT}
          />
        ))}
      </div>
    </div>
  )
}
