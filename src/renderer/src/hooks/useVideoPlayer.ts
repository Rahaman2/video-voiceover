import { useRef, useEffect, useCallback } from 'react'
import { useVideoStore } from '../store/videoStore'
import { useVideoClipStore } from '../store/videoClipStore'

/**
 * Manages the <video> element ref and syncs it with videoStore.
 * Returns ref to attach to the <video> element plus control functions.
 */
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { setDuration, setCurrentTime, setIsPlaying, setVideoDimensions, isPlaying, videoPath } = useVideoStore()
  const { resetFromVideo } = useVideoClipStore()

  // Sync time updates from the video element into the store
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const onTimeUpdate = () => setCurrentTime(el.currentTime)
    const onDurationChange = () => {
      const dur = el.duration || 0
      setDuration(dur)
      // Capture video dimensions and initialise the video clip store
      if (dur > 0 && videoPath) {
        setVideoDimensions(el.videoWidth, el.videoHeight)
        resetFromVideo(videoPath, dur)
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('loadedmetadata', onDurationChange)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('loadedmetadata', onDurationChange)  // eslint-disable-line
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
    }
  }, [setCurrentTime, setDuration, setIsPlaying, setVideoDimensions, videoPath, resetFromVideo])

  const play = useCallback(() => videoRef.current?.play(), [])
  const pause = useCallback(() => videoRef.current?.pause(), [])

  const togglePlayPause = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }, [])

  const seekTo = useCallback((time: number) => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = Math.max(0, time)
  }, [])

  const loadVideo = useCallback((filePath: string) => {
    const el = videoRef.current
    if (!el) return
    el.src = `file://${filePath}`
    el.load()
  }, [])

  return { videoRef, isPlaying, play, pause, togglePlayPause, seekTo, loadVideo }
}
