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
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-none",
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
