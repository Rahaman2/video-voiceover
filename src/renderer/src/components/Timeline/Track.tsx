import React from 'react'
import { Track as TrackType, AudioClip } from '../../types'
import { useTimelineStore } from '../../store/timelineStore'
import { Clip } from './Clip'

const TRACK_HEIGHT = 56

interface Props {
  track: TrackType
  clips: AudioClip[]
  pixelsPerSecond: number
  totalWidth: number
}

export function Track({ track, clips, pixelsPerSecond, totalWidth }: Props) {
  const { removeTrack } = useTimelineStore()

  return (
    <div className="flex" style={{ height: TRACK_HEIGHT }}>
      {/* Track label sidebar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-2 bg-panel border-r border-accent/30 gap-1"
        style={{ width: 120 }}
      >
        <span className="text-xs text-muted truncate flex-1">{track.name}</span>
        <button
          onClick={() => {
            if (confirm(`Remove "${track.name}"?`)) removeTrack(track.id)
          }}
          className="text-muted/50 hover:text-highlight transition-colors text-xs flex-shrink-0"
          title="Remove track"
        >
          ✕
        </button>
      </div>

      {/* Clip area */}
      <div
        className="relative flex-1 border-b border-accent/20 bg-surface/50"
        style={{ minWidth: totalWidth }}
      >
        {clips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={TRACK_HEIGHT}
          />
        ))}
      </div>
    </div>
  )
}
