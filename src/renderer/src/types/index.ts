export interface AudioClip {
  id: string
  trackId: string
  audioPath: string    // absolute file:// path to audio file
  label: string        // display name (filename)
  startTime: number    // seconds from video start where clip begins
  duration: number     // full file duration in seconds
  trimStart: number    // seconds removed from clip start
  trimEnd: number      // seconds removed from clip end
  volume: number       // 0.0 – 1.0
  color: string        // color for the clip block
}

export interface Track {
  id: string
  name: string
}

export interface ExportPayload {
  videoPath: string
  outputPath: string
  clips: ClipExport[]
}

export interface ClipExport {
  audioPath: string
  startTime: number
  trimStart: number
  duration: number  // effective duration = clip.duration - clip.trimStart - clip.trimEnd
  volume: number
}

// Global electron API exposed via preload
declare global {
  interface Window {
    electronAPI: {
      openVideoDialog: () => Promise<string | null>
      openAudioDialog: () => Promise<string[]>
      saveFileDialog: (defaultName: string) => Promise<string | null>
      saveRecording: (buffer: ArrayBuffer) => Promise<string>
      exportVideo: (payload: ExportPayload) => Promise<string>
      onExportProgress: (cb: (pct: number) => void) => () => void
      onExportDone: (cb: (outputPath: string) => void) => () => void
      onExportError: (cb: (msg: string) => void) => () => void
    }
  }
}
