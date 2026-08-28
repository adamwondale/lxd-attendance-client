"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"

// ------------------------------------------------------------------
// Animation constants — --ease-studio curve, all durations < 300ms
// ------------------------------------------------------------------
const EASE = [0.23, 1, 0.32, 1] as const

const formItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: EASE, delay: i * 0.05 },
  }),
}

const errorVariants = {
  hidden:  { opacity: 0, y: -6, height: 0 },
  visible: { opacity: 1, y: 0,  height: "auto", transition: { duration: 0.2,  ease: EASE } },
  exit:    { opacity: 0, y: -4, height: 0,      transition: { duration: 0.15, ease: EASE } },
}

const tabVariants = {
  hidden:  { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: EASE } },
}

// Auth.js error codes → human readable (strict, active voice — per frontend-design skill)
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:  "Email or password is incorrect.",
  OAuthSignin:        "Google sign-in failed. Try again.",
  OAuthCallback:      "Google sign-in failed. Try again.",
  OAuthAccountNotLinked: "This Google account is not linked to a student record.",
  Default:            "Something went wrong. Try again.",
}

// ------------------------------------------------------------------
// StudioInput
// ------------------------------------------------------------------
function StudioInput({
  id, label, type = "text", placeholder,
  value, onChange, error, autoComplete,
}: {
  id: string; label: string; type?: string; placeholder?: string
  value: string; onChange: (v: string) => void; error?: string; autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full h-11 px-3 ${isPassword ? "pr-10" : ""}
            bg-[#F9F9F8] border
            text-[14px] font-sans text-[#1C1C1C] placeholder:text-[#878786]/60
            outline-none
            transition-[border-color] duration-[150ms]
            focus:border-[#0A0A0A]
            ${error ? "border-[#E54D2E]" : "border-[#E5E5E4]"}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(p => !p)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878786] hover:text-[#1C1C1C] transition-colors duration-[150ms]"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error} variants={errorVariants} initial="hidden" animate="visible" exit="exit"
            className="font-mono text-[11px] text-[#E54D2E] uppercase tracking-wide overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ------------------------------------------------------------------
// Admin Login — Credentials provider
// ------------------------------------------------------------------
function AdminLoginForm() {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; form?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email.includes("@"))   e.email    = "Enter a valid email address."
    if (password.length < 6)    e.password = "Password must be at least 6 characters."
    return e
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)

    const result = await signIn("admin-credentials", {
      email,
      password,
      redirect: false, // handle redirect ourselves
    })

    setLoading(false)

    if (result?.error) {
      setErrors({ form: AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default })
      return
    }

    toast.success("Signed in. Welcome back.")
    window.location.href = "/dashboard"
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
        <StudioInput
          id="admin-email" label="Email" type="email"
          placeholder="coordinator@lxd.co" autoComplete="email"
          value={email} onChange={setEmail} error={errors.email}
        />
      </motion.div>

      <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
        <StudioInput
          id="admin-password" label="Password" type="password"
          placeholder="••••••••" autoComplete="current-password"
          value={password} onChange={setPassword} error={errors.password}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {errors.form && (
          <motion.p
            key="form-err" variants={errorVariants} initial="hidden" animate="visible" exit="exit"
            className="font-mono text-[11px] text-[#E54D2E] uppercase tracking-wide overflow-hidden"
          >
            {errors.form}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
        <button
          type="submit"
          disabled={loading}
          className="button w-full h-11 flex items-center justify-center gap-2 bg-[#E54D2E] text-[#F9F9F8] font-sans font-medium text-[14px] border border-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-[#1f1f1f]"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><span>Sign in as admin</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </motion.div>
    </form>
  )
}

// ------------------------------------------------------------------
// Student Login — Google provider via Auth.js
// ------------------------------------------------------------------
function StudentLoginForm() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    // Auth.js handles the full OAuth redirect — no client ID needed here
    await signIn("google", { callbackUrl: "/dashboard" })
    // (page will redirect; loading stays true until navigation)
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
        <p className="font-sans text-[14px] text-[#878786] leading-relaxed">
          Students sign in with their Google account. Your attendance record is tied to your verified identity.
        </p>
      </motion.div>

      <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="button w-full h-11 flex items-center justify-center gap-3 border border-[#E5E5E4] bg-[#FFFFFF] text-[#1C1C1C] font-sans font-medium text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-[#F9F9F8]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {/* Google G icon — inline SVG to avoid any external deps */}
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
      </motion.div>

      <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
        <p className="font-mono text-[11px] text-[#878786]/60 uppercase tracking-widest text-center">
          Students only — coordinators use the Admin tab
        </p>
      </motion.div>
    </div>
  )
}

// ------------------------------------------------------------------
// Tab switcher
// ------------------------------------------------------------------
type Tab = "admin" | "student"

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "admin",   label: "Admin" },
    { id: "student", label: "Student" },
  ]
  return (
    <div className="relative flex border-b border-[#E5E5E4]">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`
            relative flex-1 py-3 font-mono text-[12px] uppercase tracking-widest
            transition-colors duration-[150ms]
            ${active === t.id ? "text-[#0A0A0A]" : "text-[#878786] hover:text-[#1C1C1C]"}
          `}
        >
          {t.label}
        </button>
      ))}
      {/* Sliding underline — same element moves for spatial consistency */}
      <motion.div
        layout layoutId="tab-underline"
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="absolute bottom-0 h-[2px] bg-[#0A0A0A]"
        style={{ left: active === "admin" ? "0%" : "50%", width: "50%" }}
      />
    </div>
  )
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F8]" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [tab, setTab] = useState<Tab>("admin")
  const searchParams  = useSearchParams()

  // Auth.js passes ?error= on failure — show it as a toast on mount
  const urlError = searchParams.get("error")

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-8"
        >
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-[#0A0A0A]">
            LXD Attendance
          </h1>
        </motion.div>

        {/* URL-level auth error (e.g. from OAuth callback) */}
        <AnimatePresence>
          {urlError && (
            <motion.div
              variants={errorVariants} initial="hidden" animate="visible" exit="exit"
              className="mb-4 p-3 border border-[#E54D2E] bg-[#E54D2E]/5"
            >
              <p className="font-mono text-[11px] text-[#E54D2E] uppercase tracking-wide">
                {AUTH_ERRORS[urlError] ?? AUTH_ERRORS.Default}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
          className="bg-[#FFFFFF] border border-[#E5E5E4]"
        >
          <TabBar active={tab} onChange={setTab} />

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab} variants={tabVariants}
                initial="hidden" animate="visible" exit="exit"
              >
                {tab === "admin" ? <AdminLoginForm /> : <StudentLoginForm />}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="p-4 text-center font-sans text-[13px] text-[#878786] border-t border-[#E5E5E4] bg-[#F9F9F8]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#1C1C1C] hover:underline underline-offset-4">
              Sign Up
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
          className="font-mono text-[11px] uppercase tracking-widest text-[#878786]/50 text-center mt-6"
        >
          LXD Design Studio · {new Date().getFullYear()}
        </motion.p>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
        }
      `}</style>
    </div>
  )
}
