import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { SubscriptionTier } from "@/types";

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_secret_placeholder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminSupabase = createAdminClient();
  let rawBody: string;

  try {
    // 1. Raw body extraction
    rawBody = await req.text();
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to read raw body: ${err.message}` }, { status: 400 });
  }

  const razorpaySignature = req.headers.get("x-razorpay-signature");

  if (!razorpaySignature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
  }

  // 2. Cryptographic HMAC SHA-256 validation
  const expectedSignature = crypto
    .createHmac("sha256", razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison to prevent side-channel timing attacks
  const isSignatureValid =
    razorpaySignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(razorpaySignature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );

  if (!isSignatureValid) {
    console.error("Razorpay webhook HMAC signature verification failed");
    return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
  }

  let eventPayload: any;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const eventId = eventPayload.event_id || `${eventPayload.event}_${eventPayload.payload?.payment?.entity?.id || Date.now()}`;
  const eventType = eventPayload.event;

  // 3. Idempotency verification in database
  const { data: existingEvent } = await adminSupabase
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  if (existingEvent) {
    console.log(`Razorpay event ${eventId} already processed. Returning 200 OK.`);
    return NextResponse.json({ status: "already_processed" }, { status: 200 });
  }

  // Insert event into idempotency log
  await adminSupabase.from("processed_webhook_events").insert({
    event_id: eventId,
    gateway: "razorpay",
    event_type: eventType,
  });

  try {
    // 4. Process payment.captured / order.paid events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userId = notes.userId;
      const planTier = (notes.planTier || "starter") as SubscriptionTier;

      if (userId) {
        const plan = PRICING_PLANS.find((p) => p.id === planTier) || PRICING_PLANS[0];
        const creditsToAdd = plan.credits;

        // Fetch current user record
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
            razorpay_customer_id: paymentEntity?.customer_id || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // Record subscription / payment entry
        await adminSupabase.from("subscriptions").insert({
          user_id: userId,
          gateway: "razorpay",
          subscription_id: paymentEntity?.id || `rzp_${Date.now()}`,
          plan_tier: planTier,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        console.log(`Successfully credited user ${userId} with +${creditsToAdd} credits via Razorpay.`);
      }
    }

    // Always immediately return 200 OK upon successful processing
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Error executing Razorpay webhook state update:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}
