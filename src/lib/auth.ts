import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { upsertUserByGoogleSub } from "@/lib/auth-user";

const E2E_TEST_MODE = process.env.E2E_TEST_MODE === "1";
const E2E_GOOGLE_SUB = "e2e-test-sub";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    ...(E2E_TEST_MODE
      ? [
          CredentialsProvider({
            name: "E2E Test User",
            credentials: {
              username: { label: "username", type: "text" },
              password: { label: "password", type: "password" },
            },
            async authorize(credentials) {
              const username = (credentials?.username ?? "").trim();
              const password = credentials?.password ?? "";
              if (username !== "e2e" || password !== "e2e") return null;

              await upsertUserByGoogleSub({
                googleSub: E2E_GOOGLE_SUB,
                email: "e2e@example.com",
                name: "E2E Test User",
              });

              // Include googleSub so the jwt callback can persist it on the token.
              return {
                id: E2E_GOOGLE_SUB,
                name: "E2E Test User",
                email: "e2e@example.com",
                googleSub: E2E_GOOGLE_SUB,
              } as unknown as { id: string; name: string; email: string; googleSub: string };
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (!account) return false;

      if (account.provider === "google") {
        const sub = (profile as { sub?: string } | null)?.sub;
        if (!sub) return false;

        await upsertUserByGoogleSub({
          googleSub: sub,
          email: (profile as { email?: string } | null)?.email ?? null,
          name: (profile as { name?: string } | null)?.name ?? null,
        });
        return true;
      }

      if (account.provider === "credentials") {
        return E2E_TEST_MODE;
      }

      return false;
    },
    async jwt({ token, profile, user, account }) {
      const sub = (profile as { sub?: string } | null)?.sub;
      if (sub) token.googleSub = sub;

      const uSub = (user as unknown as { googleSub?: string } | null)?.googleSub;
      if (uSub) token.googleSub = uSub;

      if (account?.provider === "credentials" && E2E_TEST_MODE) {
        token.googleSub = E2E_GOOGLE_SUB;
      }
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
