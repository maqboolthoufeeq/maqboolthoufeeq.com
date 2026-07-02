/**
 * Admin-scoped loading state. Overrides the app-wide root spinner (which dims
 * the whole viewport) with a lighter, in-flow loader for admin route changes —
 * still clear feedback that a click registered, without the heavy full-screen
 * overlay replacing the admin chrome so abruptly.
 */
export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="h-7 w-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
