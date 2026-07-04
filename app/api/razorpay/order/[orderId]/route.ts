import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await razorpay.orders.fetch(orderId);

    // Only return non-sensitive fields needed for checkout UI
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch order details";
    console.error("Fetch order error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
