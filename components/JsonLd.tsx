import type { ReactElement } from 'react'

/**
 * Renders a schema.org JSON-LD block. Server-rendered so the structured data is
 * present in the initial HTML for Google's rich-results parser and for AI
 * engines (ChatGPT, Perplexity, Claude, Gemini) that read JSON-LD to identify
 * the author entity and cite the page.
 *
 * JSON-LD MUST be emitted via dangerouslySetInnerHTML: React escapes text
 * children into HTML entities, but a <script> element is a raw-text element
 * whose contents the browser does not entity-decode, so entity-escaped JSON is
 * invalid. We instead JSON.stringify (escaping the data) and replace `<` with
 * its unicode escape so a `</script>` sequence inside any string value can
 * never break out of the tag — the standard, safe JSON-LD guard.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }): ReactElement {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
