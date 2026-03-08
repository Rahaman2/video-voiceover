import React from 'react'
import { useCaptionStore } from '../../store/captionStore'
import { CaptionClip, CaptionStyle } from '../../types'

interface Props {
  currentTime: number
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function getVerticalStyle(style: CaptionStyle): React.CSSProperties {
  switch (style.verticalPosition) {
    case 'top':
      return { top: '8%', bottom: 'auto' }
    case 'center':
      return { top: '50%', transform: 'translateX(-50%) translateY(-50%)', bottom: 'auto' }
    case 'custom':
      return { top: `${style.verticalPercent}%`, bottom: 'auto', transform: 'translateX(-50%)' }
    case 'bottom':
    default:
      return { bottom: '8%', top: 'auto' }
  }
}

function CaptionItem({ clip }: { clip: CaptionClip }) {
  const { style, text } = clip
  if (!text.trim()) return null

  const vertStyle = getVerticalStyle(style)
  const outlineParts =
    style.outlineWidth > 0
      ? [
          `${style.outlineWidth}px ${style.outlineWidth}px 0 ${style.outlineColor}`,
          `-${style.outlineWidth}px ${style.outlineWidth}px 0 ${style.outlineColor}`,
          `${style.outlineWidth}px -${style.outlineWidth}px 0 ${style.outlineColor}`,
          `-${style.outlineWidth}px -${style.outlineWidth}px 0 ${style.outlineColor}`
        ]
      : []

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: vertStyle.transform ?? 'translateX(-50%)',
        ...vertStyle,
        maxWidth: '80%',
        textAlign: 'center',
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        textShadow: outlineParts.join(', ') || 'none',
        backgroundColor:
          style.backgroundOpacity > 0
            ? `rgba(${hexToRgb(style.backgroundColor)}, ${style.backgroundOpacity})`
            : 'transparent',
        padding: style.backgroundOpacity > 0 ? '4px 10px' : '0',
        borderRadius: 4,
        lineHeight: 1.3,
        pointerEvents: 'none'
      }}
    >
      {text}
    </div>
  )
}

export function CaptionOverlay({ currentTime }: Props) {
  const clips = useCaptionStore((s) => s.clips)

  const activeClips = clips.filter(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  )

  if (activeClips.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20
      }}
    >
      {activeClips.map((clip) => (
        <CaptionItem key={clip.id} clip={clip} />
      ))}
    </div>
  )
}
