'use client'
import { useState } from 'react'

const GROUPS = [
  {
    label: 'Blog Posts',
    tools: [
      { name: 'list_posts',   desc: 'List all posts' },
      { name: 'get_post',     desc: 'Fetch post by ID' },
      { name: 'create_post',  desc: 'Create a post' },
      { name: 'update_post',  desc: 'Update a post' },
      { name: 'publish_post', desc: 'Publish / unpublish' },
    ],
  },
  {
    label: 'Projects',
    tools: [
      { name: 'list_projects',    desc: 'List all projects' },
      { name: 'get_project',      desc: 'Fetch project by ID' },
      { name: 'create_project',   desc: 'Create a project' },
      { name: 'update_project',   desc: 'Update a project' },
      { name: 'delete_project',   desc: 'Delete a project' },
      { name: 'reorder_projects', desc: 'Set display order' },
    ],
  },
  {
    label: 'Landing Page',
    tools: [
      { name: 'get_site_section',    desc: 'Read any section' },
      { name: 'update_hero',         desc: 'Update hero / profile' },
      { name: 'update_about',        desc: 'Update about & skills' },
      { name: 'update_navbar',       desc: 'Update navigation' },
      { name: 'update_contact',      desc: 'Update contact info' },
      { name: 'update_footer',       desc: 'Update footer' },
      { name: 'update_sections',     desc: 'Show / hide sections' },
    ],
  },
  {
    label: 'Appearance',
    tools: [
      { name: 'list_themes',       desc: 'List color themes' },
      { name: 'get_active_theme',  desc: 'Get current theme' },
      { name: 'set_theme',         desc: 'Switch color theme' },
      { name: 'list_designs',      desc: 'List design styles' },
      { name: 'get_active_design', desc: 'Get current design' },
      { name: 'set_design',        desc: 'Switch design style' },
    ],
  },
  {
    label: 'Tags',
    tools: [
      { name: 'list_tags',   desc: 'List all tags' },
      { name: 'create_tag',  desc: 'Create a tag' },
      { name: 'update_tag',  desc: 'Rename a tag' },
      { name: 'delete_tag',  desc: 'Delete a tag' },
    ],
  },
  {
    label: 'Social Media',
    tools: [
      { name: 'list_media',    desc: 'List reels & videos' },
      { name: 'get_media',     desc: 'Fetch one by ID' },
      { name: 'add_media',     desc: 'Add from URL (auto-fetch)' },
      { name: 'update_media',  desc: 'Update a reel / video' },
      { name: 'delete_media',  desc: 'Delete a reel / video' },
      { name: 'reorder_media', desc: 'Set display order' },
      { name: 'list_topics',   desc: 'List topics' },
      { name: 'create_topic',  desc: 'Create a topic' },
      { name: 'update_topic',  desc: 'Rename / reorder topic' },
      { name: 'delete_topic',  desc: 'Delete a topic' },
    ],
  },
  {
    label: 'Media & Utilities',
    tools: [
      { name: 'upload_image_from_url', desc: 'Download & re-host image' },
      { name: 'build_html_content',    desc: 'Preview block → HTML' },
    ],
  },
]

interface Props {
  initialDisabled: string[]
}

export default function McpTools({ initialDisabled }: Props) {
  const [disabled, setDisabled]   = useState<Set<string>>(new Set(initialDisabled))
  const [saving,   setSaving]     = useState(false)
  const [saved,    setSaved]      = useState(false)

  const toggle = (name: string) => {
    setDisabled((prev) => {
      const next = new Set(prev)
      if (next.has(name)) { next.delete(name) } else { next.add(name) }
      return next
    })
    setSaved(false)
  }

  const toggleGroup = (tools: { name: string }[], enable: boolean) => {
    setDisabled((prev) => {
      const next = new Set(prev)
      tools.forEach(({ name }) => (enable ? next.delete(name) : next.add(name)))
      return next
    })
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/mcp/tools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabledTools: [...disabled] }),
    })
    setSaving(false)
    setSaved(true)
  }

  const totalCount = GROUPS.flatMap((g) => g.tools).length
  const enabledCount = totalCount - disabled.size

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Tools</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">{enabledCount} of {totalCount} enabled</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUPS.map((group) => {
          const allOn = group.tools.every((t) => !disabled.has(t.name))
          return (
            <div key={group.label} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                  {group.label}
                </span>
                <button
                  onClick={() => toggleGroup(group.tools, !allOn)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  {allOn ? 'Disable all' : 'Enable all'}
                </button>
              </div>
              <ul className="space-y-2">
                {group.tools.map((tool) => {
                  const enabled = !disabled.has(tool.name)
                  return (
                    <li key={tool.name} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-mono truncate ${enabled ? 'text-[var(--foreground)]' : 'text-[var(--muted)] line-through'}`}>
                          {tool.name}
                        </p>
                        <p className="text-xs text-[var(--muted)] truncate">{tool.desc}</p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => toggle(tool.name)}
                        className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
