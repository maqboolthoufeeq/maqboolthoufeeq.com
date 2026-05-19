import Link from 'next/link'
import { Code2, ExternalLink, Mail } from 'lucide-react'

const LINKS = [
  { href: 'mailto:maqboolthoufeeq@gmail.com', label: 'Email', icon: Mail },
  { href: 'https://github.com/maqboolthoufeeq', label: 'GitHub', icon: Code2 },
  { href: 'https://linkedin.com/in/maqboolthoufeeq', label: 'LinkedIn', icon: ExternalLink },
]

export default function Contact() {
  return (
    <section id="contact" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Get in touch</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      <div className="max-w-lg">
        <p className="text-[var(--muted)] mb-8 leading-relaxed">
          I&apos;m always open to interesting projects and opportunities. Whether you have a question or just want
          to say hi — feel free to reach out.
        </p>

        <ul className="flex flex-wrap gap-4">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all text-sm"
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
