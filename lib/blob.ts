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

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadContactAttachment(file: File): Promise<string> {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Allowed: images, PDF, Word documents, plain text.')
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('File must be smaller than 5 MB')
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const randomName = `contact-attachments/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const { url } = await put(randomName, file, { access: 'public' })
  return url
}
