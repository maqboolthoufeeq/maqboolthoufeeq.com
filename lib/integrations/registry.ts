import type { IntegrationProvider } from './types'
import { devto } from './providers/devto'
import { hashnode } from './providers/hashnode'
import { telegram } from './providers/telegram'
import { discord } from './providers/discord'
import { slack } from './providers/slack'
import { mastodon } from './providers/mastodon'
import { bluesky } from './providers/bluesky'
import { x } from './providers/x'
import { linkedin } from './providers/linkedin'
import { reddit } from './providers/reddit'
import { facebook } from './providers/facebook'
import { linkOnlyProviders } from './providers/link-only'

/**
 * The full provider registry, ordered for display (publishers first, by usefulness;
 * link-only profiles last). The cross-post button only ever targets providers whose
 * capability is autoPublish/announce AND that define publish(); link-only entries are
 * config-for-display only.
 */
const PROVIDERS: IntegrationProvider[] = [
  // Full-article auto-publish
  devto,
  hashnode,
  // Announce (short post + canonical link)
  x,
  linkedin,
  mastodon,
  bluesky,
  telegram,
  discord,
  slack,
  reddit,
  facebook,
  // Link-only (no safe posting API — display only)
  ...linkOnlyProviders,
]

const BY_ID = new Map(PROVIDERS.map((p) => [p.id, p]))

export function listProviders(): IntegrationProvider[] {
  return PROVIDERS
}

export function getProvider(id: string): IntegrationProvider | undefined {
  return BY_ID.get(id)
}

/** Provider keys grouped by category, for the admin grid section headers. */
export function providersByCategory(): Record<string, IntegrationProvider[]> {
  const groups: Record<string, IntegrationProvider[]> = {}
  for (const p of PROVIDERS) {
    ;(groups[p.category] ??= []).push(p)
  }
  return groups
}

/** Plain, serializable provider definition (fields + docs) safe to send to the client. */
export interface ProviderMeta {
  id: string
  name: string
  category: IntegrationProvider['category']
  capability: IntegrationProvider['capability']
  icon: string
  brandColor: string
  fields: IntegrationProvider['fields']
  docs: IntegrationProvider['docs']
  hasTest: boolean
}

export function listProviderMeta(): ProviderMeta[] {
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    capability: p.capability,
    icon: p.icon,
    brandColor: p.brandColor,
    fields: p.fields,
    docs: p.docs,
    hasTest: typeof p.test === 'function',
  }))
}
