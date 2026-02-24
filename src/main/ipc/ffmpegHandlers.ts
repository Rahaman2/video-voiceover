import { ipcMain, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

interface ClipExport {
  audioPath: string
  startTime: number   // seconds into video where clip starts
  trimStart: number   // seconds to skip from the beginning of the audio file
  duration: number    // effective duration (after trim)
  volume: number      // 0.0 – 1.0
}

interface ExportPayload {
  videoPath: string
  outputPath: string
  clips: ClipExport[]
}

export function registerFfmpegHandlers(): void {
  ipcMain.handle('ffmpeg:export', async (event, payload: ExportPayload) => {
    const { videoPath, outputPath, clips } = payload
    const win = BrowserWindow.fromWebContents(event.sender)

    return new Promise<string>((resolve, reject) => {
      const args = buildFfmpegArgs(videoPath, outputPath, clips)

      const ffmpeg = spawn(ffmpegPath as string, args)

      let duration = 0
      let stderr = ''

      ffmpeg.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString()
        stderr += chunk

        // Parse total duration once
        if (!duration) {
          const m = chunk.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/)
          if (m) {
            duration =
              parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])
          }
        }

        // Parse current time to emit progress
        if (duration > 0) {
          const t = chunk.match(/time=(\d+):(\d+):(\d+\.?\d*)/)
          if (t) {
            const current =
              parseInt(t[1]) * 3600 + parseInt(t[2]) * 60 + parseFloat(t[3])
            const pct = Math.min(100, Math.round((current / duration) * 100))
            win?.webContents.send('ffmpeg:progress', pct)
          }
        }
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          win?.webContents.send('ffmpeg:done', outputPath)
          resolve(outputPath)
        } else {
          const msg = `FFmpeg exited with code ${code}:\n${stderr.slice(-500)}`
          win?.webContents.send('ffmpeg:error', msg)
          reject(new Error(msg))
        }
      })

      ffmpeg.on('error', (err) => {
        win?.webContents.send('ffmpeg:error', err.message)
        reject(err)
      })
    })
  })
}

function buildFfmpegArgs(
  videoPath: string,
  outputPath: string,
  clips: ClipExport[]
): string[] {
  // -i video always first (index 0)
  const args: string[] = ['-y', '-i', videoPath]

  // Add each audio clip as an input (with trim applied at input level)
  clips.forEach((clip) => {
    args.push('-ss', String(clip.trimStart))
    args.push('-t', String(clip.duration))
    args.push('-i', clip.audioPath)
  })

  if (clips.length === 0) {
    // No voice-over: mute original and copy
    args.push('-an', '-c:v', 'copy', outputPath)
    return args
  }

  // Build filter_complex
  const filterParts: string[] = []

  // Mute original video audio
  filterParts.push('[0:a]volume=0[silence]')

  // Delay + volume each clip
  clips.forEach((clip, i) => {
    const delayMs = Math.round(clip.startTime * 1000)
    const label = `c${i}`
    filterParts.push(
      `[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=${clip.volume}[${label}]`
    )
  })

  // Mix: silence + all clips
  const mixInputs = ['[silence]', ...clips.map((_, i) => `[c${i}]`)].join('')
  filterParts.push(
    `${mixInputs}amix=inputs=${clips.length + 1}:duration=first:normalize=0[aout]`
  )

  args.push('-filter_complex', filterParts.join(';'))
  args.push('-map', '0:v')
  args.push('-map', '[aout]')
  args.push('-c:v', 'copy')
  args.push('-c:a', 'aac')
  args.push('-shortest')
  args.push(outputPath)

  return args
}
