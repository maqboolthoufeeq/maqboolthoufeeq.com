/**
 * Shared types for the cross-publishing integration system.
 *
 * A provider describes ONE platform (dev.to, Telegram, Instagram…). Its `capability`
 * decides whether the "Publish everywhere" button can post to it:
 *   - autoPublish — a full article is published via an official API (blog platforms).
 *   - announce    — a short post + canonical link is broadcast via an official API.
 *   - linkOnly    — NO safe official posting API exists, so we only store a profile
 *                   link and NEVER auto-post (this is what keeps accounts ban-safe;
 *                   e.g. Instagram/TikTok/Substack live here on purpose).
 */

export type IntegrationCapability = 'autoPublish' | 'announce' | 'linkOnly'

export type IntegrationCategory =
  | 'blog'
  | 'social'
  | 'community'
  | 'video'
  | 'newsletter'
  | 'qa'
  | 'review'
  | 'code'

/** A single field rendered in the admin "connect" form. */
export interface IntegrationField {
  /** Stored under this key inside `credentials` (when secret) or `config` (when not). */
  key: string
  label: string
  /** Controls the input widget + masking. `password` is always treated as secret. */
  type: 'text' | 'password' | 'url' | 'textarea'
  placeholder?: string
  /** Short helper text shown under the field. */
  help?: string
  required?: boolean
  /**
   * Secret fields are AES-GCM-encrypted at rest and never returned to the client.
   * Non-secret fields live in plain `config` and are safe to echo back to the UI.
   * Defaults to true for `password` inputs, false otherwise.
   */
  secret?: boolean
}

export interface DocLink {
  label: string
  url: string
}

/** In-product setup guide for a provider — shown in the connect modal. */
export interface ProviderDocs {
  /** One-line description of what connecting this does. */
  summary: string
  /** Ordered, copy-followable setup steps. */
  steps: string[]
  /** Official documentation / dashboard links. */
  links: DocLink[]
  /** Plain-language ban-safety / compliance note. Always present. */
  banSafety: string
  /** OAuth scopes / app-review requirements, when relevant. */
  scopes?: string
}

/** Decrypted credentials + plain config handed to test()/publish(). */
export interface Connection {
  credentials: Record<string, string>
  config: Record<string, string>
}

/** The normalised piece of content the orchestrator hands to every provider. */
export interface PublishInput {
  contentType: 'post' | 'hubItem' | 'hubTopic'
  contentId: string
  /** Title / headline. */
  title: string
  /** Short plain-text summary (excerpt/description) — used by announce providers. */
  summary: string
  /** Full article body as sanitized HTML (TipTap output), when available. */
  html?: string
  /** Full article body as Markdown — derived from `html` for markdown platforms. */
  markdown?: string
  /** Canonical URL on the origin site — set as canonical_url for SEO de-duplication. */
  url: string
  /** Absolute cover image URL, when available. */
  coverImageUrl?: string
  /** Tag names, when available. */
  tags?: string[]
}

export interface PublishResult {
  ok: boolean
  /** URL of the created post on the target platform. */
  remoteUrl?: string
  /** Platform-side id of the created post. */
  remoteId?: string
  /** Human-readable, secret-free error message when ok=false. */
  error?: string
  /**
   * Rotated secret credentials to persist (e.g. an OAuth2 refresh-token rotation on X).
   * The orchestrator re-encrypts and stores these; providers never touch the DB.
   */
  credentialUpdates?: Record<string, string>
}

export interface TestResult {
  ok: boolean
  message: string
}

export interface IntegrationProvider {
  id: string
  name: string
  category: IntegrationCategory
  capability: IntegrationCapability
  /** lucide-react icon name used in the admin grid. */
  icon: string
  /** Brand accent (hex) for the provider card. */
  brandColor: string
  /** Fields collected in the connect form (empty for the simplest linkOnly providers). */
  fields: IntegrationField[]
  docs: ProviderDocs
  /**
   * Lightweight credential check (a cheap authenticated GET, when the platform offers
   * one). Optional — providers without a safe verify endpoint omit it.
   */
  test?(conn: Connection): Promise<TestResult>
  /**
   * Publish a piece of content. Only defined for autoPublish/announce providers.
   * Must never throw for expected failures — return { ok:false, error } instead.
   */
  publish?(input: PublishInput, conn: Connection): Promise<PublishResult>
}

/** Returns the subset of `fields` that are stored encrypted. */
export function secretKeys(provider: IntegrationProvider): string[] {
  return provider.fields.filter((f) => f.secret ?? f.type === 'password').map((f) => f.key)
}

/** True when the provider can be targeted by the cross-post button. */
export function isPublishable(provider: IntegrationProvider): boolean {
  return provider.capability !== 'linkOnly' && typeof provider.publish === 'function'
}
