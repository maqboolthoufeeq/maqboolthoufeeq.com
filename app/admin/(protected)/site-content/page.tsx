import Link from 'next/link'
import { getSiteContent, SectionVisibility } from '@/lib/site-content'
import { NavbarForm, HeroForm, AboutForm, ContactForm, FooterForm, SectionToggle, CollapsibleSection } from '@/components/admin/SiteContentForm'

export default async function SiteContentPage() {
  const [navbar, hero, about, contact, footer, sections] = await Promise.all([
    getSiteContent('navbar'),
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('contact'),
    getSiteContent('footer'),
    getSiteContent('sections'),
  ])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Admin</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Edit Landing Page</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <CollapsibleSection title="Navbar" description="Brand name and navigation links.">
          <NavbarForm initial={navbar} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Hero"
          description="Your name, title, description, and profile image."
          toggle={<SectionToggle sectionKey="hero" initialSections={sections} />}
        >
          <HeroForm initial={hero} />
        </CollapsibleSection>

        <CollapsibleSection
          title="About"
          description="Bio paragraphs and skills list."
          toggle={<SectionToggle sectionKey="about" initialSections={sections} />}
        >
          <AboutForm initial={about} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Projects"
          description="Your featured projects grid."
          toggle={<SectionToggle sectionKey="projects" initialSections={sections} />}
        >
          <p className="text-sm text-[var(--muted)]">
            Manage project entries in{' '}
            <Link href="/admin/projects" className="text-[var(--accent)] hover:underline">
              Admin → Projects
            </Link>
            .
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Blog preview"
          description="Recent blog posts shown on the landing page."
          toggle={<SectionToggle sectionKey="blogPreview" initialSections={sections} />}
        >
          <p className="text-sm text-[var(--muted)]">
            Manage blog posts in{' '}
            <Link href="/admin/posts" className="text-[var(--accent)] hover:underline">
              Admin → Posts
            </Link>
            .
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Contact"
          description="Description text and social/contact links."
          toggle={<SectionToggle sectionKey="contact" initialSections={sections} />}
        >
          <ContactForm initial={contact} />
        </CollapsibleSection>

        <CollapsibleSection title="Footer" description="Copyright name in the site footer.">
          <FooterForm initial={footer} />
        </CollapsibleSection>
      </main>
    </div>
  )
}
