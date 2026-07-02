import { prisma } from '@/lib/prisma'
import BlogPreviewClient from './BlogPreviewClient'

export default async function BlogPreview() {
  // Fetch 6 so the grid carousel has a full row; the list view shows the first 3.
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      coverImage: true,
      tags: { select: { id: true, name: true, slug: true } },
    },
  })

  if (posts.length === 0) return null

  return (
    <section id="blog" className="max-w-5xl mx-auto px-4 py-6 sm:py-20">
      <BlogPreviewClient posts={posts} />
    </section>
  )
}
