import React, { useCallback } from 'react'
import { CaptionClip as CaptionClipType } from '../../types'
import { useCaptionStore } from '../../store/captionStore'

const RESIZE_HANDLE_WIDTH = 8
const MIN_CAPTION_DURATION = 0.2

interface Props {
  clip: CaptionClipType
  pixelsPerSecond: number
  trackHeight: number
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`
}

export function CaptionClip({ clip, pixelsPerSecond, trackHeight }: Props) {
  const { updateClip, removeClip, setSelectedClipId } = useCaptionStore()

  const leftPx = clip.startTime * pixelsPerSecond
  const widthPx = Math.max(clip.duration * pixelsPerSecond, RESIZE_HANDLE_WIDTH * 2 + 16)

  // ── Body drag (move startTime) ──────────────────────────────────────────────
  const handleBodyPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).dataset.handle) return
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

  // ── Right resize handle (adjust duration) ───────────────────────────────────
  const handleRightResizeDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const startX = e.clientX
      const originalDuration = clip.duration

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX
        const newDuration = Math.max(MIN_CAPTION_DURATION, originalDuration + dx / pixelsPerSecond)
        updateClip(clip.id, { duration: newDuration })
      }
      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [clip.id, clip.duration, pixelsPerSecond, updateClip]
  )

  const previewText = clip.text.trim() || 'Empty caption'

  return (
    <div
      className="absolute top-1 bottom-1 rounded flex items-center select-none group"
      style={{
        left: leftPx,
        width: widthPx,
        backgroundColor: '#7c3aed',
        border: '1px solid #a78bfa',
        cursor: 'grab',
        zIndex: 10,
        height: trackHeight - 8
      }}
      onPointerDown={handleBodyPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setSelectedClipId(clip.id)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (confirm(`Delete caption "${previewText.slice(0, 40)}"?`)) removeClip(clip.id)
      }}
      title="Drag to move · Resize right edge · Double-click to edit · Right-click to delete"
    >
      {/* Caption text preview */}
      <div
        className="flex flex-col justify-center flex-1 overflow-hidden pointer-events-none"
        style={{ paddingLeft: RESIZE_HANDLE_WIDTH + 4, paddingRight: RESIZE_HANDLE_WIDTH + 4 }}
      >
        <span className="text-white text-[10px] font-medium truncate leading-tight">
          {previewText}
        </span>
        <span className="text-white/60 text-[9px] font-mono leading-tight">
          {formatSec(clip.startTime)} – {formatSec(clip.startTime + clip.duration)}
        </span>
      </div>

      {/* Right resize handle */}
      <div
        data-handle="right"
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center
                   bg-black/40 hover:bg-black/60 cursor-col-resize rounded-r z-20"
        style={{ width: RESIZE_HANDLE_WIDTH }}
        onPointerDown={handleRightResizeDown}
      >
        <div className="w-0.5 h-4 bg-white/60 rounded-full" />
      </div>
    </div>
  )
}
