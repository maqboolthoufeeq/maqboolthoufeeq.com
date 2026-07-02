import { getRawSiteContent } from './site-content'
import { DEFAULT_TEMPLATE_ID } from './template-defs'
export type { Template } from './template-defs'
export { TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate } from './template-defs'

export async function getActiveTemplateId(): Promise<string> {
  // Reads from the per-request batched SiteContent load (no extra query).
  const value = await getRawSiteContent('template')
  return (value as { id?: string } | undefined)?.id ?? DEFAULT_TEMPLATE_ID
}
