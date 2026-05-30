import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PostContent from '@/components/blog/PostContent'
import ShareButtons from '@/components/blog/ShareButtons'
import ZapButton, { ZapProvider } from '@/components/blog/ZapButton'
import TagChips from '@/components/blog/TagChips'
import RelatedPosts from '@/components/blog/RelatedPosts'
import PostNavigation from '@/components/blog/PostNavigation'
import PostAdminControls from '@/components/blog/PostAdminControls'
import PostViewTracker from '@/components/blog/PostViewTracker'
import PostStats from '@/components/blog/PostStats'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getSiteContent } from '@/lib/site-content'
import { getRelatedPosts, getAdjacentPosts } from '@/lib/related-posts'
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

  const [shareOrigin, relatedPosts, adjacent, session, analytics] = await Promise.all([
    getRequestOrigin(),
    getRelatedPosts(slug, post.tags.map((t) => t.slug)),
    getAdjacentPosts(slug, post.publishedAt),
    auth(),
    getSiteContent('analytics'),
  ])
  const isAdmin = !!session
  const shareUrl = `${shareOrigin}/blog/${slug}`
  // Stats show publicly when the admin enables the toggle, and always to the
  // admin (flagged as private when the public toggle is off).
  const showStats = analytics.showBlogStats || isAdmin
  const statsAdminOnly = isAdmin && !analytics.showBlogStats

  return (
    <>
      <Navbar />
      <PostViewTracker slug={slug} />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to blog
        </Link>
        {isAdmin && <PostAdminControls id={post.id} title={post.title} variant="detail" />}
        <ZapProvider slug={slug} initialZaps={post.zaps}>
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
            <TagChips tags={post.tags} size="md" />
          </div>
          {showStats && (
            <div className="mt-4">
              <PostStats views={post.views} zaps={post.zaps} adminOnly={statsAdminOnly} />
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
            <ShareButtons
              url={shareUrl}
              title={post.title}
              text={post.excerpt?.trim() || buildExcerpt(post.content)}
            />
            <ZapButton />
          </div>
        </header>
        <PostContent html={sanitizePostHtml(post.content)} />
        <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 flex flex-col items-center text-center gap-5">
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Was this helpful?</p>
            <p className="text-sm text-[var(--muted)] mt-1">Give it a zap to let me know.</p>
          </div>
          <ZapButton size="lg" />
          <div className="w-full pt-5 mt-1 border-t border-[var(--border)] flex flex-col items-center gap-3">
            <p className="text-sm text-[var(--muted)]">Or share it with someone</p>
            <ShareButtons
              url={shareUrl}
              title={post.title}
              text={post.excerpt?.trim() || buildExcerpt(post.content)}
            />
          </div>
        </div>
        </ZapProvider>
        <PostNavigation previous={adjacent.previous} next={adjacent.next} />
        <RelatedPosts posts={relatedPosts} isAdmin={isAdmin} />
      </main>
    </>
  )
}
