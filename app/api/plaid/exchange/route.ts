import { NextRequest, NextResponse } from "next/server";
import { exchangePublicToken, getAccounts } from "@/lib/plaid";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { publicToken } = body;

    // Validate publicToken
    if (!publicToken || typeof publicToken !== 'string' || publicToken.trim() === '') {
      return NextResponse.json(
        { error: "publicToken is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    // Optional: Plaid public tokens are typically longer, but we'll just trim and check length > 10 as a basic check
    if (publicToken.trim().length < 10) {
      return NextResponse.json(
        { error: "publicToken appears to be invalid" },
        { status: 400 }
      );
    }

    // TODO: Implement rate limiting (e.g., max 5 attempts per hour per user)
    // For production, consider using a Redis-based rate limiter or Vercel Edge Middleware

    const { accessToken, itemId } = await exchangePublicToken(
      publicToken,
      session.user.id
    );

    // Get institution info
    const accounts = await getAccounts(accessToken);
    const institutionName = accounts[0]?.name || "Unknown Bank";

    // Store the Plaid account in the database
    const plaidAccount = await prisma.plaidAccount.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        plaidAccessToken: accessToken,
        plaidItemId: itemId,
        institutionName,
      },
    });

    return NextResponse.json({
      success: true,
      accountId: plaidAccount.id,
      institutionName,
    });
  } catch (error: any) {
    console.error("Error exchanging public token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to exchange public token" },
      { status: 500 }
    );
  }
}