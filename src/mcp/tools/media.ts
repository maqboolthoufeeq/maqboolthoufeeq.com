import { uploadFile } from '../client'

/**
 * Download an image from any public URL and upload it to the blog's
 * media storage (Vercel Blob). Returns the permanent CDN URL to use
 * in `<img src="...">` tags inside post content.
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL does not point to an image (content-type: ${contentType})`)
  }

  const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
  const filename = `upload-${Date.now()}.${ext}`
  const blob = await res.blob()

  const { url } = await uploadFile('/api/upload', blob, filename)
  return url
}
