import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PostContent from '@/components/blog/PostContent'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug }, select: { title: true, excerpt: true } })
  if (!post) return {}
  return { title: `${post.title} — Maqbool Thoufeeq`, description: post.excerpt ?? undefined }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })

  if (!post || !post.published) notFound()

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{post.title}</h1>
          <div className="flex gap-4 text-sm text-[var(--muted)]">
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toISOString()}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            <span>{readingTime(post.content)} min read</span>
          </div>
        </header>
        <PostContent html={post.content} />
      </main>
    </>
  )
}
