import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { SubscriptionTier } from "@/types";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";

export async function POST(req: NextRequest) {
  const supabaseServer = createServerSupabaseClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to initiate checkout." },
      { status: 401 }
    );
  }

  // 2. Parse payload
  let body: {
    planTier: SubscriptionTier;
    gateway?: "stripe" | "razorpay";
    currency?: "USD" | "INR";
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { planTier, gateway = "stripe", currency = "USD" } = body;
  const plan = PRICING_PLANS.find((p) => p.id === planTier);

  if (!plan) {
    return NextResponse.json({ error: `Invalid plan tier: ${planTier}` }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // 3. Handle Stripe Gateway
  if (gateway === "stripe") {
    try {
      // Find or create Stripe Customer
      const { data: userProfile } = await adminSupabase
        .from("users")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

      let stripeCustomerId = userProfile?.stripe_customer_id;

      if (!stripeCustomerId && stripeSecretKey && !stripeSecretKey.includes("placeholder")) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        stripeCustomerId = customer.id;

        await adminSupabase
          .from("users")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", user.id);
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId || undefined,
        customer_email: stripeCustomerId ? undefined : user.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `DecorHome AI - ${plan.name}`,
                description: `${plan.description} (Includes ${plan.credits} AI Redesign Credits)`,
              },
              unit_amount: plan.priceUSD * 100, // cents
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${baseUrl}/dashboard?payment=success&tier=${planTier}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard?payment=canceled`,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          planTier: planTier,
          credits: plan.credits.toString(),
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (stripeError: any) {
      console.error("Stripe Checkout Session creation error:", stripeError);
      return NextResponse.json(
        { error: stripeError.message || "Failed to initialize Stripe checkout." },
        { status: 500 }
      );
    }
  }

  // 4. Handle Razorpay Gateway
  if (gateway === "razorpay") {
    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      const amountInPaise = plan.priceINR * 100; // Razorpay expects amount in paise (1 INR = 100 paise)

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          userId: user.id,
          planTier: planTier,
          credits: plan.credits.toString(),
          userEmail: user.email || "",
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
        planName: plan.name,
        planDescription: plan.description,
        userEmail: user.email,
        credits: plan.credits,
      });
    } catch (razorpayError: any) {
      console.error("Razorpay Order creation error:", razorpayError);
      return NextResponse.json(
        { error: razorpayError.message || "Failed to initialize Razorpay order." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Unsupported payment gateway." }, { status: 400 });
}
