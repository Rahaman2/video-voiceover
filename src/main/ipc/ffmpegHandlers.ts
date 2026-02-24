import { ipcMain, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

interface ClipExport {
  audioPath: string
  startTime: number   // seconds into output timeline where clip starts
  trimStart: number   // seconds to skip from the beginning of the audio file
  duration: number    // effective duration (after trim)
  volume: number      // 0.0 – 1.0
}

interface VideoClipExport {
  type: 'video' | 'image'
  sourcePath: string
  trimStart: number   // for video: start offset in source file (seconds)
  duration: number    // how long this segment plays in the output
}

interface ExportPayload {
  videoPath: string
  outputPath: string
  clips: ClipExport[]
  /** Present when the user has edited the video (split/image inserts) */
  videoClips?: VideoClipExport[]
  videoDimensions?: { width: number; height: number }
}

export function registerFfmpegHandlers(): void {
  ipcMain.handle('ffmpeg:export', async (event, payload: ExportPayload) => {
    const { videoPath, outputPath, clips, videoClips, videoDimensions } = payload
    const win = BrowserWindow.fromWebContents(event.sender)

    return new Promise<string>((resolve, reject) => {
      // Use the concat/image path only when actual editing has happened
      const useVideoEditing =
        videoClips &&
        videoClips.length > 0 &&
        !(videoClips.length === 1 && videoClips[0].type === 'video' && videoClips[0].trimStart === 0)

      const args = useVideoEditing
        ? buildFfmpegArgsWithVideoClips(videoPath, outputPath, clips, videoClips!, videoDimensions)
        : buildFfmpegArgs(videoPath, outputPath, clips)

      const ffmpeg = spawn(ffmpegPath as string, args)

      let duration = 0
      let stderr = ''

      ffmpeg.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString()
        stderr += chunk

        if (!duration) {
          const m = chunk.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/)
          if (m) {
            duration = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])
          }
        }

        if (duration > 0) {
          const t = chunk.match(/time=(\d+):(\d+):(\d+\.?\d*)/)
          if (t) {
            const current = parseInt(t[1]) * 3600 + parseInt(t[2]) * 60 + parseFloat(t[3])
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
          const msg = `FFmpeg exited with code ${code}:\n${stderr.slice(-800)}`
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

// ─── Simple export (original behaviour — no video editing) ───────────────────

function buildFfmpegArgs(videoPath: string, outputPath: string, clips: ClipExport[]): string[] {
  const args: string[] = ['-y', '-i', videoPath]

  clips.forEach((clip) => {
    args.push('-ss', String(clip.trimStart))
    args.push('-t', String(clip.duration))
    args.push('-i', clip.audioPath)
  })

  if (clips.length === 0) {
    args.push('-an', '-c:v', 'copy', outputPath)
    return args
  }

  const filterParts: string[] = []
  filterParts.push('[0:a]volume=0[silence]')

  clips.forEach((clip, i) => {
    const delayMs = Math.round(clip.startTime * 1000)
    filterParts.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=${clip.volume}[c${i}]`)
  })

  const mixInputs = ['[silence]', ...clips.map((_, i) => `[c${i}]`)].join('')
  filterParts.push(`${mixInputs}amix=inputs=${clips.length + 1}:duration=first:normalize=0[aout]`)

  args.push('-filter_complex', filterParts.join(';'))
  args.push('-map', '0:v')
  args.push('-map', '[aout]')
  args.push('-c:v', 'copy')
  args.push('-c:a', 'aac')
  args.push('-shortest')
  args.push(outputPath)

  return args
}

// ─── Video-editing export (multi-clip concat + image slides) ─────────────────

function buildFfmpegArgsWithVideoClips(
  videoPath: string,
  outputPath: string,
  clips: ClipExport[],
  videoClips: VideoClipExport[],
  dimensions?: { width: number; height: number },
): string[] {
  // Target resolution — use actual video dimensions or fall back to 1280×720
  const W = dimensions?.width || 1280
  const H = dimensions?.height || 720

  // Normalise any video/image segment to W×H @ 30fps
  const normalise = (outLabel: string) =>
    `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30${outLabel}`

  const args: string[] = ['-y']

  // Input 0: source video
  args.push('-i', videoPath)

  // Inputs 1..I: one input per unique image path
  const uniqueImagePaths: string[] = []
  for (const vc of videoClips) {
    if (vc.type === 'image' && !uniqueImagePaths.includes(vc.sourcePath)) {
      uniqueImagePaths.push(vc.sourcePath)
      args.push('-loop', '1', '-t', String(vc.duration), '-i', vc.sourcePath)
    }
  }

  // Inputs I+1..: audio clips
  const audioInputStart = 1 + uniqueImagePaths.length
  clips.forEach((clip) => {
    args.push('-ss', String(clip.trimStart))
    args.push('-t', String(clip.duration))
    args.push('-i', clip.audioPath)
  })

  const filterParts: string[] = []
  const videoLabels: string[] = []

  // One filter chain per video segment
  videoClips.forEach((vc, idx) => {
    const outLabel = `[v${idx}]`

    if (vc.type === 'video') {
      const end = vc.trimStart + vc.duration
      filterParts.push(
        `[0:v]trim=start=${vc.trimStart}:end=${end},setpts=PTS-STARTPTS,${normalise(outLabel)}`
      )
    } else {
      const imgInputIdx = uniqueImagePaths.indexOf(vc.sourcePath) + 1
      filterParts.push(`[${imgInputIdx}:v]${normalise(outLabel)}`)
    }

    videoLabels.push(outLabel)
  })

  // Concatenate all video segments into [vout]
  if (videoLabels.length === 1) {
    filterParts.push(`${videoLabels[0]}copy[vout]`)
  } else {
    filterParts.push(`${videoLabels.join('')}concat=n=${videoLabels.length}:v=1:a=0[vout]`)
  }

  // Audio mixing
  filterParts.push('[0:a]volume=0[silence]')

  if (clips.length > 0) {
    clips.forEach((clip, i) => {
      const inputIdx = audioInputStart + i
      const delayMs = Math.round(clip.startTime * 1000)
      filterParts.push(
        `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${clip.volume}[c${i}]`
      )
    })
    const mixInputs = ['[silence]', ...clips.map((_, i) => `[c${i}]`)].join('')
    filterParts.push(
      `${mixInputs}amix=inputs=${clips.length + 1}:duration=first:normalize=0[aout]`
    )
  }

  args.push('-filter_complex', filterParts.join(';'))
  args.push('-map', '[vout]')
  args.push('-map', clips.length > 0 ? '[aout]' : '[silence]')

  // Re-encode video (required for concat filter)
  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23')
  args.push('-c:a', 'aac')
  args.push('-shortest')
  args.push(outputPath)

  return args
}
