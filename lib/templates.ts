import { prisma } from './prisma'
import { DEFAULT_TEMPLATE_ID } from './template-defs'
export type { Template } from './template-defs'
export { TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate } from './template-defs'

export async function getActiveTemplateId(): Promise<string> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'template' } })
  return (row?.value as { id?: string } | null)?.id ?? DEFAULT_TEMPLATE_ID
}
