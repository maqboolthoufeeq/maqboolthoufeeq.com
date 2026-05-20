import { put } from '@vercel/blob'

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
