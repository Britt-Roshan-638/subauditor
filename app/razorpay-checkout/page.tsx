// app/razorpay-checkout/page.tsx — Razorpay checkout page for handling payments

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, AlertCircle } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get order_id and subscription_id from query params
    const orderId = searchParams.get("order_id");
    const subscriptionId = searchParams.get("subscription_id");

    if (!orderId || !subscriptionId) {
      setError("Invalid payment request. Missing order or subscription ID.");
      setIsLoading(false);
      return;
    }

    // Initialize Razorpay
    const initializePayment = async () => {
      try {
        // Load Razorpay SDK
        await loadRazorpayScript();

        // Get the order details from our backend to verify amount, etc.
        const orderResponse = await fetch(`/api/razorpay/order/${orderId}`);
        if (!orderResponse.ok) {
          throw new Error("Failed to fetch order details");
        }
        const orderData = await orderResponse.json();

        // Initialize Razorpay instance
        const razorpayInstance = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        });

        const options = {
          amount: orderData.amount, // amount in paise
          currency: orderData.currency,
          name: "SubAuditor",
          description: "Subscription to Pro Plan",
          image: "/logo.png", // Your logo
          order_id: orderId,
          handler: async function (response: any) {
            // Handle successful payment
            setIsLoading(true);
            try {
              // Verify payment on server
              const verifyResponse = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  subscriptionId: subscriptionId,
                  signature: response.razorpay_signature,
                }),
              });

              const verifyResult = await verifyResponse.json();
              if (verifyResult.success) {
                setSuccess(true);
                // Redirect to dashboard after a brief delay
                setTimeout(() => {
                  router.push("/dashboard?payment=success");
                }, 1500);
              } else {
                setError("Payment verification failed!");
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Error verifying payment:", err);
              setError("Payment verification failed!");
              setIsLoading(false);
            }
          },
          prefill: {
            name: "", // Will be filled from user data
            email: "", // Will be filled from user data
            contact: "",
          },
          notes: {
            address: "SubAuditor Pro Subscription",
          },
          theme: {
            color: "#7F00FF",
          },
          modal: {
            ondismiss: function () {
              setError("Payment cancelled");
              setIsLoading(false);
            },
          },
        };

        razorpayInstance.open(options);
      } catch (err) {
        console.error("Error initializing Razorpay:", err);
        setError("Failed to initialize payment gateway. Please try again.");
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet to-violet-dim p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-primary-foreground animate-spin" />
          <p className="mt-4 text-xl font-semibold text-primary-foreground">
            Processing payment...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet to-violet-dim p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-xl font-semibold text-destructive">
            {error}
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-violet text-white hover:bg-violet/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald to-emerald-dark p-6">
        <div className="text-center">
          <Check className="mx-auto h-12 w-12 text-success" />
          <p className="mt-4 text-xl font-semibold text-primary-foreground">
            Payment successful! Your Pro subscription is now active.
          </p>
          <p className="mt-2 text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// Helper function to load Razorpay script
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet to-violet-dim p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-primary-foreground animate-spin" />
          <p className="mt-4 text-xl font-semibold text-primary-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}