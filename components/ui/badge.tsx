import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "gold" | "purple";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    secondary: "border-transparent bg-slate-800 text-slate-300",
    destructive: "border-transparent bg-red-500/20 text-red-300 border border-red-500/30",
    outline: "text-foreground border border-white/20",
    success: "border-transparent bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    gold: "border-transparent bg-amber-500/20 text-amber-300 border border-amber-500/30",
    purple: "border-transparent bg-purple-500/20 text-purple-300 border border-purple-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
