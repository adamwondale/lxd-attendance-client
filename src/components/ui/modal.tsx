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
            className={`pointer-events-auto relative w-full bg-white border border-[#E5E5E4] shadow-2xl sm:max-w-lg max-h-full sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden ${className}`}
          >
            {/* Mobile drag handle indicator */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing shrink-0" onClick={onClose}>
              <div className="w-12 h-1.5 bg-[#E5E5E4] rounded-full" />
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
    <div className="flex items-start justify-between px-6 pt-4 sm:pt-6 pb-5 border-b border-[#E5E5E4] flex-shrink-0">
      <div>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#878786] mb-1">
            {subtitle}
          </p>
        )}
        <h2 className="font-serif text-2xl text-[#0A0A0A]">{title}</h2>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 flex items-center justify-center text-[#878786] hover:text-[#0A0A0A] hover:bg-[#F9F9F8] transition-colors rounded-xl"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto flex-1 p-6 overscroll-contain ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-[#E5E5E4] bg-[#F9F9F8] flex flex-col sm:flex-row gap-3 flex-shrink-0 ${className}`}>
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
            <div className="w-10 h-10 border border-[#E54D2E]/30 bg-[#E54D2E]/5 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <AlertTriangle className="w-5 h-5 text-[#E54D2E]" />
            </div>
          )}
          <div>
            <h3 className="font-serif text-xl mb-2">{title}</h3>
            <div className="text-[13px] text-[#878786] font-sans leading-relaxed">
              {description}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-14 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[13px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-xl order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-14 text-white font-mono text-[13px] uppercase tracking-widest disabled:opacity-50 transition-colors rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2 ${
              variant === "destructive" ? "bg-[#E54D2E] hover:bg-[#c73d20]" : "bg-[#0A0A0A] hover:bg-[#1C1C1C]"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
