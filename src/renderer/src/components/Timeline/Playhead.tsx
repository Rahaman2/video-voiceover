import React, { useCallback } from 'react'
import { useVideoStore } from '../../store/videoStore'

interface Props {
  pixelsPerSecond: number
  height: number              // total height of the track area
  onSeek: (time: number) => void
}

export function Playhead({ pixelsPerSecond, height, onSeek }: Props) {
  const { currentTime } = useVideoStore()
  const leftPx = currentTime * pixelsPerSecond

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      function onMove(ev: PointerEvent) {
        const container = document.getElementById('timeline-scroll-inner')
        if (!container) return
        const rect = container.getBoundingClientRect()
        const x = Math.max(0, ev.clientX - rect.left)
        onSeek(x / pixelsPerSecond)
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [pixelsPerSecond, onSeek]
  )

  return (
    <div
      className="absolute top-0 z-50 pointer-events-none"
      style={{ left: leftPx, height }}
    >
      {/* Head */}
      <div
        className="absolute -top-1 -translate-x-1/2 cursor-col-resize pointer-events-auto"
        style={{ width: 16, height: 16 }}
        onPointerDown={handlePointerDown}
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
          <polygon points="0,0 16,0 8,10" fill="#e94560" />
        </svg>
      </div>

      {/* Vertical line */}
      <div
        className="absolute top-3 left-0 -translate-x-px bg-highlight pointer-events-auto cursor-col-resize"
        style={{ width: 2, height: height - 12 }}
        onPointerDown={handlePointerDown}
      />
    </div>
  )
}
