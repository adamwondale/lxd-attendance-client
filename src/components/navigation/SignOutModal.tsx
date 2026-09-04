"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Modal } from "@/components/ui/modal"
import { LogOut, Loader2 } from "lucide-react"

interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
  isStudent?: boolean
}

export function SignOutModal({
  isOpen,
  onClose,
  isStudent = false,
}: SignOutModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut({
        callbackUrl: isStudent ? "/student/login" : "/admin/login",
      })
    } catch {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} className="sm:max-w-md">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
          <div className="w-11 h-11 border border-danger/30 bg-danger-surface rounded-2xl flex items-center justify-center flex-shrink-0 text-danger shadow-sm">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-foreground mb-1.5">Sign Out</h3>
            <p className="text-[13px] text-muted font-sans leading-relaxed">
              Are you sure you want to sign out of your Hulu Track session? You will need to sign back in to access your dashboard.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 border border-border bg-surface text-foreground font-mono text-[12px] uppercase tracking-wider hover:bg-surface-hover transition-all rounded-xl order-2 sm:order-1 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="flex-1 h-11 bg-danger text-danger-foreground font-mono text-[12px] uppercase tracking-wider hover:bg-danger/90 transition-all rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2 active:scale-[0.98] shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <span>Sign out</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
