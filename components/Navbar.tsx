"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Sparkles,
  Zap,
  User,
  LogOut,
  Layers,
  ChevronDown,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingModal } from "@/components/PricingModal";
import { createClient } from "@/lib/supabase";
import { UserProfile } from "@/types";

interface NavbarProps {
  initialUser?: any;
  initialProfile?: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({ initialUser, initialProfile }) => {
  const [user, setUser] = useState<any>(initialUser || null);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes safely
    const fetchUserAndProfile = async () => {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (isMounted) {
          setUser(currentUser);
        }

        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (userProfile && isMounted) {
          setProfile(userProfile);
        }
      } catch (err) {
        console.warn("Supabase auth check bypassed (running in guest/demo mode):", err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      }
    };

    fetchUserAndProfile();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserAndProfile();
        } else {
          setProfile(null);
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                DecorHome <span className="gradient-text">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 block font-mono">
                Architectural Studio
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Workspace
            </Link>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Pricing & Plans
            </button>
            <Link href="/#gallery" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Styles Gallery
            </Link>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Live Credits Badge */}
                <div
                  onClick={() => setIsPricingOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition-all shadow-inner group"
                  title="Click to recharge credits"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {profile?.credits ?? 5} Credits
                  </span>
                  <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-300" />
                    Top up
                  </Badge>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown p-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2 border-b border-white/10">
                        <p className="font-semibold text-white truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                          <Shield className="w-3 h-3 text-indigo-400" />
                          <span className="capitalize">{profile?.subscription_tier || "free"} Plan</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                          Workspace Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsPricingOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Upgrade Credits
                        </button>
                      </div>

                      <div className="pt-1 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login?mode=signup">
                  <Button variant="gradient" size="sm" className="text-xs gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Get 5 Free Redesigns
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        userEmail={user?.email}
        currentTier={profile?.subscription_tier || "free"}
      />
    </>
  );
};
