import { put } from '@vercel/blob'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be smaller than 5 MB')
  }

  const { url } = await put(file.name, file, { access: 'public' })
  return url
}
