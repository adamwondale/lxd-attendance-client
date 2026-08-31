import Link from "next/link"
import { motion } from "framer-motion"

const EASE = [0.23, 1, 0.32, 1] as const

export function LoginPageShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#878786] mb-3">
            {eyebrow}
          </p>
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-[#0A0A0A]">
            {title}
          </h1>
          <p className="font-sans text-[13px] leading-relaxed text-[#878786] mt-3 max-w-[340px]">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
          className="bg-[#FFFFFF] border border-[#E5E5E4]"
        >
          <div className="p-6">{children}</div>
          <div className="p-4 text-center font-sans text-[13px] text-[#878786] border-t border-[#E5E5E4] bg-[#F9F9F8]">
            {footer}
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Link href="/student/login" className="font-mono text-[10px] uppercase tracking-widest text-[#878786] hover:text-[#0A0A0A] transition-colors">
            Student login
          </Link>
          <span className="text-[#D8D8D6]">·</span>
          <Link href="/admin/login" className="font-mono text-[10px] uppercase tracking-widest text-[#878786] hover:text-[#0A0A0A] transition-colors">
            Admin login
          </Link>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
          className="font-mono text-[11px] uppercase tracking-widest text-[#878786]/50 text-center mt-4"
        >
          LXD Design Studio · {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  )
}
