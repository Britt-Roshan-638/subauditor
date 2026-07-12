import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const res = NextResponse.next();

    // Security Headers
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    // Additional security headers
    res.headers.set('X-DNS-Prefetch-Control', 'on');
    res.headers.set('X-Download-Options', 'noopen');
    res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    const csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://vercel.live https://checkout.razorpay.com https://cdn.plaid.com; " +
      "style-src 'self' 'unsafe-inline' https://checkout.razorpay.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https:; " +
      "connect-src 'self' https://*.supabase.co https://api.vercel.dev https://api.razorpay.com https://*.plaid.com https://production.plaid.com https://sandbox.plaid.com; " +
      "frame-src https://checkout.razorpay.com https://cdn.plaid.com; " +
      "frame-ancestors 'none';" +
      "base-uri 'self';" +
      "form-action 'self';";
    res.headers.set('Content-Security-Policy', csp);
    // Remove X-Powered-By header
    res.headers.delete('X-Powered-By');

    return res;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - / (homepage — loads directly, no auth gate)
     * - _next/static, _next/image, favicon.ico
     * - api/auth, api/webhooks (NextAuth / payment hooks)
     * - Public auth pages (login, register, pricing, onboarding)
     */
    '/((?!$|_next/static|_next/image|favicon.ico|api/auth|api/webhooks|login|register|pricing|onboarding).+)',
  ],
};