import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      porter_id: string | null
      image?: string | null
    }
  }
}
