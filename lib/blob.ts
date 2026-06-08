import { put } from '@vercel/blob'
import crypto from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024  // 50 MB

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be smaller than 5 MB')
  }

  const { url } = await put(file.name, file, { access: 'public', allowOverwrite: true })
  return url
}

export async function uploadMedia(file: File): Promise<string> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    throw new Error('Only JPEG/PNG/WebP/GIF images and MP4/WebM/OGG videos are allowed')
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    throw new Error(isVideo ? 'Video must be smaller than 50 MB' : 'Image must be smaller than 5 MB')
  }

  const { url } = await put(file.name, file, { access: 'public', allowOverwrite: true })
  return url
}

// Canonical safe extensions derived from MIME type — never from user-supplied filename
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024 // 5 MB

// Verifies the leading bytes of the file match the declared MIME type.
// Prevents polyglot/spoofed uploads (e.g. a PHP file claiming to be image/jpeg).
async function verifyMagicBytes(file: File): Promise<boolean> {
  const head = Buffer.from(await file.slice(0, 16).arrayBuffer())

  switch (file.type) {
    case 'image/jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
    case 'image/png':
      return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
    case 'image/webp':
      return head.slice(0, 4).toString('ascii') === 'RIFF' &&
             head.slice(8, 12).toString('ascii') === 'WEBP'
    case 'image/gif':
      return head.slice(0, 4).toString('ascii') === 'GIF8'
    case 'application/pdf':
      return head.slice(0, 4).toString('ascii') === '%PDF'
    case 'application/msword':
      // OLE compound document header
      return head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // DOCX is a ZIP archive
      return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04
    case 'text/plain': {
      // Reject binary data masquerading as plain text (null bytes are a reliable signal)
      const sample = Buffer.from(await file.slice(0, 1024).arrayBuffer())
      return !sample.includes(0x00)
    }
    default:
      return false
  }
}

// Files an authenticated admin can attach to a reel/video. Broader than the
// public contact allowlist (the uploader is trusted), but still MIME-gated.
const MEDIA_ATTACHMENT_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
}
const MAX_MEDIA_ATTACHMENT_BYTES = 25 * 1024 * 1024 // 25 MB

/** Comma-joined `accept` attribute matching the media-attachment allowlist. */
export const MEDIA_ATTACHMENT_ACCEPT = Object.keys(MEDIA_ATTACHMENT_MIME_EXT).join(',')

/**
 * Upload an admin-supplied attachment for a reel/video to Vercel Blob. The file
 * is stored under a random path with the extension derived from its MIME type
 * (never the client filename); the caller keeps the original name for display.
 */
export async function uploadMediaAttachment(file: File): Promise<{ url: string; ext: string }> {
  const ext = MEDIA_ATTACHMENT_MIME_EXT[file.type]
  if (!ext) {
    throw new Error('Unsupported file type. Allowed: images, video, PDF, Office docs, text, CSV, ZIP.')
  }
  if (file.size > MAX_MEDIA_ATTACHMENT_BYTES) {
    throw new Error('File must be smaller than 25 MB')
  }
  const randomName = `media-attachments/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const { url } = await put(randomName, file, { access: 'public' })
  return { url, ext }
}

export async function uploadContactAttachment(file: File): Promise<string> {
  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    throw new Error('Unsupported file type. Allowed: images, PDF, Word documents, plain text.')
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('File must be smaller than 5 MB')
  }

  const valid = await verifyMagicBytes(file)
  if (!valid) {
    throw new Error('File content does not match its declared type.')
  }

  // Random name — extension comes from the MIME map, never from the client filename
  const randomName = `contact-attachments/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const { url } = await put(randomName, file, { access: 'public' })
  return url
}
