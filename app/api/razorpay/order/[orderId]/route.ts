import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      // Add any other fields needed by the frontend
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch order details";
    console.error("Fetch order error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}