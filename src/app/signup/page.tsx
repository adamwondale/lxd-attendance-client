"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Call Backend GraphQL to Register
      const registerRes = await fetch("http://localhost:9000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation RegisterStudent($email: String!, $password: String!, $name: String!, $phone: String!, $username: String!) {
              registerStudent(email: $email, password: $password, name: $name, phone: $phone, username: $username)
            }
          `,
          variables: formData
        })
      })

      const registerJson = await registerRes.json()

      if (registerJson.errors) {
        setError(registerJson.errors[0].message || "Registration failed")
        setLoading(false)
        return
      }

      // 2. Automatically log the user in
      const res = await signIn("student-credentials", {
        identifier: formData.username,
        password: formData.password,
        redirect: false
      })

      if (res?.error) {
        setError("Account created, but automatic login failed. Please sign in.")
        setLoading(false)
      } else {
        router.push("/dashboard/student")
      }

    } catch (err) {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-8">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-4xl tracking-tight text-[var(--color-text)]">Join LXD</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">
            Student Registration
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-sans">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                name="name"
                type="text"
                required
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="input w-full"
              />
              <input
                name="username"
                type="text"
                required
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="input w-full"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
              />
              <input
                name="phone"
                type="tel"
                required
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="input w-full"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button w-full h-11 bg-black text-white hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center font-sans text-[13px] text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-black hover:underline underline-offset-4">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}
