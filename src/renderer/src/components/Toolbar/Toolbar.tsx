import React from 'react'
import { useVideoStore } from '../../store/videoStore'
import { useTimelineStore } from '../../store/timelineStore'
import { getAudioDuration, basename } from '../../utils/audioUtils'

interface Props {
  onOpenRecorder: () => void
  onOpenExport: () => void
  onOpenMediaBrowser: () => void
}

export function Toolbar({ onOpenRecorder, onOpenExport, onOpenMediaBrowser }: Props) {
  const { videoPath, setVideoPath } = useVideoStore()
  const { tracks, addClip } = useTimelineStore()

  async function handleImportVideo() {
    const path = await window.electronAPI.openVideoDialog()
    if (path) setVideoPath(path)
  }

  async function handleImportAudio() {
    const paths = await window.electronAPI.openAudioDialog()
    if (!paths.length) return

    const defaultTrackId = tracks[0]?.id
    if (!defaultTrackId) return

    for (const p of paths) {
      const duration = await getAudioDuration(p)
      addClip({
        trackId: defaultTrackId,
        audioPath: p,
        label: basename(p),
        startTime: 0,
        duration,
        trimStart: 0,
        trimEnd: 0,
        volume: 1
      })
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-panel border-b border-accent/30">
      {/* App name */}
      <span className="text-white font-semibold text-sm mr-4 tracking-wide">VoiceOver</span>

      {/* Import Video */}
      <ToolbarButton
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        }
        label="Import Video"
        onClick={handleImportVideo}
      />

      {/* Import Audio */}
      <ToolbarButton
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        }
        label="Import Audio"
        onClick={handleImportAudio}
      />

      {/* Media Browser */}
      <ToolbarButton
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        label="Media"
        onClick={onOpenMediaBrowser}
      />

      {/* Record */}
      <ToolbarButton
        icon={
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" />
          </svg>
        }
        label="Record"
        onClick={onOpenRecorder}
        className="text-red-400 hover:text-red-300"
      />

      <div className="flex-1" />

      {/* Export */}
      <button
        onClick={onOpenExport}
        disabled={!videoPath}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-highlight text-white text-sm font-medium
                   disabled:opacity-40 hover:bg-highlight/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  className?: string
}

function ToolbarButton({ icon, label, onClick, className = '' }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm text-muted
                  hover:text-white hover:bg-accent/50 transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
