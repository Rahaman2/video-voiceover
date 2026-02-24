import { create } from 'zustand'
import { randomUUID } from '../utils/uuid'

export type VideoClipType = 'video' | 'image'

export interface VideoClip {
  id: string
  type: VideoClipType
  sourcePath: string
  label: string
  /** For video clips: where in the source file this clip starts (seconds) */
  trimStart: number
  /** How long this clip plays in the output timeline (seconds) */
  duration: number
  color: string
}

interface VideoClipState {
  clips: VideoClip[]

  /**
   * Called when a new video file is loaded.
   * Resets the clip list to a single clip spanning the full video.
   */
  resetFromVideo: (sourcePath: string, duration: number) => void

  /**
   * Split the video clip at a given TIMELINE position.
   * No-op if the position falls on a clip boundary or inside an image clip.
   */
  splitAtTime: (timelineTime: number) => void

  /** Remove a clip from the sequence. */
  removeClip: (id: string) => void

  /**
   * Insert an image clip at the given TIMELINE position.
   * Splits the existing video clip at that point (if needed) and inserts the image.
   */
  insertImageAt: (timelineTime: number, sourcePath: string, label: string, imageDuration: number) => void

  /**
   * Merge a video clip with the immediately adjacent clip in either direction.
   * Only merges two adjacent 'video' clips from the same source file.
   */
  mergeWithNext: (id: string) => void

  /** Compute the timeline start time (seconds) of a given clip. */
  getClipTimelineStart: (id: string) => number

  /** Total output duration (sum of all clip durations). */
  getTotalDuration: () => number

  /** Resolve which clip is active at a given timeline time, and the offset into that clip. */
  getClipAtTime: (time: number) => { clip: VideoClip; offsetInClip: number } | null
}

const VIDEO_COLORS = ['#1e40af', '#047857', '#b45309', '#6d28d9', '#be185d', '#0e7490']
let colorIdx = 0
function nextColor(): string {
  return VIDEO_COLORS[colorIdx++ % VIDEO_COLORS.length]
}

export const useVideoClipStore = create<VideoClipState>((set, get) => ({
  clips: [],

  resetFromVideo(sourcePath, duration) {
    set({
      clips: [
        {
          id: randomUUID(),
          type: 'video',
          sourcePath,
          label: sourcePath.replace(/\\/g, '/').split('/').pop() ?? 'Video',
          trimStart: 0,
          duration,
          color: VIDEO_COLORS[0],
        },
      ],
    })
    colorIdx = 1
  },

  splitAtTime(timelineTime) {
    const { clips } = get()
    if (clips.length === 0) return

    // Find which clip the split falls in
    let elapsed = 0
    let targetIdx = -1
    let offsetInClip = 0

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      if (timelineTime > elapsed && timelineTime < elapsed + clip.duration) {
        targetIdx = i
        offsetInClip = timelineTime - elapsed
        break
      }
      elapsed += clip.duration
    }

    if (targetIdx === -1) return // on a boundary or out of range
    const target = clips[targetIdx]
    if (target.type === 'image') return // can't split an image clip

    // Minimum split size: 0.1s on each side
    if (offsetInClip < 0.1 || offsetInClip > target.duration - 0.1) return

    const before: VideoClip = {
      id: randomUUID(),
      type: 'video',
      sourcePath: target.sourcePath,
      label: target.label,
      trimStart: target.trimStart,
      duration: offsetInClip,
      color: target.color,
    }

    const after: VideoClip = {
      id: randomUUID(),
      type: 'video',
      sourcePath: target.sourcePath,
      label: target.label,
      trimStart: target.trimStart + offsetInClip,
      duration: target.duration - offsetInClip,
      color: nextColor(),
    }

    const newClips = [...clips]
    newClips.splice(targetIdx, 1, before, after)
    set({ clips: newClips })
  },

  removeClip(id) {
    set(s => ({ clips: s.clips.filter(c => c.id !== id) }))
  },

  insertImageAt(timelineTime, sourcePath, label, imageDuration) {
    const { clips, splitAtTime } = get()
    if (clips.length === 0) return

    // Split at the insertion point first
    splitAtTime(timelineTime)

    // Find the split point index (the clip that starts at timelineTime)
    const freshClips = get().clips
    let elapsed = 0
    let insertIdx = freshClips.length // default: append at end

    for (let i = 0; i < freshClips.length; i++) {
      if (Math.abs(elapsed - timelineTime) < 0.05) {
        insertIdx = i
        break
      }
      elapsed += freshClips[i].duration
    }

    const imageClip: VideoClip = {
      id: randomUUID(),
      type: 'image',
      sourcePath,
      label,
      trimStart: 0,
      duration: imageDuration,
      color: '#c2410c',
    }

    const newClips = [...freshClips]
    newClips.splice(insertIdx, 0, imageClip)
    set({ clips: newClips })
  },

  mergeWithNext(id) {
    const { clips } = get()
    const idx = clips.findIndex(c => c.id === id)
    if (idx === -1 || idx === clips.length - 1) return

    const a = clips[idx]
    const b = clips[idx + 1]

    if (a.type !== 'video' || b.type !== 'video') return
    if (a.sourcePath !== b.sourcePath) return
    // Clips must be contiguous in the source file
    if (Math.abs(a.trimStart + a.duration - b.trimStart) > 0.05) return

    const merged: VideoClip = {
      id: randomUUID(),
      type: 'video',
      sourcePath: a.sourcePath,
      label: a.label,
      trimStart: a.trimStart,
      duration: a.duration + b.duration,
      color: a.color,
    }

    const newClips = [...clips]
    newClips.splice(idx, 2, merged)
    set({ clips: newClips })
  },

  getClipTimelineStart(id) {
    const { clips } = get()
    let t = 0
    for (const clip of clips) {
      if (clip.id === id) return t
      t += clip.duration
    }
    return 0
  },

  getTotalDuration() {
    return get().clips.reduce((sum, c) => sum + c.duration, 0)
  },

  getClipAtTime(time) {
    const { clips } = get()
    let elapsed = 0
    for (const clip of clips) {
      if (time >= elapsed && time < elapsed + clip.duration) {
        return { clip, offsetInClip: time - elapsed }
      }
      elapsed += clip.duration
    }
    return null
  },
}))
