# SubAuditor — Subscription Auditor SaaS

## Product Overview
A subscription tracking app that connects to users' bank accounts via Plaid, automatically detects all recurring subscriptions, shows forgotten/unused ones, tracks price increases, and helps cancel them.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Credentials + Google OAuth)
- **Payments:** Razorpay (subscriptions)
- **Bank Connections:** Plaid API
- **Styling:** TailwindCSS + shadcn/ui
- **Deployment:** Vercel

## Architecture

### Database Schema (Prisma)
- User (id, email, name, password, plan, razorpayCustomerId, createdAt)
- Account (id, userId, razorpayPaymentId, razorpaySubscriptionId, provider, providerAccountId)
- Subscription (id, userId, name, amount, currency, frequency, category, lastChargeDate, nextChargeDate, status, razorpaySubscriptionId, createdAt, updatedAt)
- Transaction (id, userId, accountId, amount, date, name, category, razorpayPaymentId)
- PriceChange (id, subscriptionId, oldAmount, newAmount, detectedAt)

### API Routes
- POST /api/auth/register — Create account
- POST /api/auth/login — Login
- GET /api/plaid/link-token — Generate Plaid Link token
- POST /api/plaid/exchange — Exchange public token for access token
- GET /api/subscriptions — List all subscriptions
- DELETE /api/subscriptions/:id — Remove subscription
- GET /api/subscriptions/stats — Dashboard stats
- POST /api/razorpay/checkout — Create Razorpay checkout session
- POST /api/razorpay/portal — Open Razorpay customer portal
- POST /api/webhooks/razorpay — Razorpay webhook handler

### Pages
- / — Landing page
- /login — Login page
- /register — Register page
- /dashboard — Main dashboard (subscriptions list, stats)
- /onboarding — Connect bank account flow
- /settings — Account settings, billing
- /pricing — Pricing page

## Competitor Analysis
| Competitor | Pricing | Weakness |
|---|---|---|
| Rocket Money | $4-12/mo (freemium) | Bloated, too many features, privacy concerns |
| Truebill (acquired by Rocket) | Merged into Rocket | No longer independent |
| Trim | Free (takes % of savings) | Limited features, slow |
| SubscriptMe | $4.99/mo | Manual entry only, no bank connect |
| Bobby (mobile) | $2.99 one-time | Mobile only, no web |

## Differentiators
1. Privacy-first — don't store raw transaction data
2. Clean, fast UI — no bloat
3. Price increase alerts — notify when subscriptions go up
4. "Waste score" — AI-powered score showing how much you're wasting
5. One-click cancel links — direct links to cancel pages

## Monetization
- **Free:** Scan up to 5 subscriptions, basic dashboard
- **Pro ($4.99/mo):** Unlimited subscriptions, price alerts, bank sync, waste score
- **Annual ($39/yr):** Same as Pro, save 35%

## MVP Scope (Build Now)
1. Landing page with pricing
2. Auth (email/password + Google)
3. Plaid bank connection
4. Auto-detect subscriptions from transactions
5. Dashboard with subscription list + stats
6. Razorpay payment integration
7. Settings page
8. Responsive design