"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Calendar, ArrowRight, Layers, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Generation } from "@/types";

interface GalleryHistoryProps {
  generations: Generation[];
  onSelectGeneration: (gen: Generation) => void;
  selectedId?: string;
}

export const GalleryHistory: React.FC<GalleryHistoryProps> = ({
  generations,
  onSelectGeneration,
  selectedId,
}) => {
  if (!generations || generations.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-8 text-center text-slate-400 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-white">No Generations Yet</h4>
        <p className="text-xs max-w-sm mx-auto">
          Upload an empty or existing room photo above and select your design style to generate your
          first photorealistic transformation!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Your Generation History</h3>
          <Badge variant="secondary" className="text-xs">
            {generations.length} renders
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map((gen) => {
          const isSelected = selectedId === gen.id;
          const formattedDate = new Date(gen.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={gen.id}
              onClick={() => onSelectGeneration(gen)}
              className={`group relative rounded-xl overflow-hidden glass-card cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg glow-primary scale-[1.02]"
                  : "border-white/10 hover:border-white/25 hover:scale-[1.01]"
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <img
                  src={gen.generated_image_url}
                  alt={gen.room_type}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Badges on preview */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <Badge variant="purple" className="text-[10px] px-2 py-0.5">
                    {gen.room_type}
                  </Badge>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate font-medium">{gen.metadata?.designStyle || "Modern"}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{formattedDate}</span>
                </div>
              </div>

              {/* Hover overlay indicator */}
              <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Compare & Estimate
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
