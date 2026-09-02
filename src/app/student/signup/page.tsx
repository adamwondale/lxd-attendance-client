"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"

const ACTIVE_COHORTS = gql`
  query PublicActiveCohorts { 
    publicActiveCohorts { 
      id 
      name 
      sessions { id name startTime } 
    } 
  }
`

const studentSignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().regex(/^\+?[0-9\s\-()]{9,15}$/, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  cohortId: z.string().optional(),
  sessionId: z.string().optional(),
  cohortPin: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.cohortId) {
    if (!data.sessionId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Session is required", path: ["sessionId"] })
    }
    if (!data.cohortPin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PIN is required", path: ["cohortPin"] })
    }
  }
})

type SignupFormValues = z.infer<typeof studentSignupSchema>

export default function StudentSignupPage() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState("")
  const { data: cohortData } = useQuery(ACTIVE_COHORTS)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(studentSignupSchema),
    mode: "onChange",
  })

  const selectedCohortId = watch("cohortId")

  const handleCohortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("cohortId", e.target.value, { shouldValidate: true })
    setValue("sessionId", "", { shouldValidate: true })
    setValue("cohortPin", "", { shouldValidate: true })
  }

  const onSubmit = async (data: SignupFormValues) => {
    setGlobalError("")
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:9000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation RegisterStudent($email: String!, $password: String!, $name: String!, $phone: String!, $username: String!, $cohortId: String, $sessionId: String, $cohortPin: String) {
              registerStudent(email: $email, password: $password, name: $name, phone: $phone, username: $username, cohortId: $cohortId, sessionId: $sessionId, cohortPin: $cohortPin)
            }
          `,
          variables: {
            ...data,
            cohortId: data.cohortId || undefined,
            sessionId: data.sessionId || undefined,
            cohortPin: data.cohortPin || undefined
          }
        })
      })

      const json = await res.json()
      if (json.errors) throw new Error(json.errors[0].message || "Registration failed")

      const login = await signIn("student-credentials", {
        identifier: data.username,
        password: data.password,
        redirect: false
      })

      if (login?.error) {
        setGlobalError("Account created, but automatic login failed. Please sign in.")
      } else {
        router.push("/dashboard/student")
      }
    } catch (err: any) {
      setGlobalError(err.message || "Network error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-secondary font-sans selection:bg-secondary selection:text-surface overflow-y-auto">
      <div className="w-full max-w-[440px] my-auto py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif leading-tight">Join Hulu Track</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-widest mt-2">Student Registration</p>
        </div>

        {/* Form Container */}
        <div className="bg-surface border border-border p-8 rounded-none shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-primary/10 border border-primary/20 text-primary text-sm flex gap-3 items-start rounded-none"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="mt-0.5">{globalError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">Full Name</label>
                <input
                  {...register("name")}
                  className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                    errors.name ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                  }`}
                />
                {errors.name && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                    {errors.name.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">Username</label>
                <input
                  {...register("username")}
                  className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                    errors.username ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                  }`}
                />
                {errors.username && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                    {errors.username.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">Email Address</label>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                    errors.email ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                  }`}
                />
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">Phone Number</label>
                <input
                  type="tel"
                  maxLength={15}
                  {...register("phone", {
                    onChange: (e) => { e.target.value = e.target.value.replace(/[^\d+]/g, '') }
                  })}
                  className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                    errors.phone ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                  }`}
                />
                {errors.phone && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                    {errors.phone.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">Password</label>
                <input
                  type="password"
                  {...register("password")}
                  className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                    errors.password ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                  }`}
                />
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-[11px] uppercase tracking-widest font-mono text-muted mb-4">Cohort Assignment (Optional)</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <select
                      {...register("cohortId")}
                      onChange={handleCohortChange}
                      className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none ${
                        errors.cohortId ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                      }`}
                    >
                      <option value="">Select Cohort</option>
                      {(cohortData?.publicActiveCohorts || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCohortId && (
                    <>
                      <div>
                        <select
                          {...register("sessionId")}
                          className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none ${
                            errors.sessionId ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                          }`}
                        >
                          <option value="">Select Session</option>
                          {(cohortData?.publicActiveCohorts?.find((c: any) => c.id === selectedCohortId)?.sessions || []).map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name} · {s.startTime}</option>
                          ))}
                        </select>
                        {errors.sessionId && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                            {errors.sessionId.message}
                          </motion.p>
                        )}
                      </div>
                      <div>
                        <input
                          type="password"
                          {...register("cohortPin")}
                          placeholder="Cohort PIN"
                          className={`w-full h-[44px] px-3 bg-background border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 ${
                            errors.cohortPin ? "border-primary focus:border-primary" : "border-border focus:border-secondary"
                          }`}
                        />
                        {errors.cohortPin && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-widest font-mono text-primary mt-2">
                            {errors.cohortPin.message}
                          </motion.p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (isDirty && !isValid)}
              className="w-full h-[48px] bg-secondary text-surface rounded-none hover:bg-secondary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-8 tracking-widest"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CREATE ACCOUNT</span>}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[13px] text-muted mt-8">
          Already have an account? <Link href="/student/login" className="text-secondary font-medium hover:underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
