import React, { useEffect, useRef } from 'react'
import { useCaptionStore } from '../../store/captionStore'
import { CaptionStyle } from '../../types'

const FONT_FAMILIES = ['Arial', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Times New Roman']

export function CaptionStyleEditor() {
  const { clips, selectedClipId, setSelectedClipId, updateClip } = useCaptionStore()
  const overlayRef = useRef<HTMLDivElement>(null)

  const clip = clips.find((c) => c.id === selectedClipId)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedClipId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setSelectedClipId])

  if (!clip) return null

  function updateStyle(patch: Partial<CaptionStyle>) {
    if (!clip) return
    updateClip(clip.id, { style: { ...clip.style, ...patch } })
  }

  const s = clip.style

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === overlayRef.current) setSelectedClipId(null)
      }}
    >
      <div
        className="bg-surface rounded-xl shadow-2xl border border-accent/30 w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-accent/30">
          <h2 className="text-sm font-semibold text-white">Edit Caption</h2>
          <button
            onClick={() => setSelectedClipId(null)}
            className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-white hover:bg-accent/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Caption text */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Caption Text</label>
            <textarea
              className="w-full bg-panel border border-accent/30 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:border-highlight resize-none"
              rows={3}
              placeholder="Type your caption here…"
              value={clip.text}
              onChange={(e) => updateClip(clip.id, { text: e.target.value })}
              autoFocus
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Start (seconds)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full bg-panel border border-accent/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-highlight"
                value={Math.round(clip.startTime * 10) / 10}
                onChange={(e) => updateClip(clip.id, { startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Duration (seconds)</label>
              <input
                type="number"
                min={0.2}
                step={0.1}
                className="w-full bg-panel border border-accent/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-highlight"
                value={Math.round(clip.duration * 10) / 10}
                onChange={(e) => updateClip(clip.id, { duration: Math.max(0.2, parseFloat(e.target.value) || 1) })}
              />
            </div>
          </div>

          <div className="border-t border-accent/20 pt-4">
            <p className="text-xs text-muted/60 uppercase tracking-wider mb-3">Style</p>

            {/* Font family + size */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-muted mb-1.5">Font</label>
                <select
                  className="w-full bg-panel border border-accent/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-highlight"
                  value={s.fontFamily}
                  onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Size: {s.fontSize}px</label>
                <input
                  type="range"
                  min={12}
                  max={72}
                  step={2}
                  className="w-full accent-highlight"
                  value={s.fontSize}
                  onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-muted mb-1.5">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-accent/30 bg-transparent"
                    value={s.color}
                    onChange={(e) => updateStyle({ color: e.target.value })}
                  />
                  <span className="text-xs text-muted font-mono">{s.color}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Outline Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-accent/30 bg-transparent"
                    value={s.outlineColor}
                    onChange={(e) => updateStyle({ outlineColor: e.target.value })}
                  />
                  <span className="text-xs text-muted font-mono">{s.outlineColor}</span>
                </div>
              </div>
            </div>

            {/* Outline width */}
            <div className="mb-3">
              <label className="block text-xs text-muted mb-1.5">
                Outline Width: {s.outlineWidth}px {s.outlineWidth === 0 && '(disabled)'}
              </label>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                className="w-full accent-highlight"
                value={s.outlineWidth}
                onChange={(e) => updateStyle({ outlineWidth: parseInt(e.target.value) })}
              />
            </div>

            {/* Background */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-muted mb-1.5">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-accent/30 bg-transparent"
                    value={s.backgroundColor}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  />
                  <span className="text-xs text-muted font-mono">{s.backgroundColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Background Opacity: {Math.round(s.backgroundOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full accent-highlight"
                  value={s.backgroundOpacity}
                  onChange={(e) => updateStyle({ backgroundOpacity: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Vertical position */}
            <div>
              <label className="block text-xs text-muted mb-1.5">Vertical Position</label>
              <div className="flex gap-2 flex-wrap">
                {(['top', 'center', 'bottom', 'custom'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateStyle({ verticalPosition: pos })}
                    className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                      s.verticalPosition === pos
                        ? 'bg-highlight text-white'
                        : 'bg-panel border border-accent/30 text-muted hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              {s.verticalPosition === 'custom' && (
                <div className="mt-2">
                  <label className="block text-xs text-muted mb-1">
                    Position from top: {s.verticalPercent}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={95}
                    step={1}
                    className="w-full accent-highlight"
                    value={s.verticalPercent}
                    onChange={(e) => updateStyle({ verticalPercent: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-accent/30 flex justify-end">
          <button
            onClick={() => setSelectedClipId(null)}
            className="px-4 py-1.5 bg-highlight rounded text-sm text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
