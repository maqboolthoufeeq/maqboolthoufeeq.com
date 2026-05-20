import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { verifyPreAuthToken } from './admin-auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        preAuthToken: { label: 'Pre-auth token', type: 'text' },
      },
      async authorize(credentials) {
        const token = credentials?.preAuthToken as string | undefined
        if (!token) return null

        const valid = await verifyPreAuthToken(token)
        if (!valid) return null

        return { id: '1', email: process.env.ADMIN_EMAIL ?? 'admin', name: 'Admin' }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
})
