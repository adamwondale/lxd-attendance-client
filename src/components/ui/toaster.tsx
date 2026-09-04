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
            "group toast group-[.toaster]:bg-surface/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-surface-subtle group-[.toast]:text-foreground",
          error:
            "group-[.toaster]:bg-danger-surface group-[.toaster]:text-danger group-[.toaster]:border-danger [&>svg]:text-danger",
          success:
            "group-[.toaster]:bg-success-surface group-[.toaster]:text-success group-[.toaster]:border-success [&>svg]:text-success",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
