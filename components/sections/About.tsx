import { getSiteContent } from '@/lib/site-content'
import MobileExpandable from './MobileExpandable'

export default async function About() {
  const about = await getSiteContent('about')

  return (
    <section id="about" className="max-w-5xl mx-auto px-4 py-6 sm:py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">About me</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-6 sm:mb-10" />

      <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
        {/* On mobile the bio shows a short teaser behind a Show more/less toggle;
            desktop always renders it in full. Preference persists per visitor. */}
        <MobileExpandable storageKey="about-bio" collapsedClass="max-h-28" label="About me">
          <div className="space-y-4 text-[var(--muted)] leading-relaxed">
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </MobileExpandable>

        <div>
          <p className="text-sm text-[var(--muted)] mb-4 font-mono">Technologies I work with:</p>
          <MobileExpandable storageKey="about-skills" collapsedClass="max-h-[4.5rem]" label="technologies I work with">
            <ul className="flex flex-wrap gap-2">
              {about.skills.map((skill) => (
                <li
                  key={skill}
                  className="px-3 py-1 text-sm rounded-full border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </MobileExpandable>
        </div>
      </div>
    </section>
  )
}
