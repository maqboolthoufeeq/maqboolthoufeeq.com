import { Code2, ExternalLink, Mail } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'
import ContactForm from './ContactForm'

const ICON_MAP: Record<string, React.ComponentType<{ size: number }>> = {
  Email: Mail,
  GitHub: Code2,
  LinkedIn: ExternalLink,
}

const linkCls = 'flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all text-sm'

export default async function Contact() {
  const contact = await getSiteContent('contact')

  return (
    <section id="contact" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Get in touch</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      <div className="grid sm:grid-cols-2 gap-12 items-start">
        {/* Left: description + social links */}
        <div>
          <p className="text-[var(--muted)] leading-relaxed mb-8">{contact.description}</p>

          {contact.links?.length > 0 && (
            <div>
              <p className="text-xs text-[var(--muted)] mb-4 uppercase tracking-wider">Reach me via</p>
              <ul className="flex flex-col gap-3">
                {contact.links.map(({ href, label }: { href: string; label: string }) => {
                  const Icon = ICON_MAP[label] ?? ExternalLink
                  const external = isExternal(href)
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        className={linkCls}
                      >
                        <Icon size={16} />
                        {label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right: contact form */}
        <div>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
