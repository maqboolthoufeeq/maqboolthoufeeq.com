import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section id="home" className="max-w-5xl mx-auto px-4 py-24 flex flex-col-reverse sm:flex-row items-center gap-12">
      <div className="flex-1 text-center sm:text-left">
        <p className="text-[var(--accent)] font-mono text-sm mb-3">Hello, I&apos;m</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Maqbool Thoufeeq
        </h1>
        <p className="text-xl text-[var(--muted)] mb-8">Full-Stack Developer</p>
        <p className="text-[var(--muted)] max-w-md mb-10 leading-relaxed">
          I build fast, beautiful web products — from polished frontends to scalable backend systems.
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <Link
            href="/#projects"
            className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity glow"
          >
            See my work
          </Link>
          <Link
            href="/#contact"
            className="px-6 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:border-[var(--accent)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-[var(--accent)] glow">
          <Image
            src="/headshot.jpg"
            alt="Maqbool Thoufeeq"
            width={208}
            height={208}
            className="object-cover w-full h-full"
            priority
          />
        </div>
      </div>
    </section>
  )
}
