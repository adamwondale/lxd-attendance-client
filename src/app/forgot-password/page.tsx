"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { LoginInput } from "@/components/auth/LoginInput"
import { LoginPageShell } from "@/components/auth/LoginPageShell"

const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!, $role: String!) {
    forgotPassword(email: $email, role: $role)
  }
`

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "ADMIN" ? "ADMIN" : "STUDENT"
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [forgotPassword] = useMutation(FORGOT_PASSWORD)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      await forgotPassword({ variables: { email: email.trim(), role } })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to request password reset. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <LoginPageShell
        eyebrow="Password Recovery"
        title="Check your email"
        subtitle={`If an account exists for ${email}, we have sent password reset instructions.`}
        footer={
          <Link href={`/${role.toLowerCase()}/login`} className="text-foreground hover:underline underline-offset-4">
            Return to login
          </Link>
        }
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="w-16 h-16 bg-success-surface border border-success/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-muted text-[14px]">
            You can safely close this window. Check your inbox (and spam folder) for the reset link.
          </p>
        </motion.div>
      </LoginPageShell>
    )
  }

  return (
    <LoginPageShell
      eyebrow={`${role === "ADMIN" ? "Administrator" : "Student"} portal`}
      title="Forgot password?"
      subtitle="Enter the email address associated with your account, and we'll send you a link to reset your password."
      footer={
        <Link href={`/${role.toLowerCase()}/login`} className="text-foreground hover:underline underline-offset-4">
          Back to login
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
          id="recovery-email"
          label="Email address"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(v) => { setEmail(v); setError("") }}
        />

        <button
          type="submit"
          disabled={loading || !email}
          className="button mt-2 w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-medium text-[14px] border border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-primary-hover rounded-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send reset link</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </LoginPageShell>
  )
}
