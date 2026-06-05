'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Home,
  FileText,
  Folder,
  Inbox,
  MoreHorizontal,
  Layout,
  Tags,
  Palette,
  Clapperboard,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react'
import { signOutAction } from '@/lib/admin-actions'
import { useAdminContext } from './AdminContext'

export type AdminShellActive = 'home' | 'posts' | 'projects' | 'messages' | 'more'

type Props = {
  title: string
  back?: string
  backLabel?: string
  action?: React.ReactNode
  active?: AdminShellActive
  children: React.ReactNode
  /** When true, content area gets no horizontal padding (caller controls). */
  flush?: boolean
}

export default function AdminShell({
  title,
  back,
  action,
  active,
  children,
  flush = false,
}: Props) {
  const { unreadCount } = useAdminContext()
  const showBottomNav = active !== undefined

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <TopBar title={title} back={back} action={action} />

      <main
        className={[
          'flex-1 w-full',
          flush ? '' : 'px-4 sm:px-6',
          showBottomNav
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-10'
            : 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
          'pt-4 sm:pt-8',
        ].join(' ')}
      >
        <div className={flush ? '' : 'max-w-4xl mx-auto w-full'}>{children}</div>
      </main>

      {showBottomNav && <BottomTabBar active={active} unreadCount={unreadCount} />}
    </div>
  )
}

/* ─── Top bar ────────────────────────────────────────────────────────────── */

function TopBar({
  title,
  back,
  action,
}: {
  title: string
  back?: string
  action?: React.ReactNode
}) {
  return (
    <header
      className="sticky top-0 z-30 bg-[var(--surface)]/85 backdrop-blur-xl border-b border-[var(--border)] pt-safe"
    >
      <div className="h-14 sm:h-16 px-2 sm:px-6 flex items-center gap-2 max-w-5xl mx-auto w-full">
        {back ? (
          <Link
            href={back}
            aria-label="Back"
            className="tap-scale shrink-0 w-11 h-11 -ml-1 flex items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </Link>
        ) : (
          <span className="w-2 sm:w-0" aria-hidden />
        )}

        <h1 className="flex-1 text-base sm:text-lg font-semibold text-[var(--foreground)] truncate text-center sm:text-left px-2">
          {title}
        </h1>

        <div className="shrink-0 flex items-center gap-1">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View website"
            className="tap-scale w-11 h-11 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            <ExternalLink size={18} strokeWidth={2.2} />
          </Link>
          {action}
        </div>
      </div>
    </header>
  )
}

/* ─── Bottom tab bar (mobile only) ───────────────────────────────────────── */

function BottomTabBar({
  active,
  unreadCount,
}: {
  active: AdminShellActive
  unreadCount: number
}) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Admin navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] pb-safe"
      >
        <ul className="grid grid-cols-5 h-16">
          <TabItem href="/admin" label="Home" icon={Home} active={active === 'home'} />
          <TabItem href="/admin/posts" label="Posts" icon={FileText} active={active === 'posts'} />
          <TabItem
            href="/admin/projects"
            label="Projects"
            icon={Folder}
            active={active === 'projects'}
          />
          <TabItem
            href="/admin/contact"
            label="Inbox"
            icon={Inbox}
            active={active === 'messages'}
            badge={unreadCount}
          />
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More"
              className={[
                'w-full h-full flex flex-col items-center justify-center gap-0.5 tap-scale',
                active === 'more' ? 'text-[var(--accent)]' : 'text-[var(--muted)]',
              ].join(' ')}
            >
              <MoreHorizontal size={22} strokeWidth={2.2} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  )
}

function TabItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  active: boolean
  badge?: number
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={[
          'relative w-full h-full flex flex-col items-center justify-center gap-0.5 tap-scale',
          active ? 'text-[var(--accent)]' : 'text-[var(--muted)]',
        ].join(' ')}
      >
        <span className="relative">
          <Icon size={22} strokeWidth={2.2} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    </li>
  )
}

/* ─── "More" bottom sheet ────────────────────────────────────────────────── */

function MoreSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = orig
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function go(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-sheet-fade"
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-[var(--surface)] rounded-t-3xl border-t border-[var(--border)] shadow-2xl animate-sheet-in pb-safe"
      >
        <div className="pt-2 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-[var(--border)]" />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">More</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="tap-scale w-10 h-10 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)]"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="px-2 pb-4 space-y-1">
          <SheetItem
            icon={Clapperboard}
            label="Social media"
            description="Reels & videos"
            onClick={() => go('/admin/media')}
          />
          <SheetItem
            icon={Layout}
            label="Edit landing page"
            description="Hero, about, contact, footer"
            onClick={() => go('/admin/site-content')}
          />
          <SheetItem
            icon={Tags}
            label="Tags"
            description="Manage post & project tags"
            onClick={() => go('/admin/tags')}
          />
          <SheetItem
            icon={Palette}
            label="Theme & design"
            description="Colours, layout, style"
            onClick={() => go('/admin/theme')}
          />
        </ul>

        <div className="px-4 pb-4">
          <form action={signOutAction}>
            <button
              type="submit"
              className="tap-scale w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-[var(--border)] text-red-500 font-medium"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function SheetItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="row-pressable w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left"
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
          <Icon size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[var(--foreground)] truncate">
            {label}
          </span>
          <span className="block text-xs text-[var(--muted)] truncate">{description}</span>
        </span>
      </button>
    </li>
  )
}

/* ─── Reusable action button styles for use as <action /> ────────────────── */

export function PrimaryActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="tap-scale inline-flex items-center justify-center h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
    >
      {children}
    </Link>
  )
}

export function IconActionButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="tap-scale w-11 h-11 flex items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--background)]"
    >
      {children}
    </button>
  )
}
