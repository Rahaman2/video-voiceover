import React, { useState, useRef, useEffect, useCallback } from 'react'
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Timeline } from './components/Timeline/Timeline'
import { AudioRecorder } from './components/AudioRecorder/AudioRecorder'
import { ExportModal } from './components/ExportModal/ExportModal'
import { MediaBrowser } from './components/MediaBrowser'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { useAudioPreview } from './hooks/useAudioPreview'
// Initialise media providers (side-effect import — safe to remove if feature is disabled)
import './plugins/media'

export default function App() {
  const [showRecorder, setShowRecorder] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showMediaBrowser, setShowMediaBrowser] = useState(false)

  // Controls reference from VideoPlayer (seek, play, pause)
  const seekRef = useRef<((time: number) => void) | null>(null)

  const handlePlayerReady = useCallback((controls: ReturnType<typeof useVideoPlayer>) => {
    seekRef.current = controls.seekTo
  }, [])

  const handleSeek = useCallback((time: number) => {
    seekRef.current?.(time)
  }, [])

  // Audio preview: plays timeline clips in sync with the video during preview
  useAudioPreview()

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        // Toggle play/pause by dispatching a custom event the VideoPlayer listens to
        document.dispatchEvent(new CustomEvent('voiceover:togglePlay'))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-surface text-white overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        onOpenRecorder={() => setShowRecorder(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenMediaBrowser={() => setShowMediaBrowser(true)}
      />

      {/* Top 2/3: Video player — full width */}
      <div className="min-h-0 p-3 pb-1" style={{ flex: 2 }}>
        <VideoPlayer onPlayerReady={handlePlayerReady} />
      </div>

      {/* Bottom 1/3: Timeline — full width */}
      <div className="min-h-0 p-3 pt-1 flex flex-col" style={{ flex: 1 }}>
        <Timeline onSeek={handleSeek} />
      </div>

      {/* Modals */}
      {showRecorder && <AudioRecorder onClose={() => setShowRecorder(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showMediaBrowser && <MediaBrowser onClose={() => setShowMediaBrowser(false)} />}
    </div>
  )
}
