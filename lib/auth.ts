import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Invalid/Missing environment variable: "GOOGLE_CLIENT_ID"')
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Invalid/Missing environment variable: "GOOGLE_CLIENT_SECRET"')
}

const client = new MongoClient(process.env.MONGODB_URI)
const clientPromise = client.connect()

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "hex",
    collections: {
      Users: "users",
    },
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic can be added here
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "database",
  },
}

const handler = NextAuth(authOptions)
export { handler } 