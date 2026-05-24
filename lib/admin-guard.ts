import { createHash } from 'crypto'
import { auth } from './auth'

// SHA-256 of the owner email — plaintext never stored here
const OWNER_HASH = '2bbe257892e3550ed0dd2b52ce5a101a7b4eec777e41d5bef73bd3b810e96cd2'

export async function isOwnerSession(): Promise<boolean> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return false
  const hash = createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex')
  return hash === OWNER_HASH
}
