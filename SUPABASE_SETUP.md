# SubAuditor · Supabase Setup

The app runs on **Supabase Postgres** in production. This file is everything you (the human operator) need to do to wire up the database and verify the schema lands cleanly.

> The repo has already been switched to Postgres — `prisma/schema.prisma` declares `provider = "postgresql"` and reads both `DATABASE_URL` (pooler) and `DIRECT_URL` (direct). Nothing else needs to change in the codebase.

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. **Region**: pick something near Vercel. If your Vercel project deploys to `iad1` (US East), pick **us-east-1** for the lowest egress.
3. Set a strong **Database password** — you'll need it in a minute. Save it somewhere safe.
4. Wait ~90s for provisioning.

## 2. Grab the two connection strings

In the new project: **Settings → Database → Connection string → URI tab**

You'll see two flavors:

| Field          | Mode             | Port     | Used by                                                                 |
| -------------- | ---------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL` | Transaction (pooled / PgBouncer) | **6543** | Live serverless runtime (`next start`). Every Vercel function takes one short-lived connection. **Must be the pooler** or you'll exhaust slots in seconds. |
| `DIRECT_URL`   | Session (direct) | **5432** | `prisma migrate deploy`, `prisma db push`, any long-lived migration.    |

Click **"Transaction"** → copy the URI → that's `DATABASE_URL`. Append `?sslmode=require` if Supabase didn't already.
Click **"Session"** → copy the URI → that's `DIRECT_URL`. Append `?sslmode=require` if needed.

You'll end up with something like:

```
DATABASE_URL="postgresql://postgres.abcdefghijkl:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.abcdefghijkl:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

⚠️ **URL-encode any special characters in the password**. Supabase project passwords sometimes contain `+`, `/`, etc. Run them through `encodeURIComponent` before pasting.

## 3. Push the env vars to Vercel

The env vars need to exist in **all three** scopes: Production, Preview, Development. Easiest: via the Vercel CLI from the project root:

```bash
# Production
vercel env add DATABASE_URL production
# paste when prompted
vercel env add DIRECT_URL production

# Preview (so PR deployments also work)
vercel env add DATABASE_URL preview
vercel env add DIRECT_URL preview

# Development (so `vercel dev` works locally-via-Vercel)
vercel env add DATABASE_URL development
vercel env add DIRECT_URL development
```

Also push `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`) and `NEXTAUTH_URL` (set to `https://subauditor-mu.vercel.app` for production).

```bash
openssl rand -base64 32               # output the secret
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production    # value: https://subauditor-mu.vercel.app
```

Optionally Plaid + Stripe if you've got them.

## 4. Push the Prisma schema

Once the env vars are set, run **one** of the following. Pick whichever you have set up locally:

### Option A — Push from your machine

```bash
# from the project root
DATABASE_URL="<pooler URL>" DIRECT_URL="<direct URL>" npx prisma db push
```

You'll see Prisma diff the schema against the empty database and create all tables. Last line should be: `Your database is now in sync with your Prisma schema.`

### Option B — Let the Vercel build do it

The `vercel-build` script in `package.json` already runs `prisma db push`. So if you've set `DATABASE_URL` and `DIRECT_URL` in Vercel, just trigger a redeploy:

```bash
vercel --prod
```

and the tables will be created as part of the build.

## 5. Verify it worked

After the build / push completes, sanity-check from the Supabase Dashboard:

1. **Table Editor** → you should see: `User`, `Account`, `Session`, `VerificationToken`, `PlaidAccount`, `Subscription`, `Transaction`, `PriceChange`.
2. **SQL Editor**, run:
   ```sql
   select count(*) from "User";   -- should return 0
   ```
3. Hit the live site: `https://subauditor-mu.vercel.app/register` → make an account → return to Table Editor and confirm the row landed.

## 6. Optional — enable Row Level Security

Supabase Postgres defaults to off, but if you want defense-in-depth: turn on RLS for every table, then add policies that gate by `auth.uid()::text = "User".id`. This protects against any future API path that bypasses Prisma. (Not required for launch — Prisma is the single ingress.)

---

## Troubleshooting

| Symptom                                                                                                                | Likely cause                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Error: P1001: Can't reach database server`                                                                            | Supabase project still provisioning, or wrong region host. Wait / re-copy URL.      |
| `Error: P1017: Server has closed the connection`                                                                        | You swapped `DATABASE_URL` and `DIRECT_URL`. Pooler is on **6543**, direct on **5432**. |
| `prepared statement "s0" already exists`                                                                               | Using the pooler (6543) for migrations. Switch to `DIRECT_URL` for `db push`.      |
| `FATAL: password authentication failed`                                                                                | Special chars in password not URL-encoded. Wrap password in `encodeURIComponent`.   |
| `relation "User" does not exist`                                                                                       | Schema not pushed. Re-run `npx prisma db push` against `DIRECT_URL`.               |
| `NextAuth: MissingSecret`                                                                                               | `NEXTAUTH_SECRET` not set in Vercel. Add it to all environments.                   |
| App boots but `/dashboard` 404s/logs you out                                                                           | `NEXTAUTH_URL` does not match the deployed domain. Set it to your production URL.  |

## Where these are read in the code

- `prisma/schema.prisma` → single source of truth for the schema.
- `lib/prisma.ts` → singleton Prisma client used everywhere.
- `app/api/auth/[...nextauth]/route.ts` → NextAuth config that hits Prisma.

You should not need to touch any of these for the migration.
