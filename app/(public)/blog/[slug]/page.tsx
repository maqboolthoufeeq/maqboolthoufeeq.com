import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import PostContent from '@/components/blog/PostContent'
import ShareButtons from '@/components/blog/ShareButtons'
import { prisma } from '@/lib/prisma'
import { readingTime, buildExcerpt } from '@/lib/utils'
import { sanitizePostHtml } from '@/lib/sanitize'
import { getRequestOrigin } from '@/lib/request-origin'
import { SITE_NAME, AUTHOR, ogImages } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
      tags: { select: { name: true } },
    },
  })

  if (!post || !post.published) {
    return { title: 'Post not found — Maqbool Thoufeeq' }
  }

  // Build every absolute URL from the *request* origin so og:url and og:image
  // live on the exact host the crawler fetched (www vs apex vs *.vercel.app).
  // A host mismatch makes the image redirect, which LinkedIn rejects with
  // "cannot display preview".
  const origin = await getRequestOrigin()
  const canonical = `${origin}/blog/${slug}`
  const ogImage = `${origin}/blog/${slug}/og`
  const description = (post.excerpt?.trim() || buildExcerpt(post.content)) || `${post.title} — by ${AUTHOR}`

  return {
    metadataBase: new URL(origin),
    title: `${post.title} — ${SITE_NAME}`,
    description,
    authors: [{ name: AUTHOR }],
    keywords: post.tags.map((t) => t.name),
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: SITE_NAME,
      title: post.title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [AUTHOR],
      section: post.tags[0]?.name,
      tags: post.tags.map((t) => t.name),
      images: ogImages(ogImage, post.title),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug }, include: { tags: true } })

  if (!post || !post.published) notFound()

  const shareUrl = `${await getRequestOrigin()}/blog/${slug}`

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
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <ShareButtons
              url={shareUrl}
              title={post.title}
              text={post.excerpt?.trim() || buildExcerpt(post.content)}
            />
          </div>
        </header>
        <PostContent html={sanitizePostHtml(post.content)} />
        <footer className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Enjoyed this post? Share it</p>
          <ShareButtons
            url={shareUrl}
            title={post.title}
            text={post.excerpt?.trim() || buildExcerpt(post.content)}
          />
        </footer>
      </main>
    </>
  )
}
