"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function LoginInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full h-11 px-3 ${isPassword ? "pr-10" : ""} bg-surface border text-[14px] font-sans text-foreground placeholder:text-muted/50 outline-none transition-[border-color] duration-[150ms] focus:border-foreground rounded-none ${error ? "border-danger" : "border-border"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors duration-[150ms]"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="font-mono text-[11px] text-danger uppercase tracking-wide mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
