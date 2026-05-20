import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import { NavbarForm, HeroForm, AboutForm, ContactForm, FooterForm } from '@/components/admin/SiteContentForm'

export default async function SiteContentPage() {
  const [navbar, hero, about, contact, footer] = await Promise.all([
    getSiteContent('navbar'),
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('contact'),
    getSiteContent('footer'),
  ])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Admin</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Edit Landing Page</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <Section title="Navbar" description="Brand name and navigation links.">
          <NavbarForm initial={navbar} />
        </Section>

        <Section title="Hero" description="Your name, title, description, and profile image.">
          <HeroForm initial={hero} />
        </Section>

        <Section title="About" description="Bio paragraphs and skills list.">
          <AboutForm initial={about} />
        </Section>

        <Section title="Contact" description="Description text and social/contact links.">
          <ContactForm initial={contact} />
        </Section>

        <Section title="Footer" description="Copyright name in the site footer.">
          <FooterForm initial={footer} />
        </Section>
      </main>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  )
}
