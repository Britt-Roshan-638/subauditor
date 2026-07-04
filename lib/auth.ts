import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decode, encode, getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * NextAuth configuration — supports Credentials (email/password) and Google OAuth.
 * Uses PrismaAdapter so OAuth providers and (optionally) database sessions work cleanly.
 * Session strategy stays "jwt" for credentials; adapter is required for Google account linking.
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Update every 24 hours
  },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account) {
        token.provider = account.provider;
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const SESSION_COOKIE_NAME =
  process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

/**
 * Read raw JWT from a NextRequest cookies. Works in App Router route handlers.
 */
async function readJwtFromRequest(request: NextRequest) {
  const raw =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;
  if (!raw) return null;
  try {
    return await decode({
      token: raw,
      secret: process.env.NEXTAUTH_SECRET || "",
    });
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from the JWT token (stateless - no DB call).
 * The JWT already contains id, email, name, picture from the auth callback.
 * Pass the NextRequest from your route handler.
 */
export async function getCurrentUser(request?: NextRequest) {
  try {
    if (!request) return null;
    const token = await readJwtFromRequest(request);
    if (!token?.id) return null;
    // Return JWT claims directly - no DB call for stateless auth
    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      image: token.picture as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user WITH database hydration (for routes that need full User model).
 * Use this when you need fields like plan, razorpayCustomerId, referralCode, etc.
 */
export async function getCurrentUserWithDb(request?: NextRequest) {
  try {
    if (!request) return null;
    const token = await readJwtFromRequest(request);
    if (!token?.id) return null;
    return await prisma.user.findUnique({ where: { id: token.id as string } });
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns the user or a NextResponse error.
 * Uses stateless JWT by default; pass { hydrate: true } if you need DB fields.
 */
export async function requireAuth(request: NextRequest, options?: { hydrate?: boolean }) {
  const user = options?.hydrate
    ? await getCurrentUserWithDb(request)
    : await getCurrentUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

/**
 * Get server session — compatible with API route usage.
 * Uses stateless JWT by default
 */
export async function getServerSession(request: NextRequest, options?: { hydrate?: boolean }) {
  const user = options?.hydrate
    ? await getCurrentUserWithDb(request)
    : await getCurrentUser(request);
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}