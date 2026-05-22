'use client'

import DOMPurify from 'isomorphic-dompurify'

export default function PostContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr',
      'video', 'source', 'iframe', 'div',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class',
      'controls', 'width', 'height', 'style',
      'frameborder', 'allowfullscreen', 'allow',
      'data-youtube-video',
    ],
  })

  return (
    <div
      className="prose dark:prose-invert max-w-none"
       
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
