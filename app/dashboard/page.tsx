"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sliders,
  Maximize2,
  Wand2,
  Download,
  Info,
  ChevronDown,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { CostEstimator } from "@/components/CostEstimator";
import { GalleryHistory } from "@/components/GalleryHistory";
import { PricingModal } from "@/components/PricingModal";
import { ROOM_TYPES } from "@/lib/constants/roomTypes";
import { DESIGN_STYLES } from "@/lib/constants/designStyles";
import { createClient } from "@/lib/supabase";
import { Generation, UserProfile } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User and Billing state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Form Configuration state
  const [selectedRoomType, setSelectedRoomType] = useState<string>(ROOM_TYPES[0].label);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string>(DESIGN_STYLES[0].name);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Upload & Image state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [activeGeneration, setActiveGeneration] = useState<Generation | null>(null);
  const [generationsList, setGenerationsList] = useState<Generation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load User, Profile, and Previous Generations
  const loadUserData = useCallback(async () => {
    try {
      setIsAuthChecking(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        // Allow demo mode or redirect to login
        setUser(null);
        setProfile({
          id: "demo-user",
          email: "guest@decorhome.ai",
          credits: 5,
          subscription_tier: "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setUser(currentUser);
        // Fetch profile
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (userProfile) {
          setProfile(userProfile);
        }

        // Fetch generation history
        const { data: userGenerations } = await supabase
          .from("generations")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (userGenerations && userGenerations.length > 0) {
          setGenerationsList(userGenerations);
          if (!activeGeneration) {
            setActiveGeneration(userGenerations[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setIsAuthChecking(false);
    }
  }, [supabase, activeGeneration]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle File Upload (Drag & Drop or Picker)
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image file size exceeds 15MB limit.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id || "guest"}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage bucket 'home_designs'
      const { data, error } = await supabase.storage
        .from("home_designs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.warn("Storage direct upload error, creating object URL:", error.message);
        // Fallback for offline/development: create object URL
        const localUrl = URL.createObjectURL(file);
        setUploadedImageUrl(localUrl);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("home_designs")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          setUploadedImageUrl(publicUrlData.publicUrl);
        } else {
          const localUrl = URL.createObjectURL(file);
          setUploadedImageUrl(localUrl);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const localUrl = URL.createObjectURL(file);
      setUploadedImageUrl(localUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Trigger Replicate AI Generation
  const handleGenerate = async () => {
    if (!uploadedImageUrl && !activeGeneration?.original_image_url) {
      setErrorMessage("Please upload a room photo first to generate your redesign.");
      return;
    }

    const currentCredits = profile?.credits ?? 0;
    if (currentCredits <= 0) {
      setIsPricingModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStage("Analyzing room geometry & depth map...");

    const targetOriginalUrl = uploadedImageUrl || activeGeneration?.original_image_url || "";

    try {
      // Step 1: Geometry & ControlNet
      const stageTimer1 = setTimeout(() => {
        setGenerationStage("Applying ControlNet depth preservation...");
      }, 1500);

      // Step 2: Texture rendering
      const stageTimer2 = setTimeout(() => {
        setGenerationStage(`Synthesizing ${selectedDesignStyle} architectural textures & lighting...`);
      }, 3500);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: targetOriginalUrl,
          roomType: selectedRoomType,
          designStyle: selectedDesignStyle,
          customPrompt: customPrompt.trim(),
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresUpgrade) {
          setIsPricingModalOpen(true);
        }
        throw new Error(data.error || "Generation request failed.");
      }

      if (data.success && data.generation) {
        setActiveGeneration(data.generation);
        setGenerationsList((prev) => [data.generation, ...prev]);

        // Update credits locally
        if (profile) {
          setProfile({
            ...profile,
            credits: data.remainingCredits ?? profile.credits - 1,
          });
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMessage(err.message || "Failed to generate redesign. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  // Sample room filler for instant testing
  const handleLoadSample = (sampleUrl: string) => {
    setUploadedImageUrl(sampleUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-indigo-400" />
          <h1 className="text-sm font-bold text-white">AI Architectural Studio Workspace</h1>
          <Badge variant="purple" className="text-[10px]">
            SDXL Lightning Fast
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Available Balance:</span>
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-white/10">
              {profile?.credits ?? 5} credits
            </span>
          </div>
          <Button
            size="sm"
            variant="glow"
            onClick={() => setIsPricingModalOpen(true)}
            className="h-7 text-[11px] gap-1 px-3"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start justify-between gap-3 text-red-200 text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration Sidebar (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Upload Section */}
            <div className="rounded-2xl glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">1. Upload Room Photo</h3>
                </div>
                {uploadedImageUrl && (
                  <button
                    onClick={() => {
                      setUploadedImageUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Change photo
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              {!uploadedImageUrl ? (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    isDragOver
                      ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-xs text-slate-300 font-medium">
                        Uploading to secure storage...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2 py-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Click to browse or drag & drop room photo
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Supports high-resolution JPG, PNG, WEBP up to 15MB
                      </p>
                    </div>
                  )}

                  {/* Sample Quick Pick */}
                  <div
                    className="w-full mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-slate-400">Or try sample:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadSample(
                          "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                        )
                      }
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-white/10"
                    >
                      Empty Living Room
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadSample(
                          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
                        )
                      }
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-white/10"
                    >
                      Unfinished Loft
                    </button>
                  </div>
                </div>
              ) : (
                /* Uploaded Thumbnail Preview */
                <div className="relative rounded-xl overflow-hidden border border-white/15 aspect-[16/9] group">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded Room"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace Photo
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold px-2 py-0.5 rounded text-emerald-400 border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Source Photo Ready
                  </div>
                </div>
              )}
            </div>

            {/* 2. Room Type Selector (15 types) */}
            <div className="rounded-2xl glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  2. Select Room Type (15 Available)
                </h3>
                <span className="text-[11px] text-indigo-300 font-medium">
                  {selectedRoomType}
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type.id} value={type.label} className="bg-slate-900 text-white">
                      {type.label} &bull; {type.description}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Design Style Visual Grid (20+ styles) */}
            <div className="rounded-2xl glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  3. Select Design Style (20+ Styles)
                </h3>
                <Badge variant="purple" className="text-[10px]">
                  {selectedDesignStyle}
                </Badge>
              </div>

              {/* Scrollable Visual Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {DESIGN_STYLES.map((style) => {
                  const isSelected = selectedDesignStyle === style.name;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedDesignStyle(style.name)}
                      className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-150 ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500 shadow-lg glow-primary scale-[1.02]"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-900">
                        <img
                          src={style.imageUrl}
                          alt={style.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                          <p className="text-[11px] font-bold text-white leading-tight truncate">
                            {style.name}
                          </p>
                          <span className="text-[9px] text-slate-300 block truncate">
                            {style.tag}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Optional Custom Prompt Refinements */}
            <div className="rounded-2xl glass-panel p-5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                4. Custom Architecture & Material Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Add a fluted marble island, large fiddle leaf fig tree in stone planter, warm dim cove lighting, and bouclé curved lounge chair..."
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Generate Action Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!uploadedImageUrl && !activeGeneration?.original_image_url)}
              variant="gradient"
              className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl glow-primary gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{generationStage || "Generating AI Masterpiece..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Photorealistic Redesign (1 Credit)</span>
                </>
              )}
            </Button>
          </div>

          {/* Right Column: Viewport (Before/After Slider + Cost Estimator) (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Viewport Card */}
            {isGenerating ? (
              /* Loading Skeleton Viewport */
              <div className="rounded-2xl glass-panel p-8 aspect-[4/3] md:aspect-[16/10] flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-2xl animate-pulse">
                  <Wand2 className="w-8 h-8" />
                </div>
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold text-white">{generationStage}</h3>
                  <p className="text-xs text-slate-400">
                    Executing SDXL Lightning Depth ControlNet model. Preserving exact room layout,
                    doors, and windows while rendering new architectural finishes.
                  </p>
                </div>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            ) : activeGeneration ? (
              /* Render Interactive Before/After Split Slider */
              <BeforeAfterSlider
                originalImageUrl={activeGeneration.original_image_url}
                generatedImageUrl={activeGeneration.generated_image_url}
                roomType={activeGeneration.room_type}
                designStyle={activeGeneration.metadata?.designStyle || selectedDesignStyle}
              />
            ) : uploadedImageUrl ? (
              /* Uploaded Image Waiting to be transformed */
              <div className="rounded-2xl glass-panel p-6 aspect-[4/3] md:aspect-[16/10] relative overflow-hidden flex flex-col justify-between">
                <img
                  src={uploadedImageUrl}
                  alt="Source Room"
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90"
                />
                <div className="relative z-10 flex justify-between items-start">
                  <Badge variant="secondary" className="backdrop-blur-md bg-slate-900/80">
                    Original Uploaded Photo
                  </Badge>
                  <span className="text-xs text-indigo-300 font-semibold bg-indigo-950/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-indigo-500/30">
                    Ready to Transform
                  </span>
                </div>
                <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Target Style: {selectedDesignStyle}</h4>
                    <p className="text-[11px] text-slate-400">
                      Click the &ldquo;Generate Photorealistic Redesign&rdquo; button to begin rendering.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    size="sm"
                    variant="gradient"
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Transform Now
                  </Button>
                </div>
              </div>
            ) : (
              /* Default Empty State */
              <div className="rounded-2xl glass-panel p-10 aspect-[4/3] md:aspect-[16/10] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/15">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-white">No Room Selected</h3>
                  <p className="text-xs text-slate-400">
                    Upload a photo of your living room, bedroom, kitchen, or empty floorplan on the
                    left to see the AI redesign in action.
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  Choose Photo
                </Button>
              </div>
            )}

            {/* AI Cost Estimator Section */}
            {activeGeneration && (
              <CostEstimator
                roomType={activeGeneration.room_type}
                designStyle={activeGeneration.metadata?.designStyle || selectedDesignStyle}
                generatedImageUrl={activeGeneration.generated_image_url}
              />
            )}

            {/* Generation History Gallery */}
            <GalleryHistory
              generations={generationsList}
              selectedId={activeGeneration?.id}
              onSelectGeneration={(gen) => {
                setActiveGeneration(gen);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        userEmail={user?.email}
        currentTier={profile?.subscription_tier || "free"}
      />
    </div>
  );
}
