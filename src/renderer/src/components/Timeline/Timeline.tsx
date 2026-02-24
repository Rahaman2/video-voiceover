import React, { useRef, useCallback } from 'react'
import { useTimelineStore } from '../../store/timelineStore'
import { useVideoStore } from '../../store/videoStore'
import { TimeRuler } from './TimeRuler'
import { Track } from './Track'
import { Playhead } from './Playhead'

const TRACK_HEIGHT = 56
const LABEL_WIDTH = 120

interface Props {
  onSeek: (time: number) => void
}

export function Timeline({ onSeek }: Props) {
  const { tracks, clips, pixelsPerSecond, setPixelsPerSecond, addTrack } = useTimelineStore()
  const { duration } = useVideoStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalWidth = Math.max(duration * pixelsPerSecond, 1200) + 200
  const trackAreaHeight = Math.max(tracks.length * TRACK_HEIGHT, 120)

  // Click on ruler to seek
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      onSeek(x / pixelsPerSecond)
    },
    [pixelsPerSecond, onSeek]
  )

  // Ctrl + scroll to zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 10 : -10
        setPixelsPerSecond(pixelsPerSecond + delta)
      }
    },
    [pixelsPerSecond, setPixelsPerSecond]
  )

  return (
    <div className="flex flex-col bg-surface rounded-lg overflow-hidden" onWheel={handleWheel}>
      {/* Zoom controls + add track */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-panel border-b border-accent/30">
        <span className="text-xs text-muted">Zoom</span>
        <button
          onClick={() => setPixelsPerSecond(pixelsPerSecond + 20)}
          className="text-muted hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-accent/40"
        >+</button>
        <button
          onClick={() => setPixelsPerSecond(pixelsPerSecond - 20)}
          className="text-muted hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-accent/40"
        >−</button>
        <span className="text-[10px] text-muted/60">{pixelsPerSecond}px/s</span>

        <div className="flex-1" />

        <button
          onClick={() => addTrack()}
          className="flex items-center gap-1 text-xs text-muted hover:text-white
                     px-2 py-1 rounded hover:bg-accent/40 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Track
        </button>
      </div>

      {/* Scrollable timeline body */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto flex-1"
        style={{ maxHeight: 320 }}
      >
        <div id="timeline-scroll-inner" className="relative" style={{ minWidth: totalWidth + LABEL_WIDTH }}>
          {/* Ruler row: label placeholder + ruler */}
          <div className="flex sticky top-0 z-20">
            <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} className="bg-panel border-b border-accent/30 border-r border-accent/30" />
            <div className="flex-1 cursor-pointer" onClick={handleRulerClick}>
              <TimeRuler
                duration={duration}
                pixelsPerSecond={pixelsPerSecond}
                scrollLeft={0}
                width={800}
              />
            </div>
          </div>

          {/* Track rows */}
          <div className="relative" style={{ height: trackAreaHeight }}>
            {/* Playhead spans the full track area */}
            <div className="absolute" style={{ left: LABEL_WIDTH, top: 0, right: 0, height: trackAreaHeight }}>
              <Playhead
                pixelsPerSecond={pixelsPerSecond}
                height={trackAreaHeight}
                onSeek={onSeek}
              />
            </div>

            {tracks.map((track) => (
              <Track
                key={track.id}
                track={track}
                clips={clips.filter((c) => c.trackId === track.id)}
                pixelsPerSecond={pixelsPerSecond}
                totalWidth={totalWidth}
              />
            ))}

            {tracks.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                No tracks. Click "Add Track" to add one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
