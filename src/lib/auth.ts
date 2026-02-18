import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { upsertUserByGoogleSub } from "@/lib/auth-user";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "google") return false;
      const sub = (profile as { sub?: string } | null)?.sub;
      if (!sub) return false;

      await upsertUserByGoogleSub({
        googleSub: sub,
        email: (profile as { email?: string } | null)?.email ?? null,
        name: (profile as { name?: string } | null)?.name ?? null,
      });

      return true;
    },
    async jwt({ token, profile }) {
      const sub = (profile as { sub?: string } | null)?.sub;
      if (sub) token.googleSub = sub;
      return token;
    },
    async session({ session, token }) {
      if (token.googleSub) {
        (session.user as unknown as { googleSub?: string }).googleSub = token.googleSub as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};
