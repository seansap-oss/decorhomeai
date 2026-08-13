import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient" | "glow";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variantStyles = {
      default: "bg-indigo-600 text-white shadow hover:bg-indigo-500 hover:shadow-indigo-500/25",
      destructive: "bg-red-600 text-white shadow-sm hover:bg-red-500",
      outline: "border border-white/15 bg-white/5 backdrop-blur-sm text-foreground hover:bg-white/10 hover:border-white/25",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
      ghost: "hover:bg-white/10 text-slate-200 hover:text-white",
      link: "text-indigo-400 underline-offset-4 hover:underline",
      gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-indigo-500/30 hover:opacity-95 font-semibold",
      glow: "bg-indigo-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] hover:bg-indigo-500 font-semibold",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
