import { create } from 'zustand'
import { CaptionClip, CaptionExport, DEFAULT_CAPTION_STYLE } from '../types'
import { randomUUID } from '../utils/uuid'

interface CaptionState {
  clips: CaptionClip[]
  selectedClipId: string | null
  transcriptionStatus: 'idle' | 'downloading' | 'transcribing' | 'done' | 'error'
  transcriptionProgress: number
  transcriptionError: string | null

  addClip: (clip: Omit<CaptionClip, 'id'>) => CaptionClip
  updateClip: (id: string, patch: Partial<CaptionClip>) => void
  removeClip: (id: string) => void
  bulkAddClips: (clips: Omit<CaptionExport, never>[]) => void
  clearAll: () => void
  setSelectedClipId: (id: string | null) => void
  setTranscriptionStatus: (s: CaptionState['transcriptionStatus']) => void
  setTranscriptionProgress: (n: number) => void
  setTranscriptionError: (msg: string | null) => void
}

export const useCaptionStore = create<CaptionState>((set) => ({
  clips: [],
  selectedClipId: null,
  transcriptionStatus: 'idle',
  transcriptionProgress: 0,
  transcriptionError: null,

  addClip: (clipData) => {
    const clip: CaptionClip = { ...clipData, id: randomUUID() }
    set((s) => ({ clips: [...s.clips, clip] }))
    return clip
  },

  updateClip: (id, patch) => {
    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }))
  },

  removeClip: (id) => {
    set((s) => ({
      clips: s.clips.filter((c) => c.id !== id),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId
    }))
  },

  bulkAddClips: (captions) => {
    const clips: CaptionClip[] = captions.map((c) => ({
      ...c,
      id: randomUUID(),
      style: c.style ?? DEFAULT_CAPTION_STYLE
    }))
    set((s) => ({ clips: [...s.clips, ...clips] }))
  },

  clearAll: () => set({ clips: [], selectedClipId: null }),

  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setTranscriptionStatus: (s) => set({ transcriptionStatus: s }),
  setTranscriptionProgress: (n) => set({ transcriptionProgress: n }),
  setTranscriptionError: (msg) => set({ transcriptionError: msg })
}))
