import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  BILLING_SUBSCRIPTION_FILTER,
  FREE_SUBSCRIPTION_LIMIT,
  isProPlan,
  normalizeFrequency,
} from "@/lib/subscription-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: params.id, userId: session.user.id, ...BILLING_SUBSCRIPTION_FILTER },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name?.trim()) data.name = body.name.trim();
    if (typeof body.amount === "number" && body.amount > 0) {
      if (body.amount !== subscription.amount) {
        await prisma.priceChange.create({
          data: {
            id: crypto.randomUUID(),
            subscriptionId: subscription.id,
            oldAmount: subscription.amount,
            newAmount: body.amount,
          },
        });
      }
      data.amount = body.amount;
    }
    if (body.frequency) data.frequency = normalizeFrequency(body.frequency);
    if (body.category) data.category = body.category;
    if (body.status) {
      const validStatuses = ["active", "inactive", "cancelled", "trial"];
      if (validStatuses.includes(body.status)) {
        data.status = body.status;
      }
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ subscription: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: params.id, userId: session.user.id, ...BILLING_SUBSCRIPTION_FILTER },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    await prisma.subscription.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
