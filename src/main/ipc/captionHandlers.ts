import { ipcMain, app, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { generateSrt } from './ffmpegHandlers'

interface CaptionExport {
  text: string
  startTime: number
  duration: number
  style: Record<string, unknown>
}

interface WordChunk {
  text: string
  timestamp: [number, number | null]
}

const DEFAULT_CAPTION_STYLE = {
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

function extractAudioPcm(videoPath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const proc = spawn(ffmpegPath as string, [
      '-i', videoPath,
      '-ar', '16000',
      '-ac', '1',
      '-f', 'f32le',
      'pipe:1'
    ])
    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    proc.stderr.on('data', () => {}) // suppress ffmpeg logs
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`))
      const buf = Buffer.concat(chunks)
      const float32 = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
      resolve(float32)
    })
  })
}

function groupIntoSegments(chunks: WordChunk[]): CaptionExport[] {
  const segments: CaptionExport[] = []
  let group: WordChunk[] = []
  const MAX_WORDS = 6
  const MAX_DURATION = 3.0

  for (const chunk of chunks) {
    if (!chunk.text.trim()) continue
    group.push(chunk)
    const startTs = group[0].timestamp[0] ?? 0
    const endTs = chunk.timestamp[1] ?? chunk.timestamp[0] ?? startTs
    const groupDuration = (endTs as number) - startTs

    if (group.length >= MAX_WORDS || groupDuration >= MAX_DURATION) {
      const text = group.map((c) => c.text).join('').trim()
      if (text) {
        segments.push({ text, startTime: startTs, duration: Math.max(0.5, groupDuration), style: DEFAULT_CAPTION_STYLE })
      }
      group = []
    }
  }

  if (group.length > 0) {
    const startTs = group[0].timestamp[0] ?? 0
    const endTs = group[group.length - 1].timestamp[1] ?? group[group.length - 1].timestamp[0] ?? startTs
    const text = group.map((c) => c.text).join('').trim()
    if (text) {
      segments.push({ text, startTime: startTs, duration: Math.max(0.5, (endTs as number) - startTs), style: DEFAULT_CAPTION_STYLE })
    }
  }

  return segments
}

export function registerCaptionHandlers(): void {
  // ── Auto-transcribe using Whisper via @xenova/transformers ─────────────────
  ipcMain.handle('caption:transcribe', async (event, videoPath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const cacheDir = join(app.getPath('userData'), 'whisper-model')

    const sendProgress = (stage: 'download' | 'transcribe', pct: number) => {
      win?.webContents.send('caption:transcribeProgress', { stage, pct: Math.round(pct) })
    }

    // Dynamic import — @xenova/transformers is ESM
    const { pipeline } = await import('@xenova/transformers')

    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      cache_dir: cacheDir,
      progress_callback: (p: { status: string; progress?: number }) => {
        if (p.status === 'downloading' || p.status === 'loading') {
          sendProgress('download', p.progress ?? 0)
        }
      }
    })

    sendProgress('transcribe', 0)

    const audioData = await extractAudioPcm(videoPath)

    const result = await (transcriber as (
      input: Float32Array,
      opts: Record<string, unknown>
    ) => Promise<{ chunks?: WordChunk[] }>)(audioData, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
      sampling_rate: 16000,
    })

    sendProgress('transcribe', 100)
    return groupIntoSegments(result.chunks ?? [])
  })

  // ── Export captions as a standalone SRT file ───────────────────────────────
  ipcMain.handle('caption:exportSrt', async (_event, payload: { captions: CaptionExport[]; outputPath: string }) => {
    const { captions, outputPath } = payload
    await writeFile(outputPath, generateSrt(captions), 'utf-8')
    return outputPath
  })
}
