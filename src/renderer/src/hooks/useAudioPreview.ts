import { useEffect, useRef } from 'react'
import { useVideoStore } from '../store/videoStore'
import { useTimelineStore } from '../store/timelineStore'
import { AudioClip } from '../types'

/**
 * Plays audio clips from the timeline in sync with the video during preview.
 *
 * Strategy:
 * - When video starts playing: for each clip that is currently active
 *   (currentTime is within its range), seek the audio element to the right
 *   offset and play it. For clips that start in the future, schedule a
 *   setTimeout to start them at the right moment.
 * - When video pauses/stops: cancel all scheduled timeouts and pause
 *   all active audio elements.
 * - When the user seeks: pause everything (the next play event re-syncs).
 */
export function useAudioPreview() {
  const { isPlaying } = useVideoStore()
  const { clips } = useTimelineStore()

  // Stable refs so effects always see the latest values without re-running
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Always-current refs for isPlaying and clips
  const isPlayingRef = useRef(isPlaying)
  const clipsRef = useRef(clips)
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { clipsRef.current = clips }, [clips])

  // Ensure an HTMLAudioElement exists for a given clip
  function getAudio(clip: AudioClip): HTMLAudioElement {
    let audio = audioMapRef.current.get(clip.id)
    if (!audio) {
      audio = new Audio(`file://${clip.audioPath}`)
      audioMapRef.current.set(clip.id, audio)
    }
    audio.volume = clip.volume
    return audio
  }

  // Stop and clear everything
  function stopAll() {
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current.clear()
    audioMapRef.current.forEach((a) => {
      a.pause()
    })
  }

  // React to play/pause changes
  useEffect(() => {
    if (isPlaying) {
      // Read the live currentTime directly from the store snapshot at this moment
      const currentTime = useVideoStore.getState().currentTime
      const clips = clipsRef.current

      clips.forEach((clip) => {
        const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
        const clipEnd = clip.startTime + effectiveDuration

        // Already past this clip — skip
        if (currentTime >= clipEnd) return

        const audio = getAudio(clip)

        if (currentTime >= clip.startTime) {
          // Clip is currently active — seek to correct offset and play
          const offset = currentTime - clip.startTime + clip.trimStart
          audio.currentTime = Math.max(clip.trimStart, offset)
          audio.play().catch(() => {})
        } else {
          // Clip starts in the future — schedule it
          const delayMs = (clip.startTime - currentTime) * 1000
          const timeout = setTimeout(() => {
            // Double-check we're still playing when the timeout fires
            if (!isPlayingRef.current) return
            const a = audioMapRef.current.get(clip.id)
            if (!a) return
            a.currentTime = clip.trimStart
            a.play().catch(() => {})
          }, delayMs)
          timeoutsRef.current.set(clip.id, timeout)
        }
      })
    } else {
      stopAll()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // When clips array changes (clip added/removed/updated), rebuild audio map
  useEffect(() => {
    const currentIds = new Set(clips.map((c) => c.id))

    // Remove audio elements for deleted clips
    audioMapRef.current.forEach((audio, id) => {
      if (!currentIds.has(id)) {
        audio.pause()
        audioMapRef.current.delete(id)
        const t = timeoutsRef.current.get(id)
        if (t) { clearTimeout(t); timeoutsRef.current.delete(id) }
      }
    })

    // Update volume for changed clips
    clips.forEach((clip) => {
      const audio = audioMapRef.current.get(clip.id)
      if (audio) audio.volume = clip.volume
    })
  }, [clips])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll()
  }, [])
}
