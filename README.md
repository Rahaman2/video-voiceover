# VoiceOver Desktop Editor

A desktop video editor built with Electron + React, focused on voice-over production. Day 1 build.

No watermarks, no subscriptions.

---

## Stack

| Layer | Tech |
|---|---|
| Shell | Electron 30 |
| UI | React 18 + TypeScript + Tailwind CSS |
| State | Zustand |
| Build | electron-vite |
| Export | ffmpeg-static (bundled FFmpeg) |
| Audio waveforms | WaveSurfer.js |

---

## Getting Started

```bash
npm install
npm run dev        # development
npm run build      # production build
npm run package    # package as installer → dist/
```

---

## Usage

| Action | How |
|---|---|
| Import video | Toolbar → Import Video |
| Import audio | Toolbar → Import Audio |
| Record voice-over | Toolbar → Record |
| Browse stock media | Toolbar → Media |
| Play / Pause | Space bar or transport controls |
| Seek | Click the ruler or drag the playhead |
| Split video at playhead | Timeline → Split button |
| Adjust clip volume | Double-click the clip |
| Delete a clip | Hover the clip → ✕ button |
| Add audio track | Timeline → + Add Track |
| Zoom timeline | Ctrl + Scroll or +/− buttons |
| Export | Toolbar → Export |

---

## Feature Status

### ✅ Working

- Import video and play it in the editor
- Import one or more audio files onto the timeline
- Live microphone recording with waveform visualiser
- Multi-track audio timeline — add/remove tracks
- Per-clip volume control
- Live audio preview — clips play in sync with video during playback
- Spacebar play/pause global shortcut
- Timeline zoom (Ctrl+Scroll or buttons)
- Playhead seek (click ruler or drag)
- FFmpeg export — mixes all audio tracks over video, mutes original audio
- Export progress bar (real-time %)
- **Media Browser** — searchable stock media panel (Toolbar → Media)
  - Pixabay Images — search and open in browser
  - Pixabay Videos — download and set as video source
  - Freesound Audio — search, download HQ preview, add directly to timeline track
- **Video track row** — video clips displayed as a dedicated track in the timeline
- **Video clip split (data layer)** — Split button divides the clip data at the playhead position
- **Merge video clips** — hover a clip → merge button rejoins adjacent clips from the same source
- **Media plugin system** — plug-and-play provider architecture, add new APIs in one file

---

### ⚠️ Implemented but Not Fully Working

| Feature | Status |
|---|---|
| **Video split** | The store-level split works — clip data divides correctly and the video track UI updates. However the video player does not skip or jump between segments during playback; you still see the full uncut source video. The FFmpeg export path for split clips is written but has not been tested end-to-end. |
| **Image slides in video** | Image clips appear in the video track UI after inserting from the Media Browser. The FFmpeg concat filter to render them into the exported video is written but untested — images likely do not appear in the exported output yet. |
| **Stock music add to timeline** | Downloads the file and creates a timeline clip. May fail silently on some Freesound preview MP3 encodings depending on how `getAudioDuration` handles them — needs testing with a real API key. |

---

### ❌ Not Yet Built

**Core editing**
- Undo / redo (no history — all edits are permanent until you reload)
- Drag to reorder video clips on the timeline
- Drag to move audio clips along the timeline
- Trim handles (drag clip start/end edges)
- Clip-level speed control (slow mo, fast forward)
- Snap-to-grid / snap-to-clip-edges

**Audio**
- Waveform visualisation on timeline audio clips
- Fade in / fade out
- Keep original video audio (currently always muted on export)

**Video & Graphics**
- Text overlays / captions / titles
- Transitions between clips (fade, cut, wipe)
- Stickers / graphic overlays
- Crop / rotate / flip
- Colour grading / filters
- Green screen / chroma key

**Export**
- Resolution selector (720p / 1080p / 4K)
- FPS control (24 / 30 / 60)
- Bitrate / quality presets
- Export presets (YouTube, Instagram, etc.)

**UX & Polish**
- Project save / load (state is lost on close)
- Thumbnail frames on video track clips
- Keyboard shortcut reference panel
- Drag-and-drop files onto the window
- Settings panel (API keys currently entered per-session inside the Media Browser)

---

## Project Structure

```
src/
  main/
    ipc/
      fileHandlers.ts      # File dialogs + recording save
      ffmpegHandlers.ts    # FFmpeg export (simple + video-editing concat path)
      mediaHandlers.ts     # Stock media download to temp file
  preload/
    index.ts               # IPC bridge (contextBridge)
  renderer/src/
    types/                 # Shared TypeScript interfaces
    store/
      videoStore.ts        # Video path, playback state, dimensions
      timelineStore.ts     # Audio tracks + clips
      videoClipStore.ts    # Video segments (split/merge/image)
    hooks/
      useVideoPlayer.ts    # Video element sync + clip store init
      useAudioRecorder.ts  # Mic recording
      useAudioPreview.ts   # Timeline audio playback in sync
    plugins/
      media/
        types.ts           # MediaProvider / MediaItem interfaces
        registry.ts        # Provider registry
        useMediaSearch.ts  # Search hook
        providers/
          pixabay.ts       # Pixabay images + videos
          freesound.ts     # Freesound audio
          index.ts         # Register all providers here
    components/
      VideoPlayer/         # Video element + transport controls
      Toolbar/             # Top action bar
      Timeline/            # Ruler, video track, audio tracks, playhead
      MediaBrowser/        # Stock media search panel
      AudioRecorder/       # Mic recording modal
      ExportModal/         # FFmpeg export + progress
      ClipControls/        # Per-clip volume slider
```

---

## Media Plugin System

To add a new stock media source:

1. Create `src/renderer/src/plugins/media/providers/yourprovider.ts` implementing `MediaProvider`
2. Add it to the array in `providers/index.ts`
3. It appears automatically in the Media Browser sidebar — no other changes needed

If a provider fails to register (bad key, network error, code bug) it is silently skipped and the rest of the app is unaffected.

Current providers:

| Provider | Types | Get API Key |
|---|---|---|
| Pixabay Images | Images | [pixabay.com/api/docs](https://pixabay.com/api/docs/) |
| Pixabay Videos | Video clips | Same key as images |
| Freesound Audio | Music / SFX | [freesound.org/apiv2/apply](https://freesound.org/apiv2/apply/) |

> Pixabay does not have a public API for their music library. A slot is reserved in `providers/index.ts` for `pixabayMusicProvider` when/if they publish one.

API keys are stored in `localStorage` per provider and persist across sessions.

---

## Known Debt

- No undo/redo — Zustand stores mutate directly. Fix: wrap with `zundo` temporal middleware or implement a command pattern.
- Split video preview — `<video>` plays the full source file. Segment-aware preview (skipping deleted sections) is not implemented.
- Image slides in export — FFmpeg concat path is written but untested. Needs verification for frame rate normalisation and the `-loop 1` image input approach.
- Large downloads — stock media downloads go through `fetch → ArrayBuffer → writeFile`, loading the whole file into RAM. Fine for typical web files; needs streaming for large videos.
- No project persistence — closing the app loses all edits.

---

## License

MIT
