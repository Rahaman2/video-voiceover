import React from 'react'

interface Props {
  volume: number
  onChange: (v: number) => void
}

export function VolumeSlider({ volume, onChange }: Props) {
  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
                 bg-surface border border-accent/50 rounded-lg shadow-xl p-2 flex flex-col items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] text-muted">Vol</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-highlight"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 16, height: 60 }}
      />
      <span className="text-[10px] text-white">{Math.round(volume * 100)}%</span>
    </div>
  )
}
