import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-[14px] font-medium leading-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 button",
          "h-10 px-4 py-2 rounded-none transition-colors",
          
          // Variants
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary-hover",
          variant === "outline" && "border border-border bg-surface text-foreground hover:bg-surface-hover",
          variant === "ghost" && "hover:bg-surface-hover text-foreground",
          variant === "danger" && "bg-danger text-danger-foreground hover:opacity-90",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
