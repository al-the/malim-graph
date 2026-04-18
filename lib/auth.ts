import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { containers } from './cosmos'
import type { User } from './types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const { resources } = await containers
            .users()
            .items.query<User>({
              query: 'SELECT * FROM c WHERE c.email = @email',
              parameters: [{ name: '@email', value: credentials.email as string }],
            })
            .fetchAll()

          const user = resources[0]
          // Only allow active users — pending/suspended return null here;
          // the login page uses /api/auth/preflight to surface a specific message.
          if (!user || user.status !== 'active') return null

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) return null

          await containers.users().item(user.id, user.role).patch([
            { op: 'replace', path: '/last_login', value: new Date().toISOString() },
          ])

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            porter_id: user.porter_id,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.porter_id = (user as { porter_id?: string | null }).porter_id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.porter_id = token.porter_id as string | null
      }
      return session
    },
  },
  pages: { signIn: '/login' },
})
