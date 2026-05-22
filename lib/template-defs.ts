export type Template = {
  id: string
  name: string
  description: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Centered sections with sticky nav — the default layout',
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Dark navy, hero-focused with accent words and social icons',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Fixed left sidebar with profile and scrollable right content',
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'CSS grid of mixed-size cards — modern and dense',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Black background, green monospace, raw developer aesthetic',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Warm off-white, serif fonts, editorial two-column layout',
  },
]

export const DEFAULT_TEMPLATE_ID = 'classic'

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
