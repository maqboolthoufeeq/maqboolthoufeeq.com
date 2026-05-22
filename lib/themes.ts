export type Theme = {
  id: string
  name: string
  description: string
  // CSS variable overrides — only define what differs from globals.css defaults
  light: Partial<Record<'accent' | 'background' | 'surface' | 'border' | 'foreground' | 'muted', string>>
  dark: Partial<Record<'accent' | 'background' | 'surface' | 'border' | 'foreground' | 'muted', string>>
}

export const THEMES: Theme[] = [
  {
    id: 'violet',
    name: 'Violet',
    description: 'Classic purple — the default',
    light: { accent: '#7c3aed' },
    dark: { accent: '#a855f7', background: '#0d0d0f', surface: '#111118', border: '#1f1f2e' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool sky blue',
    light: { accent: '#0284c7', background: '#f0f7ff', surface: '#ffffff', border: '#bae0fd' },
    dark: { accent: '#38bdf8', background: '#040d18', surface: '#060f20', border: '#0c2035' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy deep green',
    light: { accent: '#15803d', background: '#f0fdf4', surface: '#ffffff', border: '#bbf7d0' },
    dark: { accent: '#4ade80', background: '#030c06', surface: '#05120a', border: '#0c2015' },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm rose red',
    light: { accent: '#be123c', background: '#fff0f3', surface: '#ffffff', border: '#fecdd3' },
    dark: { accent: '#fb7185', background: '#0f0408', surface: '#180610', border: '#2e0c1c' },
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm golden amber',
    light: { accent: '#d97706', background: '#fffbf0', surface: '#ffffff', border: '#fde68a' },
    dark: { accent: '#fbbf24', background: '#0f0a03', surface: '#180f05', border: '#2e1e08' },
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Fresh aqua teal',
    light: { accent: '#0f766e', background: '#f0fffd', surface: '#ffffff', border: '#99f6e4' },
    dark: { accent: '#2dd4bf', background: '#030f0d', surface: '#05160f', border: '#0c2820' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo with dark tones',
    light: { accent: '#4338ca', background: '#f5f3ff', surface: '#ffffff', border: '#c4b5fd' },
    dark: { accent: '#818cf8', background: '#06060f', surface: '#0d0d1a', border: '#1e1e3a' },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Minimal monochrome slate',
    light: { accent: '#475569' },
    dark: { accent: '#94a3b8', background: '#0a0a0c', surface: '#101014', border: '#1c1c24' },
  },
]

export const DEFAULT_THEME_ID = 'violet'

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export function themeToCSS(theme: Theme): string {
  const vars = (obj: Theme['light']) =>
    Object.entries(obj)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')

  const lightVars = vars(theme.light)
  const darkVars = vars(theme.dark)

  const parts: string[] = []
  if (lightVars) parts.push(`:root {\n${lightVars}\n}`)
  if (darkVars) parts.push(`.dark {\n${darkVars}\n}`)
  return parts.join('\n')
}
