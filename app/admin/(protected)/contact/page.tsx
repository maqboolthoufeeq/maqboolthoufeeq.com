import Link from 'next/link'
import { Paperclip } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { MarkReadButton } from './MarkReadButton'

export default async function ContactRequestsPage() {
  const requests = await prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = requests.filter((r) => !r.read).length

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-4">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Admin
        </Link>
        <h1 className="font-semibold text-[var(--foreground)]">Contact Requests</h1>
        {unreadCount > 0 && (
          <span className="ml-auto text-xs bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {requests.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No contact requests yet.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req.id}
                className={`rounded-xl border transition-colors ${
                  req.read
                    ? 'border-[var(--border)] bg-[var(--surface)] opacity-70'
                    : 'border-[var(--accent)]/40 bg-[var(--surface)]'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{req.name}</p>
                    <a
                      href={`mailto:${req.email}`}
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {req.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <time className="text-xs text-[var(--muted)]">
                      {new Date(req.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    {!req.read && <MarkReadButton id={req.id} />}
                    {req.read && <span className="text-xs text-[var(--muted)]">Read</span>}
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                  <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
                    {req.message}
                  </p>

                  {req.attachmentUrl && (
                    <a
                      href={req.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all"
                    >
                      <Paperclip size={12} />
                      {req.attachmentName ?? 'Download attachment'}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
