/**
 * App-wide fallback shown while a route without a closer boundary is preparing
 * (landing page, admin, etc.). Kept minimal and neutral — the top progress bar
 * (NavigationProgress) already conveys that a click registered; this fills the
 * gap until the destination streams in. Public routes override this with their
 * own richer skeleton in app/(public)/loading.tsx.
 */
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-[1px]">
      <div
        className="h-8 w-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
