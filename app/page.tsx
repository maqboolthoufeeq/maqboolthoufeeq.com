export const dynamic = 'force-dynamic'

import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Projects from '@/components/sections/Projects'
import BlogPreview from '@/components/sections/BlogPreview'
import Contact from '@/components/sections/Contact'
import { getSiteContent } from '@/lib/site-content'

export default async function Home() {
  const footer = await getSiteContent('footer')

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <BlogPreview />
        <Contact />
      </main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {footer.copyrightName}
      </footer>
    </>
  )
}
