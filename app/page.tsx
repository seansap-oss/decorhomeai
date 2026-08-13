"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Layers,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Download,
  Star,
  Users,
  Eye,
  Sliders,
  Maximize2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PricingModal } from "@/components/PricingModal";
import { DESIGN_STYLES } from "@/lib/constants/designStyles";
import { ROOM_TYPES } from "@/lib/constants/roomTypes";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { formatCurrency } from "@/lib/utils";

export default function LandingPage() {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-[1800px] right-10 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Next-Gen SDXL Lightning Depth ControlNet Pipeline</span>
            <span className="hidden sm:inline-block text-indigo-400">&bull; 3s Photorealistic Rendering</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Transform Any Room Into a{" "}
            <span className="gradient-text">Photorealistic Masterpiece</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Snap a photo of your empty floorplan or existing room. In seconds, our specialized
            architectural AI renders magazine-worthy redesigns with structural depth preservation,
            interactive before/after sliders, and automated cost budget reports.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/login?mode=signup">
              <Button size="lg" variant="gradient" className="h-13 px-8 text-sm font-bold gap-2 shadow-xl glow-primary">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Redesign Your Room Free (5 Credits)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-13 px-6 text-sm font-semibold gap-2 border-white/20 hover:bg-white/10">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Launch Live Studio Workspace
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {["1534528741775-53994a69daeb", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330", "1500648767791-00dcc994a43e"].map(
                  (id, i) => (
                    <img
                      key={i}
                      src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=80&h=80&q=80`}
                      alt="User avatar"
                      className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                    />
                  )
                )}
              </div>
              <span className="text-slate-300 font-semibold">120,000+ Redesigns</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-slate-300 font-semibold ml-1">4.9 / 5.0 Rating</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Before/After Showcase */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="p-2 sm:p-3 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl glow-primary">
            <BeforeAfterSlider
              originalImageUrl="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
              generatedImageUrl="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
              roomType="Living Room"
              designStyle="Modern Minimalist Japandi"
            />
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge variant="purple" className="text-xs">
            Engineered For Excellence
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Architecture-Grade Generative AI Features
          </h2>
          <p className="text-slate-400 text-sm">
            Everything homeowners, interior architects, and staging agencies need to envision and
            execute luxury transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-2xl glass-card p-6 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Depth ControlNet Precision</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike generic image generators that distort room dimensions, our depth-guided AI locks in
              your original walls, doorways, ceiling heights, and windows with pinpoint millimeter
              accuracy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl glass-card p-6 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">20+ Curated Design Styles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              From Japandi and Wabi-Sabi to Cyberpunk Neon, Parisian Haussmannian, and Mid-Century
              Teak. Switch between styles in seconds to explore infinite aesthetics.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl glass-card p-6 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Cost Estimator & PDF Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly compute itemized budgets for flooring, tailored furniture, lighting fixtures,
              and contractor labor in USD or INR. Download ready-to-share PDF reports.
            </p>
          </div>
        </div>
      </section>

      {/* 3. VISUAL STYLES SHOWCASE (GALLERY) */}
      <section id="gallery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="purple" className="text-xs">
              Curated Architectural Catalog
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Explore 20+ Designer Styles
            </h2>
            <p className="text-slate-400 text-sm">
              Trained on award-winning architectural digest portfolios, luxury hotel suites, and
              mastercraft woodwork.
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="text-xs gap-2 border-white/20">
              Try In Workspace
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Styles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {DESIGN_STYLES.slice(0, 8).map((style) => (
            <div
              key={style.id}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <img
                  src={style.imageUrl}
                  alt={style.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="purple" className="text-[10px] mb-1 px-2 py-0.5">
                    {style.tag}
                  </Badge>
                  <h4 className="text-sm font-bold text-white">{style.name}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {style.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PRICING & SUBSCRIPTION SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <Badge variant="purple" className="text-xs">
            Simple & Transparent Billing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Choose Your AI Design Plan
          </h2>
          <p className="text-slate-400 text-sm">
            Empower your workflow with instant credit replenishment, commercial licenses, and
            automated PDF cost reporting.
          </p>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currency === "USD"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currency === "INR"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const price = currency === "USD" ? plan.priceUSD : plan.priceINR;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all ${
                  isPopular
                    ? "bg-slate-900 border-2 border-indigo-500 shadow-2xl glow-primary scale-105"
                    : "glass-card hover:border-white/20"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[32px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        {formatCurrency(price, currency)}
                      </span>
                      <span className="text-slate-400 text-xs">/month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {plan.credits} AI Room Redesigns
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => setIsPricingModalOpen(true)}
                  variant={isPopular ? "glow" : "outline"}
                  className="w-full h-12 text-xs font-bold gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Get Started with {plan.name}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl glass-panel p-8 sm:p-12 text-center relative overflow-hidden border border-indigo-500/30 glow-primary">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to Design Your Dream Space?
            </h2>
            <p className="text-slate-300 text-sm">
              Join over 120,000+ happy homeowners, stagers, and architects creating stunning rooms
              with DecorHome AI.
            </p>
            <div className="pt-2">
              <Link href="/login?mode=signup">
                <Button size="lg" variant="gradient" className="h-12 px-8 text-sm font-bold gap-2 shadow-xl">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Claim 5 Free Redesigns Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 text-center text-xs text-slate-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} DecorHome AI Architectural Technologies. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Studio Workspace
          </Link>
          <button onClick={() => setIsPricingModalOpen(true)} className="hover:text-white transition-colors">
            Stripe & Razorpay Billing
          </button>
          <span className="hover:text-white transition-colors cursor-pointer">
            Privacy Policy
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Terms of Service
          </span>
        </div>
      </footer>

      {/* Pricing Modal Component */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}
