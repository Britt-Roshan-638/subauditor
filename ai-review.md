# SubAuditor — AI Review Context

## Architecture

Next.js 14.2 App Router SaaS for subscription auditing. Deployed on Vercel (production: `https://subauditor-mu.vercel.app`).

**Data flow:** Plaid API → bank transactions → PostgreSQL (Neon) → Prisma → Next.js API routes → React frontend.

**Key patterns:**
- `/app/api/` — Next.js API routes (serverless functions on Vercel)
- `/app/` — App Router pages with React Server Components
- `/components/` — Shared React components (3D, UI, forms)
- `/lib/` — Shared utilities (prisma client, auth options, plaid, razorpay)
- `/prisma/schema.prisma` — Single source of truth for DB schema (10 models)

## Tech Stack

- **Framework:** Next.js 14.2.35 (App Router), React 18.3.1
- **Language:** TypeScript 5.5
- **Database:** PostgreSQL via Neon (pooled connection, us-east-1)
- **ORM:** Prisma v5.22.0
- **Auth:** NextAuth v4.24.14 (JWT strategy + Credentials provider + Google OAuth + PrismaAdapter)
- **Payment:** Razorpay v2.9.6 (checkout/verify/webhook flow)
- **Bank Linking:** Plaid v42.2.0 (link tokens, exchange, transaction sync)
- **Styling:** Tailwind CSS v3.4 + tailwind-merge + clsx + Radix UI primitives
- **3D:** Three.js + @react-three/fiber + @react-three/drei (hero scene)
- **Animation:** Framer Motion v12
- **Validation:** Zod v4
- **Testing:** Jest v30 + ts-jest
- **Hosting:** Vercel (iad1 region)

## Coding Standards

- **File naming:** kebab-case for components, camelCase for utilities, PascalCase for classes/types
- **API routes:** Each route exports `GET`/`POST` named exports (Next.js App Router convention)
- **Database access:** Always use the shared Prisma client from `@/lib/prisma` (never instantiate `new PrismaClient()`)
- **Auth guards:** API routes protecting user data MUST validate session via `getServerSession(authOptions)` before any DB query
- **Environment variables:** NEVER hardcode secrets. All config reads from `process.env` or `@/lib/env`
- **Error handling:** API routes return `NextResponse.json({ error }, { status })` with appropriate HTTP codes
- **TypeScript:** Strict mode on. No `any` types unless interfacing with untyped third-party libs (document with `// eslint-disable-next-line`)

## What to Always Flag

1. **Hardcoded secrets** — API keys, webhook secrets, connection strings must never be in code
2. **Missing auth checks** — Any API route reading/writing user data must validate the session first
3. **Prisma raw queries without parameterization** — SQL injection risk
4. **Client-side data exposure** — No server-side secrets or raw DB queries in client components
5. **`prisma/schema.prisma` changes without migration** — Schema changes must be paired with `prisma db push` or a migration file
6. **Missing cascade deletes** — All FK relations in schema MUST have `onDelete: Cascade` (current standard)
7. **Razorpay key leaks** — Test keys (`rzp_test_*`) must never hit production; real production keys are required
8. **NEXTAUTH_SECRET weakness** — Must be 32+ bytes of cryptographically random data
9. **Unvalidated webhook payloads** — Razorpay webhook handler must verify `X-Razorpay-Signature` before processing
10. **Client-side `prisma` imports** — Prisma Client must never be imported in `"use client"` components