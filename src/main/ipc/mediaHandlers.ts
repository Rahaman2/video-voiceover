import { ipcMain } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

/**
 * IPC handlers for the media plugin.
 * Isolated from the rest of the app — failure here won't break file dialogs or export.
 */
export function registerMediaHandlers(): void {
  /**
   * Download a remote URL to a temp file and return its local path.
   * Used when the user adds stock media (audio/video) to the timeline or as a video source.
   */
  ipcMain.handle('media:downloadUrl', async (_event, url: string, ext: string) => {
    // Sanitise the extension to prevent path traversal
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin'
    const tmpPath = join(tmpdir(), `voiceover-media-${randomUUID()}.${safeExt}`)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await writeFile(tmpPath, Buffer.from(buffer))
    return tmpPath
  })
}
