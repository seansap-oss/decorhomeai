"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Zap,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionTier } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Razorpay checkout script loader
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentTier?: SubscriptionTier;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentTier = "free",
}) => {
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "razorpay">("stripe");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (planTier: SubscriptionTier) => {
    try {
      setLoadingTier(planTier);
      setErrorMsg(null);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier,
          gateway: selectedGateway,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment gateway.");
      }

      // 1. Stripe redirect
      if (selectedGateway === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }

      // 2. Razorpay popup modal
      if (selectedGateway === "razorpay") {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
        }

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "DecorHome AI",
          description: `Subscription: ${data.planName}`,
          order_id: data.orderId,
          prefill: {
            email: userEmail || "",
          },
          theme: {
            color: "#4f46e5",
          },
          handler: function (response: any) {
            // Payment success handler
            window.location.href = `/dashboard?payment=success&razorpay_payment_id=${response.razorpay_payment_id}`;
          },
          modal: {
            ondismiss: function () {
              setLoadingTier(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error("Checkout initialization error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during checkout.");
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <Badge variant="purple" className="px-3 py-1 text-xs gap-1.5 inline-flex">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Unlock Unlimited AI Design Power
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Flexible Plans for Every <span className="gradient-text">Design Vision</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Generate stunning photorealistic interior designs, 4K upscaling, and itemized cost
            budgets. Cancel anytime with a single click.
          </p>

          {/* Gateway & Currency Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Gateway Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setSelectedGateway("stripe")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGateway === "stripe"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Stripe (Global)
              </button>
              <button
                onClick={() => setSelectedGateway("razorpay")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGateway === "razorpay"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Razorpay (UPI / NetBanking)
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "USD"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "INR"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs mt-2">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const price = currency === "USD" ? plan.priceUSD : plan.priceINR;
            const isCurrent = currentTier === plan.id;
            const isLoading = loadingTier === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-200 ${
                  isPopular
                    ? "bg-slate-800/90 border-2 border-indigo-500 shadow-2xl glow-primary scale-[1.02]"
                    : "bg-slate-800/50 border border-white/10 hover:border-white/20"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        {formatCurrency(price, currency)}
                      </span>
                      <span className="text-slate-400 text-xs">/month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {plan.credits} AI Generations Included
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isLoading || isCurrent}
                  variant={isPopular ? "glow" : "outline"}
                  className="w-full h-11 text-xs gap-2 font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting Gateway...
                    </>
                  ) : isCurrent ? (
                    "Current Active Plan"
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-Bit SSL End-to-End Encryption
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-400" />
            Zero Stored Card Data (PCI-DSS Compliant)
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Instant Credit Recharge
          </div>
        </div>
      </div>
    </div>
  );
};
