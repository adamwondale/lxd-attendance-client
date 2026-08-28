import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles: Inline flex, centered, strict typography, 0px radius, active scaling
          "inline-flex items-center justify-center whitespace-nowrap text-[14px] font-medium leading-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 button rounded-[var(--radius-none)]",
          "h-10 px-4 py-2",
          
          // Variants
          variant === "default" && "bg-[var(--color-primary)] text-[var(--color-surface)] hover:bg-[#1f1f1f]",
          variant === "outline" && "border border-[var(--color-border)] bg-transparent hover:bg-black/5",
          variant === "ghost" && "hover:bg-black/5 hover:text-[var(--color-text)]",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
