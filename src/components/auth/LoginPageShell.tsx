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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted mb-3">
            {eyebrow}
          </p>
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-secondary">
            {title}
          </h1>
          <p className="font-sans text-[13px] leading-relaxed text-muted mt-3 max-w-[340px]">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
          className="bg-surface border border-border"
        >
          <div className="p-6">{children}</div>
          <div className="p-4 text-center font-sans text-[13px] text-muted border-t border-border bg-background">
            {footer}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
          className="font-mono text-[11px] uppercase tracking-widest text-muted/50 text-center mt-4"
        >
          Hulu Track · {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  )
}
