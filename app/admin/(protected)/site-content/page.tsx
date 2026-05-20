import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import { HeroForm, AboutForm, ContactForm, FooterForm } from '@/components/admin/SiteContentForm'

export default async function SiteContentPage() {
  const [hero, about, contact, footer] = await Promise.all([
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

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        <Section title="Hero" description="The top section with your name, title, and call-to-action buttons.">
          <HeroForm initial={hero} />
        </Section>

        <Section title="About" description="Your bio paragraphs and skills list.">
          <AboutForm initial={about} />
        </Section>

        <Section title="Contact" description="The description text and social/contact links.">
          <ContactForm initial={contact} />
        </Section>

        <Section title="Footer" description="Copyright name shown in the site footer.">
          <FooterForm initial={footer} />
        </Section>
      </main>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--muted)] mb-5">{description}</p>
      {children}
      <div className="mt-8 border-t border-[var(--border)]" />
    </div>
  )
}
