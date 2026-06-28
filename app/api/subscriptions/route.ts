import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user!.id },
      orderBy: { amount: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
