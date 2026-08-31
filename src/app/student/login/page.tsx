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
  CredentialsSignin: "Email/username or password is incorrect.",
  OAuthSignin: "Google sign-in failed. Try again.",
  OAuthCallback: "Google sign-in failed. Try again.",
  OAuthAccountNotLinked: "This Google account is not linked to a student record.",
  Default: "Something went wrong. Try again.",
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F8]" />}>
      <StudentLoginContent />
    </Suspense>
  )
}

function StudentLoginContent() {
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const urlError = searchParams.get("error")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (!identifier.trim()) {
      setError("Enter your email or username.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    const result = await signIn("student-credentials", {
      identifier: identifier.trim(),
      password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default)
      return
    }

    toast.success("Signed in. Welcome.")
    window.location.href = "/dashboard/student"
  }

  const googleSignIn = async () => {
    setError("")
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/dashboard/student" })
  }

  return (
    <LoginPageShell
      eyebrow="Student portal"
      title="LXD Attendance"
      subtitle="Sign in to view your attendance, cohorts, profile, and student QR information."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#1C1C1C] hover:underline underline-offset-4">
            Student Sign Up
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
        <LoginInput
          id="student-identifier"
          label="Email or username"
          placeholder="your@email.com"
          autoComplete="username"
          value={identifier}
          onChange={setIdentifier}
        />
        <LoginInput
          id="student-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="button w-full h-11 flex items-center justify-center gap-2 bg-[#0A0A0A] text-white font-sans font-medium text-[14px] border border-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-[#2a2a2a]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in as student</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-[#E5E5E4]" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#878786]">or</span>
        <div className="h-px flex-1 bg-[#E5E5E4]" />
      </div>

      <button
        type="button"
        onClick={googleSignIn}
        disabled={loading || googleLoading}
        className="button w-full h-11 flex items-center justify-center gap-3 border border-[#E5E5E4] bg-[#FFFFFF] text-[#1C1C1C] font-sans font-medium text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-[#F9F9F8]"
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.36 5.36 0 0 1-8.01-2.82H.96v2.32A8.99 8.99 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.03 10.74a5.31 5.31 0 0 1 0-3.47V4.95H.96a9 9 0 0 0 0 8.1l2.07-2.31Z"/>
              <path fill="#EA4335" d="M9 3.58a4.87 4.87 0 0 1 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.95L3.03 7.27A5.36 5.36 0 0 1 9 3.58Z"/>
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <p className="font-mono text-[10px] text-[#878786]/60 uppercase tracking-widest text-center mt-4">
        Students only · coordinators use Admin login
      </p>
    </LoginPageShell>
  )
}
