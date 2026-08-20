'use client'

import {
  PenTool, Hash, Bird, Briefcase, AtSign, Cloud, Send, MessageCircle,
  MessageSquare, Ghost, Users, Camera, Clapperboard, Music2, Play, Film,
  Gamepad2, Video, Mail, BookOpen, HelpCircle, Quote, Star, Code2, Share2,
} from 'lucide-react'

// Explicit map keeps the bundle small (vs. a namespace import) and the build safe —
// every provider's `icon` string must resolve to one of these.
const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  PenTool, Hash, Bird, Briefcase, AtSign, Cloud, Send, MessageCircle,
  MessageSquare, Ghost, Users, Camera, Clapperboard, Music2, Play, Film,
  Gamepad2, Video, Mail, BookOpen, HelpCircle, Quote, Star, Code2, Share2,
}

/**
 * A provider's glyph rendered inside a rounded badge tinted with its brand colour.
 * lucide dropped most brand icons, so we use semantic icons coloured per-brand for
 * recognisability without shipping risky inline brand SVG paths.
 */
export default function ProviderIcon({
  icon,
  color,
  size = 20,
  badge = true,
}: {
  icon: string
  color: string
  size?: number
  badge?: boolean
}) {
  const Icon = ICONS[icon] ?? Share2
  if (!badge) return <Icon size={size} />
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size + 20,
        height: size + 20,
        color,
        // 18% / 30% tints of the brand colour for the badge fill + ring.
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}33`,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}
