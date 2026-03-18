import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "terminal";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:terminal-glow hover:border-primary": variant === "default",
            "border border-primary/30 bg-transparent hover:bg-primary/10 text-primary": variant === "outline",
            "hover:bg-primary/10 hover:text-primary text-muted-foreground": variant === "ghost",
            "bg-destructive/20 text-destructive-foreground hover:bg-destructive/40 border border-destructive/50": variant === "destructive",
            "bg-black text-primary font-mono border border-primary hover:bg-primary hover:text-black uppercase tracking-widest": variant === "terminal",
            
            "h-12 px-6 py-3 min-w-[48px] min-h-[48px]": size === "default", // iPad optimized targets
            "h-9 rounded-md px-3": size === "sm",
            "h-14 rounded-lg px-8 text-base": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
