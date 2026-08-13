"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  MoveHorizontal,
  Maximize2,
  Minimize2,
  Download,
  Columns,
  SplitSquareVertical,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BeforeAfterSliderProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  roomType?: string;
  designStyle?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImageUrl,
  generatedImageUrl,
  roomType = "Room",
  designStyle = "Modern",
  className = "",
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"split" | "sideBySide">("split");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Drag / Touch Movement
  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      let position = (x / width) * 100;
      if (position < 0) position = 0;
      if (position > 100) position = 100;
      setSliderPosition(position);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed, opening image directly:", err);
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden glass-panel shadow-2xl transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none bg-slate-950 flex flex-col justify-center items-center p-4"
          : className
      }`}
    >
      {/* Top Toolbar */}
      <div className="w-full flex items-center justify-between p-3 px-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            {designStyle}
          </Badge>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {roomType}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Split Comparison Slider"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Wipe Slider</span>
            </button>
            <button
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "sideBySide"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Side-by-Side Comparison"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Side by Side</span>
            </button>
          </div>

          {/* Download Generated Image */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
            onClick={() =>
              handleDownload(
                generatedImageUrl,
                `DecorHome-${roomType.replace(/\s+/g, "-")}-${designStyle.replace(/\s+/g, "-")}.png`
              )
            }
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save HD</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Image Container */}
      {viewMode === "split" ? (
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] md:aspect-[16/10] select-none overflow-hidden cursor-ew-resize group"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches.length > 0) handleMove(e.touches[0].clientX);
          }}
        >
          {/* Background: Generated / After Design (Full view) */}
          <img
            src={generatedImageUrl}
            alt="AI Redesigned Interior"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />

          {/* Badge: Redesigned Label */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/90 text-white backdrop-blur-md shadow-lg flex items-center gap-1.5 border border-indigo-400/40">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI Redesign
            </span>
          </div>

          {/* Foreground: Original Photo (Clipped by slider percentage) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImageUrl}
              alt="Original Room Before"
              className="absolute inset-0 w-full h-full object-cover object-center max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                height: containerRef.current ? `${containerRef.current.clientHeight}px` : "100%",
              }}
            />
            {/* Badge: Original Room Label */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 text-slate-200 backdrop-blur-md shadow-lg border border-white/20">
                Original Space
              </span>
            </div>
          </div>

          {/* Draggable Vertical Divider Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none transition-transform"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            {/* Vertical Line with Glow */}
            <div className="w-0.5 h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />

            {/* Circular Drag Handle */}
            <div className="absolute w-10 h-10 rounded-full bg-slate-900/95 border-2 border-white text-white flex items-center justify-center shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
              <MoveHorizontal className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Percentage Tag */}
            <div className="absolute bottom-4 bg-slate-900/85 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
              {Math.round(sliderPosition)}%
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/60">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-lg group">
            <img
              src={originalImageUrl}
              alt="Original Space"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-xs font-medium px-2.5 py-1 rounded-md text-slate-200 border border-white/10">
              Original Room
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-indigo-500/30 shadow-lg glow-primary group">
            <img
              src={generatedImageUrl}
              alt="AI Redesign"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-md text-white flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI Redesign
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between p-3 px-4 bg-slate-900/90 border-t border-white/10 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Drag the center handle or use keys to inspect architectural transformations.</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          SDXL Lightning &bull; Depth ControlNet &bull; 8K Raytraced
        </div>
      </div>
    </div>
  );
};
