import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plaidAccounts = await prisma.plaidAccount.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        institutionName: true,
        plaidItemId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ accounts: plaidAccounts });
  } catch (error: any) {
    console.error("Error fetching Plaid accounts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}