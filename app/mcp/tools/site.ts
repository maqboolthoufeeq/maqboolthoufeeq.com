/**
 * Site content tools — hero, about, navbar, contact, footer, section visibility.
 * Each section is stored as JSON in the SiteContent table (key → value).
 */

import { getSiteContent, setSiteContent } from '@/lib/site-content'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

export const TOOLS: ToolDef[] = [
  {
    name: 'get_site_section',
    description:
      'Read the current content of any site section. ' +
      'Sections: hero | about | navbar | contact | footer | sections (visibility flags).',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['hero', 'about', 'navbar', 'contact', 'footer', 'sections'],
        },
      },
      required: ['section'],
    },
  },
  {
    name: 'update_hero',
    description: `Update the hero / landing section. All fields are optional — only supplied fields are changed.
Fields:
  greeting      — e.g. "Hello, I'm"
  name          — first name
  lastName      — last name / family name
  title         — professional title, e.g. "Lead Software Engineer"
  description   — short bio paragraph
  cta1Label / cta1Href — primary call-to-action button
  cta2Label / cta2Href — secondary call-to-action button
  imageUrl      — profile photo URL (use upload_image_from_url to host it)
  imageVisible  — show/hide the profile image
  imageShape    — "circle" | "rounded" | "square"
  imageSize     — "sm" | "md" | "lg"
  socialLinks   — array of { platform: string, href: string }`,
    inputSchema: {
      type: 'object',
      properties: {
        greeting: { type: 'string' },
        name: { type: 'string' },
        lastName: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        cta1Label: { type: 'string' },
        cta1Href: { type: 'string' },
        cta2Label: { type: 'string' },
        cta2Href: { type: 'string' },
        imageUrl: { type: 'string' },
        imageVisible: { type: 'boolean' },
        imageShape: { type: 'string', enum: ['circle', 'rounded', 'square'] },
        imageSize: { type: 'string', enum: ['sm', 'md', 'lg'] },
        socialLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string', description: 'e.g. GitHub, LinkedIn, Twitter' },
              href: { type: 'string', description: 'Full URL' },
            },
            required: ['platform', 'href'],
          },
        },
      },
    },
  },
  {
    name: 'update_about',
    description: 'Update the About section. Provide paragraphs (body text) and/or skills (tag list).',
    inputSchema: {
      type: 'object',
      properties: {
        paragraphs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of paragraph strings for the About body',
        },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of skill/technology labels shown as tags',
        },
      },
    },
  },
  {
    name: 'update_navbar',
    description: 'Update the navigation bar — brand name, brand tag, and navigation links.',
    inputSchema: {
      type: 'object',
      properties: {
        brandName: { type: 'string', description: 'Main brand / site name' },
        brandTag: { type: 'string', description: 'Subtitle or family name shown next to brand' },
        links: {
          type: 'array',
          description: 'Navigation links',
          items: {
            type: 'object',
            properties: {
              href: { type: 'string' },
              label: { type: 'string' },
            },
            required: ['href', 'label'],
          },
        },
      },
    },
  },
  {
    name: 'update_contact',
    description: 'Update the Contact section content.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        extra: {
          type: 'array',
          description: 'Extra info rows, e.g. timezone, availability',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
        },
        links: {
          type: 'array',
          description: 'Contact / social links',
          items: {
            type: 'object',
            properties: {
              href: { type: 'string' },
              label: { type: 'string' },
            },
            required: ['href', 'label'],
          },
        },
      },
    },
  },
  {
    name: 'update_footer',
    description: 'Update footer content (copyright name).',
    inputSchema: {
      type: 'object',
      properties: {
        copyrightName: { type: 'string' },
      },
    },
  },
  {
    name: 'update_sections',
    description:
      'Show or hide individual page sections on the landing page. ' +
      'Available sections: hero, about, projects, blogPreview, contact, blogArchive. ' +
      'Pass true to show a section, false to hide it. Unspecified sections are unchanged.',
    inputSchema: {
      type: 'object',
      properties: {
        hero: { type: 'boolean' },
        about: { type: 'boolean' },
        projects: { type: 'boolean' },
        blogPreview: { type: 'boolean' },
        contact: { type: 'boolean' },
        blogArchive: { type: 'boolean' },
      },
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'get_site_section': {
      const { section } = args as { section: 'hero' | 'about' | 'navbar' | 'contact' | 'footer' | 'sections' }
      const value = await getSiteContent(section)
      return text(value)
    }

    case 'update_hero': {
      const current = await getSiteContent('hero')
      const updated = { ...current, ...args }
      await setSiteContent('hero', updated)
      return text(`Hero updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    case 'update_about': {
      const current = await getSiteContent('about')
      const updated = { ...current, ...args }
      await setSiteContent('about', updated)
      return text(`About updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    case 'update_navbar': {
      const current = await getSiteContent('navbar')
      const updated = { ...current, ...args }
      await setSiteContent('navbar', updated)
      return text(`Navbar updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    case 'update_contact': {
      const current = await getSiteContent('contact')
      const updated = { ...current, ...args }
      await setSiteContent('contact', updated)
      return text(`Contact updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    case 'update_footer': {
      const current = await getSiteContent('footer')
      const updated = { ...current, ...args }
      await setSiteContent('footer', updated)
      return text(`Footer updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    case 'update_sections': {
      const current = await getSiteContent('sections')
      const updated = { ...current, ...args }
      await setSiteContent('sections', updated)
      return text(`Section visibility updated.\n${JSON.stringify(updated, null, 2)}`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}

