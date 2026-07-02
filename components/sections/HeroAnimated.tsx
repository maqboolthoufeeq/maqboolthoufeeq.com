'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { isExternal } from '@/lib/utils'
import type { HeroContent, ImageShape, ImageSize } from '@/lib/site-content'
import { SOCIAL_ICONS } from '@/components/SocialIcons'

const IMAGE_SIZE: Record<ImageSize, string> = {
  sm: 'w-32 h-32 sm:w-36 sm:h-36',
  md: 'w-40 h-40 sm:w-52 sm:h-52',
  lg: 'w-52 h-52 sm:w-64 sm:h-64',
}

const IMAGE_SHAPE: Record<ImageShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-[1.75rem]',
  square: 'rounded-none',
}

function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  }
  return <Link href={href} className={className}>{children}</Link>
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

const imageAnim: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 } },
}

export default function HeroAnimated({ hero }: { hero: HeroContent }) {
  const reduce = useReducedMotion()
  const shape = IMAGE_SHAPE[hero.imageShape ?? 'circle']
  const size = IMAGE_SIZE[hero.imageSize ?? 'md']

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden"
    >
      {/* Ambient accent glows — soft depth behind the hero, especially the
          mobile photo (which sits up top in the reversed column). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-[var(--accent)] opacity-[0.16] blur-[80px]" />
        <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[var(--accent)] opacity-[0.07] blur-[70px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-24 flex flex-col-reverse sm:flex-row items-center gap-6 sm:gap-12">
        <motion.div
          className="relative z-10 flex-1 text-center sm:text-left"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            variants={item}
            className="inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent)] font-mono text-xs sm:text-sm mb-4"
          >
            {hero.greeting}
          </motion.span>

          <motion.h1 variants={item} className="mb-3 leading-none">
            {hero.lastName && (
              <span
                style={{ fontFamily: 'var(--font-lora), serif' }}
                className="block text-2xl sm:text-4xl italic font-normal tracking-widest mb-1.5 text-[#94a3b8] dark:text-[#94a3b8]"
              >
                {hero.lastName}
              </span>
            )}
            {/* Fluid size so the full name stays on one line across phone
                widths (as large as it can be without wrapping), then locks to
                the fixed desktop size at sm+. */}
            <span className="block text-[clamp(1.6rem,9vw,3.75rem)] leading-[1.05] sm:text-6xl font-bold text-[var(--foreground)] tracking-tight">
              {hero.name}
            </span>
          </motion.h1>

          <motion.p variants={item} className="text-lg sm:text-xl text-[var(--accent)] font-medium mb-4 sm:mb-5">
            {hero.title}
          </motion.p>

          <motion.p variants={item} className="text-[15px] sm:text-base text-[var(--muted)] max-w-md mx-auto sm:mx-0 mb-7 sm:mb-9 leading-relaxed">
            {hero.description}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <CtaLink
              href={hero.cta1Href}
              className="tap-scale inline-flex items-center justify-center px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity glow"
            >
              {hero.cta1Label}
            </CtaLink>
            <CtaLink
              href={hero.cta2Href}
              className="tap-scale inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-xl font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {hero.cta2Label}
            </CtaLink>
          </motion.div>

          {hero.socialLinks && hero.socialLinks.length > 0 && (
            <motion.div variants={item} className="flex flex-wrap gap-2.5 justify-center sm:justify-start mt-6">
              {hero.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.platform}
                  aria-label={link.platform}
                  className="tap-scale w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 flex items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {SOCIAL_ICONS[link.platform] ?? SOCIAL_ICONS.website}
                </a>
              ))}
            </motion.div>
          )}
        </motion.div>

        {hero.imageVisible !== false && (
          <motion.div
            className={`relative z-10 flex-shrink-0 ${size}`}
            variants={imageAnim}
            initial="hidden"
            animate="visible"
          >
            {/* gentle continuous float (disabled when the user prefers less motion) */}
            <motion.div
              className="w-full h-full"
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* soft halo */}
              <div aria-hidden className={`absolute -inset-3 ${shape} bg-[var(--accent)] opacity-25 blur-2xl`} />
              {/* gradient ring frame */}
              <div className={`relative w-full h-full ${shape} p-[3px] bg-gradient-to-br from-[var(--accent)] via-[var(--accent)]/40 to-[var(--border)] shadow-xl`}>
                <div className={`w-full h-full ${shape} overflow-hidden bg-[var(--background)]`}>
                  <Image
                    src={hero.imageUrl || '/headshot.jpg'}
                    alt={hero.name}
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                    priority
                    unoptimized={hero.imageUrl?.startsWith('http')}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
