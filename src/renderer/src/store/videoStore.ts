import { create } from 'zustand'

interface VideoState {
  videoPath: string | null
  duration: number
  currentTime: number
  isPlaying: boolean

  setVideoPath: (path: string) => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
}

export const useVideoStore = create<VideoState>((set) => ({
  videoPath: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,

  setVideoPath: (path) => set({ videoPath: path, currentTime: 0, isPlaying: false }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying })
}))
