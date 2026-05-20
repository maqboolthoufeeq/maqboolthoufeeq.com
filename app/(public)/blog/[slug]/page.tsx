import { notFound } from 'next/navigation'
import Image from 'next/image'
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
  const post = await prisma.post.findUnique({ where: { slug }, include: { tags: true } })

  if (!post || !post.published) notFound()

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        {post.coverImage && (
          <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-10 border border-[var(--border)]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              unoptimized={post.coverImage.startsWith('http')}
            />
          </div>
        )}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
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
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface)] border border-[var(--border)]">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>
        <PostContent html={post.content} />
      </main>
    </>
  )
}
