export type Design = {
  id: string
  name: string
  description: string
}

export const DESIGNS: Design[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, flat cards — the default',
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Frosted glass with depth and blur',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Sharp edges, bold borders, raw type',
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Generous curves and gentle shadows',
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Monospace terminal aesthetic',
  },
]

export const DEFAULT_DESIGN_ID = 'minimal'

export function getDesign(id: string): Design {
  return DESIGNS.find((d) => d.id === id) ?? DESIGNS[0]
}
