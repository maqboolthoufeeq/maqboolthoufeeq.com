import { Code2, ExternalLink, Mail } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'

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

      <div className="max-w-lg">
        <p className="text-[var(--muted)] mb-8 leading-relaxed">{contact.description}</p>

        <ul className="flex flex-wrap gap-4">
          {contact.links.map(({ href, label }) => {
            const Icon = ICON_MAP[label] ?? ExternalLink
            const external = isExternal(href)
            const isMail = href.startsWith('mailto:')
            return (
              <li key={label}>
                <a
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : isMail ? undefined : undefined}
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
    </section>
  )
}
