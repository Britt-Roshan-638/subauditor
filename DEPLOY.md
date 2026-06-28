# SubAuditor — Deployment Guide

## Live Deployment
- **Production URL**: https://subauditor-mu.vercel.app
- **Inspect**: https://vercel.com/brittroshan12124-9371s-projects/subauditor

## Status
✅ **Build & deploy PASSED** — all 24 routes generated, marketing pages render at `/`, `/login`, `/register`, `/pricing`.
⚠️ **Database** — Vercel serverless file system is **read-only and ephemeral**, so SQLite is non-persistent. Auth/DB-backed routes (`/api/*`, `/dashboard`, `/onboarding`, `/settings`) need a Postgres database to function in production.

## One-Time Database Setup (Required for full functionality)

### Option A — Neon Postgres (recommended, free tier works)

1. Go to https://neon.tech and create a free account.
2. Create a new project (region: **US East / iad1** to match Vercel region).
3. Copy the **pooled connection string** from the dashboard.
4. In your Vercel project, go to **Storage → Marketplace → Postgres → Neon** and install the integration, OR add the env var manually:

```bash
cd "C:\Users\Britt Roshan\subauditor"
echo '<paste-your-neon-connection-string-here>' | npx vercel env add DATABASE_URL production
```

5. Push the schema:
```bash
DATABASE_URL="<paste-neon-url-here>" npx prisma db push --accept-data-loss
```

6. (Optional) Seed a test user:
```bash
DATABASE_URL="<paste-neon-url-here>" node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
(async () => {
  const h = await bcrypt.hash('Test1234!', 12);
  await p.user.upsert({
    where: { email: 'test@subauditor.com' },
    create: { email: 'test@subauditor.com', name: 'Test User', password: h },
    update: { password: h }
  });
  console.log('Seeded test@subauditor.com / Test1234!');
  await p.\$disconnect();
})();
"
```

7. Redeploy:
```bash
npx vercel --prod --yes
```

### Option B — Vercel Postgres via Marketplace (Deprecated)

Vercel Postgres is no longer directly available — they migrated to Neon via Marketplace. Use Option A.

## Local Development (SQLite)

```bash
cd "C:\Users\Britt Roshan\subauditor"
npm install        # installs deps + runs prisma generate via postinstall
npx prisma db push # creates local dev.db
# Optional seed
node -e "const{PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const p=new PrismaClient();(async()=>{const h=await bcrypt.hash('Test1234!',12);await p.user.upsert({where:{email:'test@subauditor.com'},create:{email:'test@subauditor.com',name:'Test User',password:h},update:{password:h}});console.log('Seeded');await p.\$disconnect();})();"
npm run dev        # or: npm run build && npm start
```

Visit http://localhost:3000
Login: **test@subauditor.com / Test1234!**

## Environment Variables (set on Vercel)

| Variable | Status | Purpose |
|---|---|---|
| `DATABASE_URL` | **Set** (sqlite placeholder) | Replace with Neon URL for full functionality |
| `NEXTAUTH_SECRET` | **Set** (placeholder) | 32-byte secret — change this in production |
| `NEXTAUTH_URL` | **Set** | `https://subauditor-mu.vercel.app` |
| `GOOGLE_CLIENT_ID` | optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | optional | Google OAuth |
| `PLAID_CLIENT_ID` | optional | Plaid bank linking |
| `PLAID_SECRET` | optional | Plaid bank linking |
| `PLAID_ENV` | optional | `sandbox` for testing |
| `STRIPE_SECRET_KEY` | optional | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | optional | Stripe webhook signature |
| `STRIPE_PRICE_MONTHLY` | optional | Stripe Pro price ID |
| `STRIPE_PRICE_ANNUAL` | optional | Stripe Annual price ID |

## Post-Deployment Commands

```bash
# Inspect deployment
npx vercel inspect subauditor-mu.vercel.app

# View logs
npx vercel logs subauditor-mu.vercel.app

# Pull env vars to local .env.local
npx vercel env pull .env.local

# Redeploy
npx vercel --prod --yes
```

## Fixes Applied in This Session

1. ✅ Swapped deprecated `@auth/prisma-adapter` → `@next-auth/prisma-adapter` (correct for next-auth v4)
2. ✅ Connected the PrismaAdapter to the auth config in `lib/auth.ts`
3. ✅ Replaced broken `cookies()` call in `app/api/auth/signout/route.ts` with `request.cookies`
4. ✅ Made `lib/auth.ts` correctly decode JWT in App Router route handlers (`readJwtFromRequest`)
5. ✅ Updated Stripe SDK API version handling (removed incompatible `apiVersion: "2024-06-20" as any`)
6. ✅ Added `server-only` import and explicit configuration check on `lib/stripe.ts`
7. ✅ Removed dead `gsap` dependency
8. ✅ Removed unused `Loader2` import in dashboard
9. ✅ Fixed Transaction→PlaidAccount FK relationship in Prisma schema
10. ✅ Made `prisma/schema.prisma` use `env("DATABASE_URL")` for Vercel compatibility
11. ✅ `.gitignore` covers `prisma/*.db` so dev DB doesn't ship in git
12. ✅ Removed redundant `'use client'` from `app/page.tsx` (already dynamic-imported)
13. ✅ Added `vercel.json` with iad1 region
14. ✅ Cleaned up debug noise files (`_check_fiber8*.js`, `dev-errors.txt`)
