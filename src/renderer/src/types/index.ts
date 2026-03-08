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

export interface VideoClipExport {
  type: 'video' | 'image'
  sourcePath: string
  trimStart: number
  duration: number
}

export interface CaptionStyle {
  fontFamily: string
  fontSize: number
  color: string
  outlineColor: string
  outlineWidth: number
  backgroundOpacity: number
  backgroundColor: string
  verticalPosition: 'top' | 'center' | 'bottom' | 'custom'
  verticalPercent: number
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  color: '#ffffff',
  outlineColor: '#000000',
  outlineWidth: 2,
  backgroundOpacity: 0.4,
  backgroundColor: '#000000',
  verticalPosition: 'bottom',
  verticalPercent: 85
}

export interface CaptionClip {
  id: string
  text: string
  startTime: number
  duration: number
  style: CaptionStyle
}

export interface CaptionExport {
  text: string
  startTime: number
  duration: number
  style: CaptionStyle
}

export interface ExportPayload {
  videoPath: string
  outputPath: string
  clips: ClipExport[]
  videoClips?: VideoClipExport[]
  videoDimensions?: { width: number; height: number }
  captions?: CaptionExport[]
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
      downloadMediaUrl: (url: string, ext: string) => Promise<string>
      exportVideo: (payload: ExportPayload) => Promise<string>
      onExportProgress: (cb: (pct: number) => void) => () => void
      onExportDone: (cb: (outputPath: string) => void) => () => void
      onExportError: (cb: (msg: string) => void) => () => void
      transcribeVideo: (videoPath: string) => Promise<CaptionExport[]>
      onTranscribeProgress: (cb: (data: { stage: 'download' | 'transcribe'; pct: number }) => void) => () => void
      exportSrt: (payload: { captions: CaptionExport[]; outputPath: string }) => Promise<string>
    }
  }
}
