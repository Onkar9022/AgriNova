import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Phone or Email",
      credentials: {
        identifier: { label: "Mobile or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Mobile/Email and password are required");
        }

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: credentials.identifier },
                { email: credentials.identifier },
              ],
            } as any,
          });

          if (!user) {
            throw new Error("No account found with this credential");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            throw new Error("Incorrect password");
          }

          return {
            id: user.id,
            name: user.name,
            email: (user as any).email || user.phone,
            role: user.role,
            phone: user.phone,
          };
        } catch (error: any) {
          // If it's our own thrown auth errors, re-throw them cleanly
          if (
            error.message === "No account found with this credential" ||
            error.message === "Incorrect password"
          ) {
            throw error;
          }
          // Database/infrastructure errors — show friendly message
          console.error("Auth DB error:", error.message);
          throw new Error("Service temporarily unavailable. Please try again later.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
