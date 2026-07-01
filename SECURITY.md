# Security Policy — SubAuditor

## Reporting Security Vulnerabilities

If you discover a security vulnerability in SubAuditor, please report it responsibly:

- **Email**: security@subauditor.app (replace with your actual security contact)
- **Response Time**: We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.

**Please do not** report security vulnerabilities through public GitHub issues.

---

## Security Measures Implemented

### Authentication & Sessions
- NextAuth.js with JWT session strategy
- Credentials (email/password) and Google OAuth support
- JWT max age: 30 days with 24-hour update cycle
- HTTP-only, Secure cookies in production
- SameSite=Lax cookie policy
- bcrypt password hashing with salt rounds of 12

### Row Level Security (RLS)
- All Supabase tables have Row Level Security enabled
- Users can only access their own data (SELECT, INSERT, UPDATE, DELETE)
- Service role restricted access for system tables (VerificationToken)
- Least-privilege access policies enforced at the database level

### Security Headers
- `Strict-Transport-Security`: HSTS with 1-year max-age, includeSubDomains, preload
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY (prevents clickjacking)
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: geolocation=(), microphone=(), camera=(), payment=()
- `Content-Security-Policy`: Restricts script/style/img/font/connect sources
- `X-Powered-By`: Removed to reduce information leakage

### Input Validation
- All API routes validate authentication before processing
- User ownership verification on all resource access
- Input sanitization on registration/login/plaid endpoints
- Query parameter clamping (limit/offset bounded)

### API Security
- All protected API routes require authentication
- Users can only access their own resources (authorization checks)
- Stripe webhook signature verification
- Plaid token validation

---

## Environment Variables

All secrets are stored as environment variables and never committed to version control:

| Variable | Description | Rotated |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection string (pooled) | Yes |
| `DIRECT_URL` | Supabase direct connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `PLAID_SECRET` | Plaid API secret | N/A |
| `STRIPE_SECRET_KEY` | Stripe API secret key | N/A |

See `.env.example` for template values.

---

## Incident Response

1. **Detection**: Monitor Vercel logs, Supabase logs, and user reports
2. **Assessment**: Classify severity (Critical/High/Medium/Low)
3. **Containment**: Rotate compromised secrets immediately
4. **Fix**: Deploy patched version via Vercel
5. **Post-mortem**: Document root cause and preventive measures

---

## Secret Rotation Procedure

1. **Database Password**: Supabase Dashboard → Settings → Database → Reset password → Update `.env` and Vercel env vars
2. **NextAuth Secret**: Generate with `openssl rand -base64 32` → Update `.env` and Vercel env vars
3. **Google OAuth**: Google Cloud Console → APIs & Services → Credentials → Reset client secret → Update `.env` and Vercel env vars
4. **After rotation**: Redeploy via Vercel to pick up new env vars

---

## Ongoing Security Practices

- Run `npm audit` regularly and address high/critical findings
- Keep dependencies updated
- Monitor Supabase advisor for RLS policy gaps
- Review Vercel runtime logs for errors
- Implement rate limiting on authentication endpoints (TODO)
- Consider adding CSRF protection for state-changing operations (TODO)

---

Last updated: 2026-06-30