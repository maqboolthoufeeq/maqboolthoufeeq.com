/**
 * Instant skeleton shown while any public route (blog, projects, hub, videos…)
 * is being prepared. Because these pages are `force-dynamic` and render their
 * own <Navbar>, this boundary is what makes a click feel immediate: Next swaps
 * in this shell the moment navigation starts, then streams the real page in.
 * It also unlocks <Link> prefetching up to this boundary.
 */
export default function PublicLoading() {
  return (
    <div className="animate-pulse">
      {/* Navbar placeholder — mirrors the real sticky header height. */}
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="h-5 w-28 rounded bg-[var(--surface)]" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:block h-4 w-14 rounded bg-[var(--surface)]" />
            <div className="hidden sm:block h-4 w-14 rounded bg-[var(--surface)]" />
            <div className="h-8 w-8 rounded-lg bg-[var(--surface)]" />
            <div className="h-8 w-8 rounded-lg bg-[var(--surface)]" />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-8 w-40 rounded-lg bg-[var(--surface)] mb-3" />
        <div className="h-0.5 w-10 bg-[var(--surface)] mb-10" />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <div className="h-32 sm:h-40 w-full bg-[var(--background)]" />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-4 w-3/4 rounded bg-[var(--background)]" />
                <div className="h-3 w-full rounded bg-[var(--background)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--background)]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
