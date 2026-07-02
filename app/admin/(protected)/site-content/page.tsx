import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import {
  NavbarForm,
  HubForm,
  HeroForm,
  AboutForm,
  ContactForm,
  FooterForm,
  LegalForm,
  SeoForm,
  SectionToggle,
  CollapsibleSection,
} from '@/components/admin/SiteContentForm'
import AdminShell from '@/components/admin/AdminShell'

export default async function SiteContentPage() {
  const [navbar, hub, hero, about, contact, footer, sections, seo, legal] = await Promise.all([
    getSiteContent('navbar'),
    getSiteContent('hub'),
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('contact'),
    getSiteContent('footer'),
    getSiteContent('sections'),
    getSiteContent('seo'),
    getSiteContent('legal'),
  ])

  return (
    <AdminShell title="Landing page" back="/admin">
      <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
        <CollapsibleSection title="Navbar" description="Brand name and navigation links.">
          <NavbarForm initial={navbar} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Link hub"
          description="A Linktree-style page of topics, links, files and embeds. The top toggle shows a hub preview on the landing page; the navbar link is set below."
          toggle={<SectionToggle sectionKey="hub" initialSections={sections} />}
        >
          <HubForm initial={hub} />
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
          title="Social media"
          description="Instagram reels & YouTube videos rows on the landing page."
          toggle={<SectionToggle sectionKey="socialMedia" initialSections={sections} />}
        >
          <p className="text-sm text-[var(--muted)]">
            Add and organise reels & videos in{' '}
            <Link href="/admin/media" className="text-[var(--accent)] hover:underline">
              Admin → Social media
            </Link>
            . When on, a scrollable Reels row and Videos row appear on the landing page, each
            linking to a full page grouped by topic.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <span className="text-sm font-medium text-[var(--foreground)]">Reels row</span>
              <SectionToggle sectionKey="socialReels" initialSections={sections} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <span className="text-sm font-medium text-[var(--foreground)]">Videos row</span>
              <SectionToggle sectionKey="socialVideos" initialSections={sections} />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Contact"
          description="Description text and social/contact links."
          toggle={<SectionToggle sectionKey="contact" initialSections={sections} />}
        >
          <ContactForm initial={contact} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Blog archive"
          description="Chronological year/month tree shown on the blog page."
          toggle={<SectionToggle sectionKey="blogArchive" initialSections={sections} />}
        >
          <p className="text-sm text-[var(--muted)]">
            When enabled, a collapsible archive widget appears above the blog post list, grouped
            by year and month.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Announcements"
          description="A notice bar shown on top of the landing page, with public history."
        >
          <p className="text-sm text-[var(--muted)]">
            Add and manage banner notices in{' '}
            <Link href="/admin/banners" className="text-[var(--accent)] hover:underline">
              Admin → Announcements
            </Link>
            . The newest active one shows at the top of the site; all of them appear on the public{' '}
            <Link href="/announcements" className="text-[var(--accent)] hover:underline">
              announcements
            </Link>{' '}
            page.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Footer" description="Copyright name and tagline shown in the site footer.">
          <FooterForm initial={footer} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Legal pages"
          description="Privacy Policy and Terms & Conditions, linked from the footer."
          defaultOpen={false}
        >
          <LegalForm initial={legal} />
        </CollapsibleSection>

        <CollapsibleSection
          title="SEO & identity"
          description="Site name, author, tagline and role used in page titles, search results and social share cards."
        >
          <SeoForm initial={seo} />
        </CollapsibleSection>
      </div>
    </AdminShell>
  )
}
