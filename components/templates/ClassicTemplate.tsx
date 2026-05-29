import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Projects from '@/components/sections/Projects'
import BlogPreview from '@/components/sections/BlogPreview'
import Contact from '@/components/sections/Contact'
import VisitorCount from '@/components/VisitorCount'
import { getSiteContent } from '@/lib/site-content'

export default async function ClassicTemplate() {
  const [footer, sections] = await Promise.all([
    getSiteContent('footer'),
    getSiteContent('sections'),
  ])

  return (
    <>
      <Navbar />
      <main>
        {sections.hero && <Hero />}
        {sections.about && <About />}
        {sections.projects && <Projects />}
        {sections.blogPreview && <BlogPreview />}
        {sections.contact && <Contact />}
      </main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {footer.copyrightName}
        <VisitorCount />
      </footer>
    </>
  )
}
