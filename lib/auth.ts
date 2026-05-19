import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null
        if (email !== process.env.ADMIN_EMAIL) return null

        const hash = process.env.ADMIN_PASSWORD_HASH
        if (!hash) {
          // Dev fallback: plain text comparison against ADMIN_PASSWORD
          if (password !== process.env.ADMIN_PASSWORD) return null
        } else {
          const valid = await bcrypt.compare(password, hash)
          if (!valid) return null
        }

        return { id: '1', email, name: 'Admin' }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
})
