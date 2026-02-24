/**
 * Decode an audio file at a given path and return its duration in seconds.
 * Works via the Web Audio API using a fetch of the local file:// URL.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  const url = `file://${filePath}`
  const ctx = new AudioContext()
  try {
    const resp = await fetch(url)
    const buffer = await resp.arrayBuffer()
    const decoded = await ctx.decodeAudioData(buffer)
    return decoded.duration
  } finally {
    await ctx.close()
  }
}

/** Extract the base filename from a full path (cross-platform). */
export function basename(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
}
