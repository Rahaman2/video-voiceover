import React, { useEffect } from 'react'
import { useVideoStore } from '../../store/videoStore'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { CaptionOverlay } from './CaptionOverlay'

interface Props {
  onPlayerReady: (controls: ReturnType<typeof useVideoPlayer>) => void
}

export function VideoPlayer({ onPlayerReady }: Props) {
  const { videoPath, duration, currentTime, isPlaying } = useVideoStore()
  const controls = useVideoPlayer()
  const { videoRef, togglePlayPause, seekTo, loadVideo } = controls

  // Expose controls to parent (App) so Timeline playhead can seek
  useEffect(() => {
    onPlayerReady(controls)
  }, []) // run once on mount

  // Listen for global Space shortcut dispatched from App
  useEffect(() => {
    const handler = () => togglePlayPause()
    document.addEventListener('voiceover:togglePlay', handler)
    return () => document.removeEventListener('voiceover:togglePlay', handler)
  }, [togglePlayPause])

  // Load video whenever path changes
  useEffect(() => {
    if (videoPath) loadVideo(videoPath)
  }, [videoPath, loadVideo])

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col bg-panel rounded-lg overflow-hidden select-none h-full">
      {/* Video — always rendered so the ref and listeners attach on mount.
          Hidden via CSS when no video is loaded to avoid conditional unmount/remount
          which would cause the timeupdate listeners to never attach. */}
      <div className="relative bg-black flex items-center justify-center flex-1 min-h-0">
        <video
          ref={videoRef}
          className="max-h-full max-w-full w-full h-full object-contain"
          style={{ display: videoPath ? 'block' : 'none' }}
          onClick={togglePlayPause}
        />
        {/* Caption overlay — sits above the video, pointer-events-none */}
        {videoPath && <CaptionOverlay currentTime={currentTime} />}

        {!videoPath && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted text-sm gap-2 pointer-events-none">
            <svg className="w-14 h-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="opacity-50">Import a video to get started</span>
            <span className="text-xs opacity-30">Toolbar → Import Video</span>
          </div>
        )}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-3 px-4 py-2 bg-accent/40 flex-shrink-0">
        {/* Go to start */}
        <button
          onClick={() => seekTo(0)}
          disabled={!videoPath}
          className="text-muted disabled:opacity-30 hover:text-white transition-colors"
          title="Go to start"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={!videoPath}
          className="text-white disabled:opacity-30 hover:text-highlight transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time display — white so it's clearly visible */}
        <span className="text-sm text-white font-mono tabular-nums">
          {formatTime(currentTime)}
        </span>
        <span className="text-sm text-muted font-mono">/ {formatTime(duration)}</span>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          disabled={!videoPath}
          className="flex-1 accent-highlight disabled:opacity-30"
        />
      </div>
    </div>
  )
}
