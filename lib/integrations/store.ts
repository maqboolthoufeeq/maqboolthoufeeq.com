import { prisma } from '@/lib/prisma'
import { decryptJson, encryptJson, isEncryptionConfigured, maskSecret } from './crypto'
import { getProvider, listProviders } from './registry'
import type { Connection, IntegrationProvider } from './types'
import { secretKeys } from './types'

/**
 * Database access for integrations, with all encryption/redaction in one place.
 *
 * Secret fields (api keys, tokens, webhook URLs) are AES-GCM-encrypted into the single
 * `credentials` column and NEVER leave the server. Everything the admin UI sees comes
 * from `config` (non-secret) + `meta` (masked hints like the key's last 4 chars).
 */

type Values = Record<string, string>

/** What the admin grid renders for one provider — contains no secrets. */
export interface AdminIntegrationView {
  provider: string
  name: string
  category: IntegrationProvider['category']
  capability: IntegrationProvider['capability']
  icon: string
  brandColor: string
  connected: boolean
  enabled: boolean
  /** Non-secret config values (e.g. publicationId, profileUrl). */
  config: Values
  /** Safe display hints (masked secret tails, handles). */
  meta: Values
}

function splitValues(provider: IntegrationProvider, values: Values): { secrets: Values; config: Values } {
  const secretSet = new Set(secretKeys(provider))
  const secrets: Values = {}
  const config: Values = {}
  for (const field of provider.fields) {
    const raw = values[field.key]
    if (raw === undefined) continue
    const value = String(raw).trim()
    if (secretSet.has(field.key)) {
      if (value) secrets[field.key] = value // blank = "keep existing", handled by caller merge
    } else {
      config[field.key] = value
    }
  }
  return { secrets, config }
}

function buildMeta(provider: IntegrationProvider, secrets: Values): Values {
  const meta: Values = {}
  for (const key of secretKeys(provider)) {
    if (secrets[key]) meta[`${key}_hint`] = maskSecret(secrets[key])
  }
  return meta
}

/** Admin view for every registered provider (merged with any stored row). No secrets. */
export async function listIntegrationsForAdmin(): Promise<AdminIntegrationView[]> {
  const rows = await prisma.integration.findMany()
  const byProvider = new Map(rows.map((r) => [r.provider, r]))
  return listProviders().map((p) => {
    const row = byProvider.get(p.id)
    const config = (row?.config as Values | undefined) ?? {}
    const meta = (row?.meta as Values | undefined) ?? {}
    return {
      provider: p.id,
      name: p.name,
      category: p.category,
      capability: p.capability,
      icon: p.icon,
      brandColor: p.brandColor,
      connected: Boolean(row?.credentials) || (p.capability === 'linkOnly' && Boolean(config.profileUrl)),
      enabled: row?.enabled ?? false,
      config,
      meta,
    }
  })
}

/** Decrypted credentials + config for runtime use (test/publish). Null if not usable. */
export async function getConnection(providerId: string): Promise<Connection | null> {
  const row = await prisma.integration.findUnique({ where: { provider: providerId } })
  if (!row) return null
  const config = (row.config as Values | undefined) ?? {}
  const credentials = row.credentials ? decryptJson<Values>(row.credentials) ?? {} : {}
  return { credentials, config }
}

/**
 * Create/update a provider's stored config + credentials. Blank secret fields are
 * treated as "leave unchanged" so the admin can edit non-secret config without
 * re-pasting keys. Returns the safe admin view of the result.
 */
export async function upsertIntegration(
  providerId: string,
  values: Values,
  enabled?: boolean,
): Promise<AdminIntegrationView> {
  const provider = getProvider(providerId)
  if (!provider) throw new Error('Unknown provider')

  const existing = await prisma.integration.findUnique({ where: { provider: providerId } })
  const { secrets, config } = splitValues(provider, values)

  // Merge new secrets over any previously stored ones (blank field => keep old value).
  const prevSecrets = existing?.credentials ? decryptJson<Values>(existing.credentials) ?? {} : {}
  const mergedSecrets = { ...prevSecrets, ...secrets }
  const hasSecrets = Object.keys(mergedSecrets).length > 0

  if (hasSecrets && !isEncryptionConfigured()) {
    throw new Error('Encryption key not configured (set AUTH_SECRET or INTEGRATIONS_ENC_KEY)')
  }

  const prevConfig = (existing?.config as Values | undefined) ?? {}
  const mergedConfig = { ...prevConfig, ...config }
  const prevMeta = (existing?.meta as Values | undefined) ?? {}
  const meta = { ...prevMeta, ...buildMeta(provider, mergedSecrets) }

  const data = {
    credentials: hasSecrets ? encryptJson(mergedSecrets) : existing?.credentials ?? null,
    config: mergedConfig,
    meta,
    ...(enabled !== undefined ? { enabled } : {}),
  }

  const row = await prisma.integration.upsert({
    where: { provider: providerId },
    create: { provider: providerId, enabled: enabled ?? false, ...data },
    update: data,
  })

  return {
    provider: provider.id,
    name: provider.name,
    category: provider.category,
    capability: provider.capability,
    icon: provider.icon,
    brandColor: provider.brandColor,
    connected: Boolean(row.credentials) || (provider.capability === 'linkOnly' && Boolean(mergedConfig.profileUrl)),
    enabled: row.enabled,
    config: mergedConfig,
    meta,
  }
}

/**
 * Merge rotated secret values (e.g. a refreshed OAuth token) into a provider's stored
 * credentials. Used by the publish orchestrator when a provider returns credentialUpdates.
 */
export async function mergeCredentials(providerId: string, updates: Values): Promise<void> {
  const row = await prisma.integration.findUnique({ where: { provider: providerId } })
  if (!row) return
  const prev = row.credentials ? decryptJson<Values>(row.credentials) ?? {} : {}
  const merged = { ...prev, ...updates }
  await prisma.integration.update({
    where: { provider: providerId },
    data: { credentials: encryptJson(merged) },
  })
}

export async function setEnabled(providerId: string, enabled: boolean): Promise<void> {
  await prisma.integration.update({ where: { provider: providerId }, data: { enabled } }).catch(async () => {
    await prisma.integration.create({ data: { provider: providerId, enabled } })
  })
}

export async function deleteIntegration(providerId: string): Promise<void> {
  await prisma.integration.delete({ where: { provider: providerId } }).catch(() => null)
}

/** Providers that are enabled, connected, and can actually publish (auto/announce). */
export async function listPublishableConnections(): Promise<
  { provider: IntegrationProvider; connection: Connection }[]
> {
  const rows = await prisma.integration.findMany({ where: { enabled: true } })
  const out: { provider: IntegrationProvider; connection: Connection }[] = []
  for (const row of rows) {
    const provider = getProvider(row.provider)
    if (!provider || typeof provider.publish !== 'function' || !row.credentials) continue
    const credentials = decryptJson<Values>(row.credentials) ?? {}
    const config = (row.config as Values | undefined) ?? {}
    out.push({ provider, connection: { credentials, config } })
  }
  return out
}
