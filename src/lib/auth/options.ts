import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/db/client";
import { encryptToken } from "@/lib/crypto/tokens";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:org repo",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "github") return false;

      const githubId = BigInt(account.providerAccountId);
      const encryptedToken = encryptToken(account.access_token!);

      await prisma.user.upsert({
        where: { githubId },
        create: {
          githubId,
          login: user.name ?? account.providerAccountId,
          email: user.email,
          avatarUrl: user.image,
          accessToken: encryptedToken,
          tokenExpires: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
        update: {
          login: user.name ?? undefined,
          email: user.email,
          avatarUrl: user.image,
          accessToken: encryptedToken,
          tokenExpires: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
      });

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.githubId = account.providerAccountId;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.githubId) {
        (session as any).githubId = token.githubId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
