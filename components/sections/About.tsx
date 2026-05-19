const SKILLS = [
  'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL',
  'Prisma', 'Tailwind CSS', 'Docker', 'AWS', 'Git',
]

export default function About() {
  return (
    <section id="about" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">About me</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4 text-[var(--muted)] leading-relaxed">
          <p>
            I&apos;m a Full-Stack Developer with a passion for crafting performant, accessible web experiences. I
            love the full spectrum — from pixel-perfect UIs to robust APIs and database design.
          </p>
          <p>
            When I&apos;m not coding, you&apos;ll find me exploring new technologies, contributing to open source,
            or writing about what I&apos;ve learned on my blog.
          </p>
        </div>

        <div>
          <p className="text-sm text-[var(--muted)] mb-4 font-mono">Technologies I work with:</p>
          <ul className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <li
                key={skill}
                className="px-3 py-1 text-sm rounded-full border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)]"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
