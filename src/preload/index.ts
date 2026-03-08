import { contextBridge, ipcRenderer } from 'electron'

// Expose safe IPC bridges to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
  openAudioDialog: () => ipcRenderer.invoke('dialog:openAudio'),
  saveFileDialog: (defaultName: string) =>
    ipcRenderer.invoke('dialog:savePath', defaultName),

  // Save recorded audio blob to a temp file
  saveRecording: (buffer: ArrayBuffer) =>
    ipcRenderer.invoke('recording:save', buffer),

  // FFmpeg export
  exportVideo: (payload: ExportPayload) =>
    ipcRenderer.invoke('ffmpeg:export', payload),

  // Listen to FFmpeg progress events
  onExportProgress: (cb: (pct: number) => void) => {
    const handler = (_: Electron.IpcRendererEvent, pct: number) => cb(pct)
    ipcRenderer.on('ffmpeg:progress', handler)
    return () => ipcRenderer.removeListener('ffmpeg:progress', handler)
  },

  // Download a remote URL to a temp file (used by the media browser)
  downloadMediaUrl: (url: string, ext: string) =>
    ipcRenderer.invoke('media:downloadUrl', url, ext),

  // Listen to FFmpeg done / error
  onExportDone: (cb: (outputPath: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, p: string) => cb(p)
    ipcRenderer.on('ffmpeg:done', handler)
    return () => ipcRenderer.removeListener('ffmpeg:done', handler)
  },
  onExportError: (cb: (msg: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, msg: string) => cb(msg)
    ipcRenderer.on('ffmpeg:error', handler)
    return () => ipcRenderer.removeListener('ffmpeg:error', handler)
  },

  // Export captions as a standalone SRT file
  exportSrt: (payload: { captions: CaptionExport[]; outputPath: string }) =>
    ipcRenderer.invoke('caption:exportSrt', payload),

  // Whisper auto-transcription
  transcribeVideo: (videoPath: string) =>
    ipcRenderer.invoke('caption:transcribe', videoPath),

  onTranscribeProgress: (cb: (data: { stage: 'download' | 'transcribe'; pct: number }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { stage: 'download' | 'transcribe'; pct: number }) => cb(data)
    ipcRenderer.on('caption:transcribeProgress', handler)
    return () => ipcRenderer.removeListener('caption:transcribeProgress', handler)
  },
})

interface CaptionExport {
  text: string
  startTime: number
  duration: number
  style: Record<string, unknown>
}

interface ExportPayload {
  videoPath: string
  outputPath: string
  clips: ClipExport[]
  captions?: CaptionExport[]
}

interface ClipExport {
  audioPath: string
  startTime: number   // seconds
  trimStart: number   // seconds
  duration: number    // effective seconds (after trim)
  volume: number      // 0.0 – 1.0
}
