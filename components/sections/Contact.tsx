import { Code2, ExternalLink, Mail, Phone, MapPin } from 'lucide-react'
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

  const hasInfo = contact.email || contact.phone || contact.address || contact.extra?.length > 0

  return (
    <section id="contact" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Get in touch</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      <div className="grid sm:grid-cols-2 gap-12 items-start">
        {/* Left: description + contact info + social links */}
        <div>
          <p className="text-[var(--muted)] leading-relaxed mb-8">{contact.description}</p>

          {hasInfo && (
            <div className="mb-8 space-y-4">
              {contact.email && (
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-0.5">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-0.5">Phone</p>
                    <a href={`tel:${contact.phone}`} className="text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-0.5">Address</p>
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-line">{contact.address}</p>
                  </div>
                </div>
              )}
              {contact.extra?.map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <ExternalLink size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-[var(--foreground)]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

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
