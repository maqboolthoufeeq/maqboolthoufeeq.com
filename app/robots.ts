import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils'

/**
 * AI / answer-engine crawlers, explicitly allowed so this site can be surfaced
 * and cited by ChatGPT, Perplexity, Claude, Gemini, Bing Copilot, Apple
 * Intelligence and others. The wildcard rule already permits them; naming each
 * is an unambiguous opt-in (several bots look for their own user-agent) and
 * maximises AI visibility — the stated goal here.
 *
 * To opt OUT of model *training* while keeping AI-*search* visibility, move the
 * training bots (GPTBot, ClaudeBot, anthropic-ai, CCBot, Google-Extended,
 * Applebot-Extended, Bytespider, Amazonbot, Meta-ExternalAgent, cohere-ai) into
 * a separate rule with `disallow: '/'`.
 */
const AI_CRAWLERS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Claude-Web',
  'anthropic-ai',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google / Apple / others
  'Google-Extended',
  'GoogleOther',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Diffbot',
  'YouBot',
  'DuckAssistBot',
  'PetalBot',
  'Timpibot',
]

/**
 * robots.txt (served at /robots.txt). Allows crawling of public content, keeps
 * the admin area and API endpoints out of search indexes, explicitly welcomes
 * AI crawlers, and points crawlers at the sitemap. Social-preview scrapers
 * (LinkedIn, Facebook, WhatsApp, X) fetch public pages, which remain allowed.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    // The Host directive expects a bare domain (no scheme), per the spec.
    host: new URL(base).hostname,
  }
}
