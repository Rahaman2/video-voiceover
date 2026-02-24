import React, { useRef, useState, useCallback } from 'react'
import { AudioClip } from '../../types'
import { useTimelineStore } from '../../store/timelineStore'
import { VolumeSlider } from '../ClipControls/VolumeSlider'

const TRIM_HANDLE_WIDTH = 8
const MIN_CLIP_DURATION = 0.1 // seconds

interface Props {
  clip: AudioClip
  pixelsPerSecond: number
  trackHeight: number
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`
}

export function Clip({ clip, pixelsPerSecond, trackHeight }: Props) {
  const { updateClip, removeClip } = useTimelineStore()
  const [showVolume, setShowVolume] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
  const leftPx = clip.startTime * pixelsPerSecond
  const widthPx = Math.max(effectiveDuration * pixelsPerSecond, TRIM_HANDLE_WIDTH * 2 + 4)

  // ── Body drag (move startTime) ──────────────────────────────────────────────
  const handleBodyPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).dataset.handle) return // let handles take priority
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)

      const startX = e.clientX
      const originalStart = clip.startTime

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX
        const newStart = Math.max(0, originalStart + dx / pixelsPerSecond)
        updateClip(clip.id, { startTime: newStart })
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [clip.id, clip.startTime, pixelsPerSecond, updateClip]
  )

  // ── Left trim handle (adjusts trimStart + startTime) ────────────────────────
  const handleLeftTrimDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const startX = e.clientX
      const originalTrimStart = clip.trimStart
      const originalStartTime = clip.startTime

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX
        const deltaSecs = dx / pixelsPerSecond
        const newTrimStart = Math.max(0, Math.min(
          originalTrimStart + deltaSecs,
          clip.duration - clip.trimEnd - MIN_CLIP_DURATION
        ))
        const newStartTime = Math.max(0, originalStartTime + (newTrimStart - originalTrimStart))
        updateClip(clip.id, { trimStart: newTrimStart, startTime: newStartTime })
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [clip, pixelsPerSecond, updateClip]
  )

  // ── Right trim handle (adjusts trimEnd) ─────────────────────────────────────
  const handleRightTrimDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const startX = e.clientX
      const originalTrimEnd = clip.trimEnd

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX
        const deltaSecs = dx / pixelsPerSecond
        const newTrimEnd = Math.max(0, Math.min(
          originalTrimEnd - deltaSecs,
          clip.duration - clip.trimStart - MIN_CLIP_DURATION
        ))
        updateClip(clip.id, { trimEnd: newTrimEnd })
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [clip, pixelsPerSecond, updateClip]
  )

  return (
    <div
      ref={containerRef}
      className="absolute top-1 bottom-1 rounded flex items-center select-none group"
      style={{
        left: leftPx,
        width: widthPx,
        backgroundColor: clip.color,
        cursor: 'grab',
        zIndex: 10
      }}
      onPointerDown={handleBodyPointerDown}
      onDoubleClick={() => setShowVolume((v) => !v)}
      title={`${clip.label}\nDouble-click for volume\nRight-click to delete`}
      onContextMenu={(e) => {
        e.preventDefault()
        if (confirm(`Delete clip "${clip.label}"?`)) removeClip(clip.id)
      }}
    >
      {/* Left trim handle */}
      <div
        data-handle="left"
        className="absolute left-0 top-0 bottom-0 flex items-center justify-center
                   bg-black/40 hover:bg-black/60 cursor-col-resize rounded-l z-20"
        style={{ width: TRIM_HANDLE_WIDTH }}
        onPointerDown={handleLeftTrimDown}
      >
        <div className="w-0.5 h-4 bg-white/60 rounded-full" />
      </div>

      {/* Label + time range */}
      <div
        className="flex flex-col justify-center flex-1 overflow-hidden pointer-events-none"
        style={{ paddingLeft: TRIM_HANDLE_WIDTH + 4, paddingRight: TRIM_HANDLE_WIDTH + 4 }}
      >
        <span className="text-white text-[10px] font-medium truncate leading-tight">
          {clip.label}
        </span>
        <span className="text-white/60 text-[9px] font-mono leading-tight">
          {formatSec(clip.startTime)} – {formatSec(clip.startTime + effectiveDuration)}
        </span>
      </div>

      {/* Right trim handle */}
      <div
        data-handle="right"
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center
                   bg-black/40 hover:bg-black/60 cursor-col-resize rounded-r z-20"
        style={{ width: TRIM_HANDLE_WIDTH }}
        onPointerDown={handleRightTrimDown}
      >
        <div className="w-0.5 h-4 bg-white/60 rounded-full" />
      </div>

      {/* Volume slider (shown on double-click) */}
      {showVolume && (
        <VolumeSlider
          volume={clip.volume}
          onChange={(v) => {
            updateClip(clip.id, { volume: v })
          }}
        />
      )}
    </div>
  )
}
