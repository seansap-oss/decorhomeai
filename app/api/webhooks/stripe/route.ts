import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { SubscriptionTier } from "@/types";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminSupabase = createAdminClient();
  let rawBody: string;

  try {
    // 1. Raw body extraction for cryptographic verification
    rawBody = await req.text();
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to read raw body: ${err.message}` }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  // 2. Idempotency check: verify if event has already been processed
  const { data: existingEvent } = await adminSupabase
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .single();

  if (existingEvent) {
    console.log(`Stripe event ${event.id} already processed. Returning 200 OK.`);
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // Log new event into processed_webhook_events
  await adminSupabase.from("processed_webhook_events").insert({
    event_id: event.id,
    gateway: "stripe",
    event_type: event.type,
  });

  try {
    // 3. Process Stripe Events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planTier = (session.metadata?.planTier || "starter") as SubscriptionTier;

      if (userId) {
        const plan = PRICING_PLANS.find((p) => p.id === planTier) || PRICING_PLANS[0];
        const creditsToAdd = plan.credits;

        // Fetch current user
        const { data: userProfile } = await adminSupabase
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        const currentCredits = userProfile?.credits ?? 0;
        const newCreditsTotal = currentCredits + creditsToAdd;

        // Bypass RLS using Admin client to update subscription_tier & credits
        await adminSupabase
          .from("users")
          .update({
            subscription_tier: planTier,
            credits: newCreditsTotal,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // Record or update subscription
        if (session.subscription) {
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

          await adminSupabase.from("subscriptions").upsert({
            user_id: userId,
            gateway: "stripe",
            subscription_id: subscriptionId,
            plan_tier: planTier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "subscription_id" });
        }

        console.log(`Successfully upgraded user ${userId} to ${planTier} with +${creditsToAdd} credits.`);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: userProfile } = await adminSupabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (userProfile) {
        await adminSupabase
          .from("users")
          .update({
            subscription_tier: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userProfile.id);

        await adminSupabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id);
      }
    }

    // Always immediately return a 200 OK status
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (processError: any) {
    console.error("Error processing Stripe webhook event:", processError);
    // Return 200 to Stripe to avoid infinite retries if logic failed after signature validation, but log error
    return NextResponse.json({ received: true, error: processError.message }, { status: 200 });
  }
}
