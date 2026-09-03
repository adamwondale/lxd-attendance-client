"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, Loader2 } from "lucide-react"
import { LoginInput } from "@/components/auth/LoginInput"
import { LoginPageShell } from "@/components/auth/LoginPageShell"

const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const role = searchParams.get("role") === "ADMIN" ? "ADMIN" : "STUDENT"
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [resetPassword] = useMutation(RESET_PASSWORD)

  if (!token) {
    return (
      <LoginPageShell
        eyebrow="Password Recovery"
        title="Invalid Link"
        subtitle="This password reset link is invalid or missing the secure token."
        footer={
          <Link href={`/${role.toLowerCase()}/login`} className="text-foreground hover:underline underline-offset-4">
            Return to login
          </Link>
        }
      >
        <div />
      </LoginPageShell>
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await resetPassword({ variables: { token, newPassword: password, role } })
      toast.success("Password updated successfully! Please sign in.")
      router.push(`/${role.toLowerCase()}/login`)
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginPageShell
      eyebrow="Password Recovery"
      title="Create new password"
      subtitle="Enter a strong new password for your account."
      footer={
        <Link href={`/${role.toLowerCase()}/login`} className="text-foreground hover:underline underline-offset-4">
          Cancel and return to login
        </Link>
      }
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 border border-danger/30 bg-danger-surface rounded-none"
        >
          <p className="font-mono text-[11px] text-danger uppercase tracking-wide">
            {error}
          </p>
        </motion.div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <LoginInput
          id="new-password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(v) => { setPassword(v); setError("") }}
        />
        <LoginInput
          id="confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); setError("") }}
        />

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="button mt-2 w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-medium text-[14px] border border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-primary-hover rounded-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Save new password</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </LoginPageShell>
  )
}
