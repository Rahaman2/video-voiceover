import { ipcMain, dialog, app } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

export function registerFileHandlers(): void {
  // Open a video file
  ipcMain.handle('dialog:openVideo', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Open one or more audio files
  ipcMain.handle('dialog:openAudio', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio Files',
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm']
        }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })

  // Choose an output path for the exported video
  ipcMain.handle('dialog:savePath', async (_event, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: join(app.getPath('videos'), defaultName),
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    })
    return result.canceled ? null : result.filePath
  })

  // Save a recorded audio Blob (ArrayBuffer) to a temp file and return its path
  ipcMain.handle('recording:save', async (_event, buffer: ArrayBuffer) => {
    const tmpPath = join(tmpdir(), `voiceover-rec-${randomUUID()}.webm`)
    await writeFile(tmpPath, Buffer.from(buffer))
    return tmpPath
  })
}
