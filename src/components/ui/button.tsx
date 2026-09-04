import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "glass" | "brand"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-[14px] font-medium leading-none ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 button active:scale-[0.97]",
          "h-10 px-4 py-2 rounded-xl transition-all duration-150",
          
          // Variants
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
          variant === "brand" && "bg-gradient-to-r from-[#2A9E80] to-[#4D6C84] text-white hover:opacity-95 shadow-md shadow-primary/20",
          variant === "glass" && "backdrop-blur-xl bg-surface/70 border border-border/80 text-foreground hover:bg-surface shadow-sm",
          variant === "outline" && "border border-border/80 bg-surface/80 backdrop-blur-md text-foreground hover:bg-surface-hover shadow-sm",
          variant === "ghost" && "hover:bg-surface-hover text-foreground",
          variant === "danger" && "bg-danger text-danger-foreground hover:opacity-90 shadow-sm",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
