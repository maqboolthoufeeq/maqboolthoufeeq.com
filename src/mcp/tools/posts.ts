import { apiRequest } from '../client'
import { blocksToHtml, Block } from '../html-builder'

export interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  coverImage?: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt?: string
  tags?: Array<{ id: string; name: string; slug: string }>
}

/** List all blog posts. Pass published=true to show only live posts. */
export async function listPosts(published?: boolean): Promise<Post[]> {
  const qs = published === true ? '' : '?all=true'
  return apiRequest<Post[]>(`/api/posts${qs}`)
}

/** Get a single post by its ID (includes full HTML content). */
export async function getPost(id: string): Promise<Post> {
  return apiRequest<Post>(`/api/posts/${id}`)
}

export type CreatePostInput = {
  title: string
  /** Raw HTML string — OR omit in favour of `blocks`. */
  content?: string
  /**
   * Structured blocks (preferred). Converted to Tiptap-compatible HTML.
   * See html-builder.ts for the full Block type reference.
   */
  blocks?: Block[]
  excerpt?: string
  coverImage?: string
  published?: boolean
  tagIds?: string[]
}

/** Create a new blog post. Supply either `content` (raw HTML) or `blocks` (structured). */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const { blocks, content, ...rest } = input
  const html = blocks ? blocksToHtml(blocks) : (content ?? '')
  if (!html) throw new Error('Either content or blocks must be provided')

  return apiRequest<Post>('/api/posts', {
    method: 'POST',
    body: { ...rest, content: html },
  })
}

export type UpdatePostInput = Partial<Omit<CreatePostInput, 'title'>> & {
  title?: string
}

/** Update an existing blog post by ID. */
export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  const { blocks, content, ...rest } = input
  const body: Record<string, unknown> = { ...rest }

  if (blocks) {
    body.content = blocksToHtml(blocks)
  } else if (content !== undefined) {
    body.content = content
  }

  return apiRequest<Post>(`/api/posts/${id}`, { method: 'PATCH', body })
}

/** Set a post's published status. Automatically sets publishedAt when publishing. */
export async function publishPost(id: string, published: boolean): Promise<Post> {
  return apiRequest<Post>(`/api/posts/${id}`, {
    method: 'PATCH',
    body: { published },
  })
}
