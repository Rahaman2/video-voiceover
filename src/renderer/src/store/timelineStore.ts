import { create } from 'zustand'
import { AudioClip, Track } from '../types'
import { randomUUID } from '../utils/uuid'

const CLIP_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#0284c7'
]

let colorIndex = 0
function nextColor(): string {
  return CLIP_COLORS[colorIndex++ % CLIP_COLORS.length]
}

interface TimelineState {
  tracks: Track[]
  clips: AudioClip[]
  pixelsPerSecond: number      // zoom level
  scrollLeft: number           // horizontal scroll offset in pixels

  // Track actions
  addTrack: () => Track
  removeTrack: (trackId: string) => void

  // Clip actions
  addClip: (clip: Omit<AudioClip, 'id' | 'color'>) => AudioClip
  updateClip: (id: string, patch: Partial<AudioClip>) => void
  removeClip: (id: string) => void

  // Zoom / scroll
  setPixelsPerSecond: (pps: number) => void
  setScrollLeft: (px: number) => void
}

const defaultTracks: Track[] = [
  { id: randomUUID(), name: 'Track 1' },
  { id: randomUUID(), name: 'Track 2' }
]

export const useTimelineStore = create<TimelineState>((set, get) => ({
  tracks: defaultTracks,
  clips: [],
  pixelsPerSecond: 80,
  scrollLeft: 0,

  addTrack: () => {
    const track: Track = {
      id: randomUUID(),
      name: `Track ${get().tracks.length + 1}`
    }
    set((s) => ({ tracks: [...s.tracks, track] }))
    return track
  },

  removeTrack: (trackId) => {
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== trackId),
      clips: s.clips.filter((c) => c.trackId !== trackId)
    }))
  },

  addClip: (clipData) => {
    const clip: AudioClip = {
      ...clipData,
      id: randomUUID(),
      color: nextColor()
    }
    set((s) => ({ clips: [...s.clips, clip] }))
    return clip
  },

  updateClip: (id, patch) => {
    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }))
  },

  removeClip: (id) => {
    set((s) => ({ clips: s.clips.filter((c) => c.id !== id) }))
  },

  setPixelsPerSecond: (pps) => set({ pixelsPerSecond: Math.max(20, Math.min(400, pps)) }),
  setScrollLeft: (px) => set({ scrollLeft: Math.max(0, px) })
}))
