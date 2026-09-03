"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, Loader2 } from "lucide-react"

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}) {
  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-16 sm:bottom-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[4px] pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                onClose()
              }
            }}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`pointer-events-auto relative w-full bg-surface border border-border shadow-2xl sm:max-w-lg max-h-full sm:max-h-[90vh] flex flex-col rounded-t-none sm:rounded-none overflow-hidden ${className}`}
          >
            {/* Mobile drag handle indicator */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing shrink-0" onClick={onClose}>
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-4 sm:pt-6 pb-5 border-b border-border flex-shrink-0">
      <div>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">
            {subtitle}
          </p>
        )}
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors rounded-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto flex-1 p-6 overscroll-contain bg-surface text-foreground ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-border bg-surface-subtle flex flex-col sm:flex-row gap-3 flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "destructive",
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: "destructive" | "default"
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-sm">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
          {variant === "destructive" && (
            <div className="w-10 h-10 border border-danger/30 bg-danger-surface flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          )}
          <div>
            <h3 className="font-serif text-xl mb-2 text-foreground">{title}</h3>
            <div className="text-[13px] text-muted font-sans leading-relaxed">
              {description}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-14 border border-border bg-surface text-foreground font-mono text-[13px] uppercase tracking-widest hover:bg-surface-hover transition-colors rounded-none order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-14 font-mono text-[13px] uppercase tracking-widest disabled:opacity-50 transition-colors rounded-none flex items-center justify-center gap-2 order-1 sm:order-2 ${
              variant === "destructive" ? "bg-danger text-danger-foreground hover:opacity-90" : "bg-primary text-primary-foreground hover:bg-primary-hover"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
