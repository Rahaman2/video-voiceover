import React, { useMemo } from 'react'

interface Props {
  duration: number         // seconds
  pixelsPerSecond: number
  scrollLeft: number
  width: number            // visible container width in px
}

export function TimeRuler({ duration, pixelsPerSecond, scrollLeft, width }: Props) {
  const totalWidth = Math.max(duration * pixelsPerSecond, width) + 200

  const ticks = useMemo(() => {
    const result: { time: number; major: boolean }[] = []
    const totalSecs = Math.ceil(totalWidth / pixelsPerSecond) + 1

    for (let i = 0; i <= totalSecs; i++) {
      result.push({ time: i, major: i % 5 === 0 })
    }
    return result
  }, [totalWidth, pixelsPerSecond])

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    if (m > 0) return `${m}:${String(s).padStart(2, '0')}`
    return `${s}s`
  }

  return (
    <div
      className="relative bg-surface border-b border-accent/40 overflow-hidden"
      style={{ height: 28, minWidth: totalWidth }}
    >
      {ticks.map(({ time, major }) => {
        const x = time * pixelsPerSecond
        return (
          <div
            key={time}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: x }}
          >
            <div
              className={major ? 'bg-muted/60' : 'bg-muted/25'}
              style={{ width: 1, height: major ? 14 : 8 }}
            />
            {major && (
              <span
                className="text-muted text-[10px] mt-0.5 select-none"
                style={{ transform: 'translateX(-50%)' }}
              >
                {formatTime(time)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
