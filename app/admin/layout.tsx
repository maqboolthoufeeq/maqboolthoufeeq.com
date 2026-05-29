import type { Metadata } from 'next'

// Keep the entire admin area (login, OTP, reset, and protected pages) out of
// search indexes and social previews. Pass-through layout — the root layout
// owns <html>/<body>.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
