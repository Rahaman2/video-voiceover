import React, { useEffect, useRef } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useTimelineStore } from '../../store/timelineStore'
import { useVideoStore } from '../../store/videoStore'
import { getAudioDuration } from '../../utils/audioUtils'

interface Props {
  onClose: () => void
}

export function AudioRecorder({ onClose }: Props) {
  const { status, startRecording, pauseRecording, resumeRecording, stopRecording, error } =
    useAudioRecorder()
  const { tracks, addClip } = useTimelineStore()
  const { currentTime } = useVideoStore()

  // Remember where the playhead was when recording started
  const recordStartTimeRef = useRef<number>(0)

  // Live mic visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function handleStart() {
    recordStartTimeRef.current = currentTime
    await startRecording()
    // Set up visualizer
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser
      drawVisualizer()
    } catch {
      // Visualizer optional, ignore
    }
  }

  function drawVisualizer() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')!
    const bufLen = analyser.frequencyBinCount
    const data = new Uint8Array(bufLen)

    function render() {
      animFrameRef.current = requestAnimationFrame(render)
      analyser.getByteFrequencyData(data)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f3460'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barW = canvas.width / bufLen
      data.forEach((val, i) => {
        const h = (val / 255) * canvas.height
        ctx.fillStyle = `hsl(${(i / bufLen) * 120 + 180}, 70%, 60%)`
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
      })
    }
    render()
  }

  function stopVisualizer() {
    cancelAnimationFrame(animFrameRef.current)
    analyserRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function handleStop() {
    stopVisualizer()
    const filePath = await stopRecording()
    if (filePath) {
      const defaultTrackId = tracks[0]?.id
      if (defaultTrackId) {
        const duration = await getAudioDuration(filePath)
        addClip({
          trackId: defaultTrackId,
          audioPath: filePath,
          label: `Recording ${new Date().toLocaleTimeString()}`,
          startTime: recordStartTimeRef.current,
          duration,
          trimStart: 0,
          trimEnd: 0,
          volume: 1
        })
      }
      onClose()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopVisualizer()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-panel border border-accent/40 rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Record Audio</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>

        {/* Visualizer */}
        <canvas
          ref={canvasRef}
          width={280}
          height={80}
          className="rounded-lg w-full"
          style={{ background: '#0f3460' }}
        />

        {/* Status */}
        <div className="text-center text-sm">
          {status === 'idle' && <span className="text-muted">Ready to record</span>}
          {status === 'recording' && (
            <span className="text-red-400 animate-pulse font-medium">● Recording…</span>
          )}
          {status === 'paused' && (
            <span className="text-yellow-400 font-medium">⏸ Paused</span>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-xs text-center bg-red-900/20 rounded p-2">{error}</div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {status === 'idle' && (
            <RecorderButton onClick={handleStart} color="bg-red-500 hover:bg-red-400" label="Record">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="7" />
              </svg>
            </RecorderButton>
          )}

          {status === 'recording' && (
            <>
              <RecorderButton onClick={pauseRecording} color="bg-yellow-500 hover:bg-yellow-400" label="Pause">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </RecorderButton>
              <RecorderButton onClick={handleStop} color="bg-gray-600 hover:bg-gray-500" label="Stop">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="5" y="5" width="14" height="14" />
                </svg>
              </RecorderButton>
            </>
          )}

          {status === 'paused' && (
            <>
              <RecorderButton onClick={resumeRecording} color="bg-green-600 hover:bg-green-500" label="Resume">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </RecorderButton>
              <RecorderButton onClick={handleStop} color="bg-gray-600 hover:bg-gray-500" label="Stop & Save">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="5" y="5" width="14" height="14" />
                </svg>
              </RecorderButton>
            </>
          )}
        </div>

        <p className="text-[10px] text-muted text-center">
          Recording will start at playhead position {currentTime.toFixed(1)}s
        </p>
      </div>
    </div>
  )
}

interface RecorderButtonProps {
  onClick: () => void
  color: string
  label: string
  children: React.ReactNode
}

function RecorderButton({ onClick, color, label, children }: RecorderButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-12 h-12 rounded-full text-white transition-colors ${color}`}
    >
      {children}
    </button>
  )
}
