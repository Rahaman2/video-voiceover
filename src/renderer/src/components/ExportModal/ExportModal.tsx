import React, { useState, useEffect } from 'react'
import { useVideoStore } from '../../store/videoStore'
import { useTimelineStore } from '../../store/timelineStore'
import { useVideoClipStore } from '../../store/videoClipStore'
import { ClipExport, VideoClipExport } from '../../types'

interface Props {
  onClose: () => void
}

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error'

export function ExportModal({ onClose }: Props) {
  const { videoPath, videoWidth, videoHeight } = useVideoStore()
  const { clips } = useTimelineStore()
  const { clips: videoClips } = useVideoClipStore()

  const [status, setStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Subscribe to FFmpeg events
  useEffect(() => {
    const offProgress = window.electronAPI.onExportProgress((pct) => setProgress(pct))
    const offDone = window.electronAPI.onExportDone((path) => {
      setOutputPath(path)
      setStatus('done')
    })
    const offError = window.electronAPI.onExportError((msg) => {
      setErrorMsg(msg)
      setStatus('error')
    })
    return () => {
      offProgress()
      offDone()
      offError()
    }
  }, [])

  async function handleExport() {
    if (!videoPath) return

    const savePath = await window.electronAPI.saveFileDialog('voiceover-output.mp4')
    if (!savePath) return

    const clipExports: ClipExport[] = clips.map((c) => ({
      audioPath: c.audioPath,
      startTime: c.startTime,
      trimStart: c.trimStart,
      duration: c.duration - c.trimStart - c.trimEnd,
      volume: c.volume
    }))

    const videoClipExports: VideoClipExport[] = videoClips.map((vc) => ({
      type: vc.type,
      sourcePath: vc.sourcePath,
      trimStart: vc.trimStart,
      duration: vc.duration,
    }))

    setStatus('exporting')
    setProgress(0)
    setErrorMsg(null)

    try {
      await window.electronAPI.exportVideo({
        videoPath,
        outputPath: savePath,
        clips: clipExports,
        videoClips: videoClipExports,
        videoDimensions: videoWidth > 0 ? { width: videoWidth, height: videoHeight } : undefined,
      })
    } catch (err) {
      // error is handled via IPC event
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-panel border border-accent/40 rounded-2xl shadow-2xl p-6 w-96 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Export Video</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>

        {/* Summary */}
        <div className="bg-surface rounded-lg p-3 text-sm text-muted">
          <div className="flex justify-between">
            <span>Video segments</span>
            <span className="text-white">{videoClips.length || 1}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Voice-over / music clips</span>
            <span className="text-white">{clips.length}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Original audio</span>
            <span className="text-white">Muted</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Output format</span>
            <span className="text-white">MP4 (H.264 / AAC)</span>
          </div>
        </div>

        {/* Progress */}
        {status === 'exporting' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-muted">
              <span>Processing…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-accent/30 rounded-full h-2">
              <div
                className="bg-highlight h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="bg-green-900/30 border border-green-700/40 rounded-lg p-3 text-sm text-green-300">
            Export complete!<br />
            <span className="text-[10px] text-green-400/70 break-all">{outputPath}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/30 border border-red-700/40 rounded-lg p-3 text-xs text-red-300 max-h-32 overflow-y-auto">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-muted hover:text-white hover:bg-accent/40 transition-colors"
          >
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          {(status === 'idle' || status === 'error') && (
            <button
              onClick={handleExport}
              disabled={!videoPath}
              className="px-4 py-2 rounded bg-highlight text-white text-sm font-medium
                         hover:bg-highlight/80 disabled:opacity-40 transition-colors"
            >
              Choose Output & Export
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
