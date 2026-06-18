import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { sanitizePostHtml } from '@/lib/sanitize'

/**
 * Renders an editable legal page (Privacy Policy / Terms) from admin-managed
 * rich-text. The body is sanitised with the same allow-list as blog posts before
 * it reaches the DOM.
 */
export default function LegalPage({
  title,
  body,
  updated,
}: {
  title: string
  body: string
  updated?: string
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{title}</h1>
        {updated && <p className="text-sm text-[var(--muted)] mt-2">Last updated: {updated}</p>}
        <div className="w-10 h-0.5 bg-[var(--accent)] mt-4 mb-10" />
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(body) }}
        />
      </main>
      <SiteFooter />
    </>
  )
}
