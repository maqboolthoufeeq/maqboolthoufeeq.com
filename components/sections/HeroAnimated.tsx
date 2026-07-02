'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { isExternal } from '@/lib/utils'
import type { HeroContent, ImageShape, ImageSize } from '@/lib/site-content'
import { SOCIAL_ICONS } from '@/components/SocialIcons'

const IMAGE_SIZE: Record<ImageSize, string> = {
  sm: 'w-32 h-32 sm:w-36 sm:h-36',
  md: 'w-44 h-44 sm:w-52 sm:h-52',
  lg: 'w-56 h-56 sm:w-64 sm:h-64',
}

const IMAGE_SHAPE: Record<ImageShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
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
  visible: { transition: { staggerChildren: 0.12 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

const imageAnim: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 } },
}

export default function HeroAnimated({ hero }: { hero: HeroContent }) {
  return (
    <section id="home" className="max-w-5xl mx-auto px-4 py-6 sm:py-24 flex flex-col-reverse sm:flex-row items-center gap-8 sm:gap-12">
      <motion.div
        className="flex-1 text-center sm:text-left"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={item} className="text-[var(--accent)] font-mono text-sm mb-3">
          {hero.greeting}
        </motion.p>

        <motion.h1 variants={item} className="mb-4 leading-none">
          {hero.lastName && (
            <span
              style={{ fontFamily: 'var(--font-lora), serif' }}
              className="block text-3xl sm:text-4xl italic font-normal tracking-widest mb-1 text-[#94a3b8] dark:text-[#94a3b8]"
            >
              {hero.lastName}
            </span>
          )}
          <span className="block text-5xl sm:text-6xl font-bold text-[var(--foreground)] tracking-tight">
            {hero.name}
          </span>
        </motion.h1>

        <motion.p variants={item} className="text-xl text-[var(--muted)] mb-8">
          {hero.title}
        </motion.p>

        <motion.p variants={item} className="text-[var(--muted)] max-w-md mb-10 leading-relaxed">
          {hero.description}
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-3 justify-center sm:justify-start">
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
        </motion.div>

        {hero.socialLinks && hero.socialLinks.length > 0 && (
          <motion.div variants={item} className="flex flex-wrap gap-2 justify-center sm:justify-start mt-5">
            {hero.socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.platform}
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {SOCIAL_ICONS[link.platform] ?? SOCIAL_ICONS.website}
              </a>
            ))}
          </motion.div>
        )}
      </motion.div>

      {hero.imageVisible !== false && (
        <motion.div
          className="flex-shrink-0"
          variants={imageAnim}
          initial="hidden"
          animate="visible"
        >
          <div className={[
            IMAGE_SIZE[hero.imageSize ?? 'md'],
            IMAGE_SHAPE[hero.imageShape ?? 'circle'],
            'overflow-hidden border-2 border-[var(--accent)] glow',
          ].join(' ')}>
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
        </motion.div>
      )}
    </section>
  )
}
