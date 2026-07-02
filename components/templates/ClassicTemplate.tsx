import Navbar from '@/components/Navbar'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Projects from '@/components/sections/Projects'
import SocialMedia from '@/components/sections/SocialMedia'
import BlogPreview from '@/components/sections/BlogPreview'
import HubPreview from '@/components/sections/HubPreview'
import Contact from '@/components/sections/Contact'
import SiteFooter from '@/components/SiteFooter'
import { getSiteContent } from '@/lib/site-content'

export default async function ClassicTemplate() {
  const sections = await getSiteContent('sections')

  return (
    <>
      <Navbar />
      <AnnouncementBanner />
      <main>
        {sections.hero && <Hero />}
        {sections.about && <About />}
        {sections.projects && <Projects />}
        {sections.socialMedia && <SocialMedia />}
        {sections.blogPreview && <BlogPreview />}
        {sections.hub && <HubPreview />}
        {sections.contact && <Contact />}
      </main>
      <SiteFooter />
    </>
  )
}
