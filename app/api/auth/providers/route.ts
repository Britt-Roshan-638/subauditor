import { NextResponse } from "next/server";

/**
 * GET /api/auth/providers — returns which auth providers are enabled.
 * Used by login/register pages to conditionally show Google button.
 */
export async function GET() {
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    credentials: true,
    google: googleEnabled,
  });
}
