"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowRight, Loader2 } from "lucide-react"
import { LoginInput } from "@/components/auth/LoginInput"
import { LoginPageShell } from "@/components/auth/LoginPageShell"

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "Email or password is incorrect.",
  Default: "Something went wrong. Try again.",
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F8]" />}>
      <AdminLoginContent />
    </Suspense>
  )
}

function AdminLoginContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const urlError = searchParams.get("error")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.includes("@")) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    try {
      const result = await signIn("admin-credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default)
        return
      }

      toast.success("Signed in. Welcome back.")
      window.location.href = "/dashboard"
    } catch {
      setError(AUTH_ERRORS.Default)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginPageShell
      eyebrow="Administrator portal"
      title="LXD Attendance"
      subtitle="Manage cohorts, students, attendance, reports, and the live scanning system."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/admin/signup" className="text-[#1C1C1C] hover:underline underline-offset-4">
            Create company account
          </Link>
        </>
      }
    >
      {(urlError || error) && (
        <div className="mb-4 p-3 border border-[#E54D2E] bg-[#E54D2E]/5">
          <p className="font-mono text-[11px] text-[#E54D2E] uppercase tracking-wide">
            {error || AUTH_ERRORS[urlError ?? ""] || AUTH_ERRORS.Default}
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <LoginInput
            id="admin-email"
            label="Admin email"
            type="email"
            placeholder="coordinator@lxd.co"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <LoginInput
            id="admin-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </motion.div>

        <button
          type="submit"
          disabled={loading}
          className="button w-full h-11 flex items-center justify-center gap-2 bg-[#E54D2E] text-[#F9F9F8] font-sans font-medium text-[14px] border border-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-[#1f1f1f]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in as admin</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </LoginPageShell>
  )
}
