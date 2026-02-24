# VoiceOver

A desktop voice-over editor built with Electron + React. Load a video, record or import audio, position your clips on a multi-track timeline, and export a merged MP4 — no watermarks, no subscriptions.

## Features

- **Multi-track timeline** — drag clips to reposition, drag edges to trim
- **Microphone recording** — record directly in the app with pause/resume support
- **Audio import** — supports MP3, WAV, OGG, M4A, AAC, FLAC
- **Per-clip volume control** — double-click any clip to adjust its volume
- **Live preview** — audio clips play in sync with the video during preview
- **FFmpeg export** — merges voice-over into video, mutes original audio
- **Zoom timeline** — Ctrl+Scroll or +/− buttons

## Stack

| Layer | Tech |
|---|---|
| Shell | Electron |
| UI | React 18 + TypeScript |
| Build | electron-vite + Vite |
| State | Zustand |
| Styling | Tailwind CSS |
| Export | ffmpeg-static |

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repo
git clone <your-repo-url>
cd voice-over

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Build for production

```bash
npm run build
```

### Package as installer

```bash
npm run package
```

Output will be in the `dist/` folder.

## Usage

| Action | How |
|---|---|
| Import video | Toolbar → Import Video |
| Import audio | Toolbar → Import Audio (mp3, wav, ogg, m4a, aac, flac) |
| Record voice-over | Toolbar → Record |
| Play / Pause | Space bar or transport controls |
| Seek | Click the scrubber or drag the playhead |
| Move a clip | Drag the clip body |
| Trim a clip | Drag the left or right edge |
| Adjust clip volume | Double-click the clip |
| Delete a clip | Right-click the clip |
| Add a track | Timeline → + Add Track |
| Zoom timeline | Ctrl + Scroll, or +/− buttons |
| Export | Toolbar → Export |

## Project Structure

```
src/
  main/                  # Electron main process
    ipc/
      fileHandlers.ts    # File dialogs + recording save
      ffmpegHandlers.ts  # FFmpeg export with progress
  preload/
    index.ts             # IPC bridge (contextBridge)
  renderer/src/
    types/               # Shared TypeScript interfaces
    store/               # Zustand state (video + timeline)
    hooks/               # useVideoPlayer, useAudioRecorder, useAudioPreview
    utils/               # Audio duration, UUID helpers
    components/
      VideoPlayer/       # Video element + transport bar
      Toolbar/           # Top action buttons
      Timeline/          # Ruler, tracks, clips, playhead
      ClipControls/      # Per-clip volume slider
      AudioRecorder/     # Mic recording modal
      ExportModal/       # FFmpeg export + progress bar
```

## License

MIT
