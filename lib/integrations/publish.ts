import { prisma } from '@/lib/prisma'
import type { PublishInput, PublishResult } from './types'
import { listPublishableConnections, mergeCredentials } from './store'
import { htmlToMarkdown, htmlToPlainText, truncate } from './html-to-markdown'

/**
 * The cross-publishing orchestrator. Given a normalised PublishInput, it fans out to
 * every enabled + connected provider with Promise.allSettled (one failure never blocks
 * the others), records each attempt in PublishRecord, persists any rotated credentials,
 * and returns a clean per-target result for the UI.
 */

export interface TargetResult {
  provider: string
  name: string
  ok: boolean
  remoteUrl?: string
  error?: string
}

function absoluteUrl(baseUrl: string, path: string): string {
  if (!path) return baseUrl
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/** Build the publish payload for a blog post. */
export function buildPostInput(
  post: { id: string; title: string; slug: string; excerpt: string | null; content: string; coverImage: string | null; tags?: { name: string }[] },
  baseUrl: string,
): PublishInput {
  const summary = post.excerpt?.trim() || truncate(htmlToPlainText(post.content), 280)
  return {
    contentType: 'post',
    contentId: post.id,
    title: post.title,
    summary,
    html: post.content,
    markdown: htmlToMarkdown(post.content),
    url: absoluteUrl(baseUrl, `/blog/${post.slug}`),
    coverImageUrl: post.coverImage ? absoluteUrl(baseUrl, post.coverImage) : undefined,
    tags: post.tags?.map((t) => t.name),
  }
}

/** Build the publish payload for a hub item (link/file/embed) or topic. */
export function buildHubInput(
  item: { id: string; title: string; description: string | null; url: string | null; content: string | null; topicSlug: string; type?: string },
  baseUrl: string,
  contentType: 'hubItem' | 'hubTopic' = 'hubItem',
): PublishInput {
  const summary = item.description?.trim() || (item.content ? truncate(htmlToPlainText(item.content), 280) : '')
  // Prefer the hub item's own external URL (it's often a link block); else link to the topic.
  const url = item.url && /^https?:\/\//i.test(item.url) ? item.url : absoluteUrl(baseUrl, `/hub/${item.topicSlug}`)
  return {
    contentType,
    contentId: item.id,
    title: item.title,
    summary,
    markdown: item.content ? htmlToMarkdown(item.content) : summary,
    html: item.content ?? undefined,
    url,
    tags: undefined,
  }
}

/**
 * Publish `input` to every connected provider (optionally restricted to `providerIds`).
 * Returns one result per attempted target. Never throws — provider errors become results.
 */
export async function crossPost(input: PublishInput, providerIds?: string[]): Promise<TargetResult[]> {
  const all = await listPublishableConnections()
  const targets = providerIds?.length ? all.filter((t) => providerIds.includes(t.provider.id)) : all

  const settled = await Promise.allSettled(
    targets.map(async ({ provider, connection }): Promise<TargetResult> => {
      const publish = provider.publish
      let result: PublishResult
      try {
        result = publish ? await publish(input, connection) : { ok: false, error: 'Provider cannot publish' }
      } catch {
        result = { ok: false, error: 'Provider threw unexpectedly' }
      }

      if (result.credentialUpdates) {
        await mergeCredentials(provider.id, result.credentialUpdates).catch(() => null)
      }

      await prisma.publishRecord
        .create({
          data: {
            provider: provider.id,
            contentType: input.contentType,
            contentId: input.contentId,
            status: result.ok ? 'success' : 'error',
            remoteUrl: result.remoteUrl ?? null,
            remoteId: result.remoteId ?? null,
            error: result.ok ? null : (result.error ?? 'Unknown error').slice(0, 500),
          },
        })
        .catch(() => null)

      return { provider: provider.id, name: provider.name, ok: result.ok, remoteUrl: result.remoteUrl, error: result.error }
    }),
  )

  return settled.map((s, i) =>
    s.status === 'fulfilled'
      ? s.value
      : { provider: targets[i].provider.id, name: targets[i].provider.name, ok: false, error: 'Unexpected failure' },
  )
}

/** Past cross-post attempts for a piece of content (newest first), for the UI. */
export async function getPublishHistory(contentType: string, contentId: string) {
  return prisma.publishRecord.findMany({
    where: { contentType, contentId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, provider: true, status: true, remoteUrl: true, error: true, createdAt: true },
  })
}
