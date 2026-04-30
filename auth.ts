import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { consumeQRSession } from "@/lib/qr-sessions"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID_BUTTON,
      clientSecret: process.env.AUTH_GOOGLE_SECRET_BUTTON,
    }),
    Credentials({
      id: "qr-code",
      credentials: {
        sessionId: { type: "text" },
      },
      async authorize(credentials) {
        const sessionId = credentials?.sessionId as string | undefined
        if (!sessionId) return null
        const user = consumeQRSession(sessionId)
        if (!user) return null
        return {
          id: user.email ?? user.name ?? "user",
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
    Credentials({
      id: "demo-pin",
      credentials: {
        pin: { type: "password" },
      },
      async authorize(credentials) {
        const pin = credentials?.pin as string | undefined
        if (!pin || pin !== "1234") return null
        return {
          id: "bob",
          name: "Bob",
          email: "bob@aggtea.com",
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
})
