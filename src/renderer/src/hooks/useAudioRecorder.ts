import { useState, useRef, useCallback } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'paused'

interface UseAudioRecorderReturn {
  status: RecorderStatus
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<string | null> // returns saved file path or null
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100) // collect chunks every 100ms
      recorderRef.current = recorder
      setStatus('recording')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied')
    }
  }, [])

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return
    recorder.pause()
    setStatus('paused')
  }, [])

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'paused') return
    recorder.resume()
    setStatus('recording')
  }, [])

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder) {
        resolve(null)
        return
      }

      recorder.onstop = async () => {
        // Stop all mic tracks
        recorder.stream.getTracks().forEach((t) => t.stop())

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const arrayBuffer = await blob.arrayBuffer()

        try {
          const filePath = await window.electronAPI.saveRecording(arrayBuffer)
          resolve(filePath)
        } catch {
          setError('Failed to save recording')
          resolve(null)
        } finally {
          recorderRef.current = null
          chunksRef.current = []
          setStatus('idle')
        }
      }

      recorder.stop()
    })
  }, [])

  return { status, startRecording, pauseRecording, resumeRecording, stopRecording, error }
}
