import Image from 'next/image'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import { isExternal } from '@/lib/utils'

function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return <Link href={href} className={className}>{children}</Link>
}

export default async function Hero() {
  const hero = await getSiteContent('hero')

  return (
    <section id="home" className="max-w-5xl mx-auto px-4 py-24 flex flex-col-reverse sm:flex-row items-center gap-12">
      <div className="flex-1 text-center sm:text-left">
        <p className="text-[var(--accent)] font-mono text-sm mb-3">{hero.greeting}</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          {hero.name}
        </h1>
        <p className="text-xl text-[var(--muted)] mb-8">{hero.title}</p>
        <p className="text-[var(--muted)] max-w-md mb-10 leading-relaxed">
          {hero.description}
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <CtaLink
            href={hero.cta1Href}
            className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity glow"
          >
            {hero.cta1Label}
          </CtaLink>
          <CtaLink
            href={hero.cta2Href}
            className="px-6 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:border-[var(--accent)] transition-colors"
          >
            {hero.cta2Label}
          </CtaLink>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-[var(--accent)] glow">
          <Image
            src={hero.imageUrl || '/headshot.jpg'}
            alt={hero.name}
            width={208}
            height={208}
            className="object-cover w-full h-full"
            priority
            unoptimized={hero.imageUrl?.startsWith('http')}
          />
        </div>
      </div>
    </section>
  )
}
