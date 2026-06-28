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

    if (!publicToken) {
      return NextResponse.json(
        { error: "publicToken is required" },
        { status: 400 }
      );
    }

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
