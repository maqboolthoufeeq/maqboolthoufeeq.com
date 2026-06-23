import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'
import { hashtags } from './shared'

const ENDPOINT = 'https://gql.hashnode.com'

/**
 * Hashnode — full-article auto-publish via the public GraphQL API.
 * POST https://gql.hashnode.com with header `Authorization: <PAT>` (note: NOT "Bearer").
 * Mutation publishPost(input) needs the target publicationId; originalArticleURL sets the
 * canonical URL. Verified 2026-06-24 against apidocs.hashnode.com (confidence: high).
 * NB: Hashnode requires a Pro plan for API access as of May 2026.
 */
const PUBLISH_MUTATION =
  'mutation PublishPost($input: PublishPostInput!) { publishPost(input: $input) { post { id url slug } } }'

export const hashnode: IntegrationProvider = {
  id: 'hashnode',
  name: 'Hashnode',
  category: 'blog',
  capability: 'autoPublish',
  icon: 'Hash',
  brandColor: '#2962ff',
  fields: [
    {
      key: 'token',
      label: 'Personal Access Token',
      type: 'password',
      required: true,
      help: 'Hashnode → Account Settings → Developer → Generate New Token.',
    },
    {
      key: 'publicationId',
      label: 'Publication ID',
      type: 'text',
      required: true,
      secret: false,
      help: 'Your blog dashboard URL contains it, or query "me { publications }" in the API playground.',
    },
  ],
  docs: {
    summary: 'Publishes the full post as a Markdown article on your Hashnode publication, canonical-linked back here.',
    steps: [
      'Open Hashnode → Account Settings → Developer and generate a Personal Access Token.',
      'Find your Publication ID (in your blog dashboard URL, or via the API playground "me { publications { edges { node { id } } } }").',
      'Paste both above. Note: API access requires a Hashnode Pro plan (since May 2026).',
    ],
    links: [
      { label: 'Generate token', url: 'https://hashnode.com/settings/developer' },
      { label: 'API docs', url: 'https://apidocs.hashnode.com/' },
    ],
    banSafety:
      'Posting your own original content via the official API is safe. Always keep the canonical URL set (done automatically) so syndicated copies don\'t hurt your SEO, and stay within ~1–3 posts/day; Hashnode auto-moderates spammy bulk posting.',
    scopes: 'Personal Access Token (full mutation access). No app review. Requires a Pro publication.',
  },
  async test({ credentials, config }) {
    const { status, data } = await fetchJson<{ data?: { publication?: { title?: string } } }>(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: credentials.token ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query Pub($id: ObjectId!) { publication(id: $id) { title } }',
        variables: { id: config.publicationId ?? '' },
      }),
      allowedHosts: ['hashnode.com'],
    })
    const title = data?.data?.publication?.title
    if (status === 200 && title) return { ok: true, message: `Connected to "${title}"` }
    return { ok: false, message: extractApiError(data, 'Could not verify token / publication') }
  },
  async publish(input, { credentials, config }) {
    const variables = {
      input: {
        publicationId: config.publicationId,
        title: input.title,
        contentMarkdown: input.markdown ?? input.summary,
        originalArticleURL: input.url,
        ...(input.coverImageUrl ? { coverImageOptions: { coverImageURL: input.coverImageUrl } } : {}),
        tags: hashtags(input.tags, 5).map((t) => ({ name: t, slug: t.toLowerCase() })),
      },
    }
    const { status, data } = await fetchJson<{
      data?: { publishPost?: { post?: { id?: string; url?: string } } }
      errors?: { message: string }[]
    }>(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: credentials.token ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: PUBLISH_MUTATION, variables }),
      allowedHosts: ['hashnode.com'],
    })
    const post = data?.data?.publishPost?.post
    if (status === 200 && post?.url) {
      return { ok: true, remoteUrl: post.url, remoteId: post.id }
    }
    return { ok: false, error: extractApiError(data, `Hashnode returned ${status}`) }
  },
}
