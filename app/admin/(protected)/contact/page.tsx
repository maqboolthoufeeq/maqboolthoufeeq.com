import { Inbox } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'
import { MarkReadButton } from './MarkReadButton'
import { AttachmentPreview } from './AttachmentPreview'

export default async function ContactRequestsPage() {
  const requests = await prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = requests.filter((r) => !r.read).length

  return (
    <AdminShell
      title="Inbox"
      back="/admin"
      active="messages"
      action={
        unreadCount > 0 ? (
          <span className="text-xs font-medium bg-[var(--accent)] text-white px-2 py-1 rounded-full">
            {unreadCount} new
          </span>
        ) : null
      }
    >
      {requests.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
            <Inbox size={26} />
          </div>
          <p className="text-[var(--foreground)] font-medium">No messages yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Submissions from your contact form will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className={`rounded-2xl border overflow-hidden transition-colors ${
                req.read
                  ? 'border-[var(--border)] bg-[var(--surface)]'
                  : 'border-[var(--accent)]/40 bg-[var(--surface)] ring-1 ring-[var(--accent)]/20'
              }`}
            >
              {/* Header */}
              <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate flex items-center gap-2">
                      {!req.read && (
                        <span
                          aria-label="Unread"
                          className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] shrink-0"
                        />
                      )}
                      {req.name}
                    </p>
                    <a
                      href={`mailto:${req.email}`}
                      className="text-sm text-[var(--accent)] hover:underline truncate block"
                    >
                      {req.email}
                    </a>
                  </div>
                  <time className="text-xs text-[var(--muted)] shrink-0 mt-0.5">
                    {new Date(req.createdAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 sm:px-5 py-4 space-y-3">
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                  {req.message}
                </p>

                {req.attachmentUrl && (
                  <AttachmentPreview
                    url={req.attachmentUrl}
                    name={req.attachmentName ?? 'attachment'}
                    size={req.attachmentSize ?? null}
                  />
                )}
              </div>

              {/* Footer action */}
              {!req.read && (
                <div className="border-t border-[var(--border)]">
                  <MarkReadButton id={req.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
