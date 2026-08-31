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
  error,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
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
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full h-11 px-3 ${isPassword ? "pr-10" : ""} bg-[#F9F9F8] border text-[14px] font-sans text-[#1C1C1C] placeholder:text-[#878786]/60 outline-none transition-[border-color] duration-[150ms] focus:border-[#0A0A0A] ${error ? "border-[#E54D2E]" : "border-[#E5E5E4]"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878786] hover:text-[#1C1C1C] transition-colors duration-[150ms]"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="font-mono text-[11px] text-[#E54D2E] uppercase tracking-wide mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
