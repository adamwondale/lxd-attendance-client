"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--color-surface)] group-[.toaster]:text-[var(--color-text)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-none group-[.toaster]:rounded-[var(--radius-none)]",
          description: "group-[.toast]:text-[var(--color-muted)]",
          actionButton:
            "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-[var(--color-surface)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-muted)] group-[.toast]:text-[var(--color-background)]",
          error:
            "group-[.toaster]:bg-[#E54D2E]/5 group-[.toaster]:text-[#E54D2E] group-[.toaster]:border-[#E54D2E] [&>svg]:text-[#E54D2E]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
