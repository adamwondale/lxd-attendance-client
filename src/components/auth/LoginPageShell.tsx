import Image from "next/image"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/ui/theme-toggle"

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary/20 selection:text-foreground">
      {/* Ambient Brand Atmospheric Lighting */}
      <div className="pointer-events-none fixed -top-32 -right-32 w-96 h-96 rounded-full bg-[#36AC86]/10 blur-[120px] dark:bg-[#36AC86]/10 z-0" aria-hidden="true" />
      <div className="pointer-events-none fixed -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#4D6C84]/15 blur-[120px] dark:bg-[#4D6C84]/12 z-0" aria-hidden="true" />

      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-8 flex flex-col items-center sm:items-start"
        >
          <div className="mb-4 p-2.5 rounded-2xl bg-surface/80 border border-border/80 backdrop-blur-xl shadow-sm">
            <Image
              src="/hulu7.svg"
              alt="Hulu Track Logo"
              width={38}
              height={38}
              priority
              className="drop-shadow-sm"
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted mb-2">
            {eyebrow}
          </p>
          <h1 className="font-serif text-[38px] leading-[1.05] tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          <p className="font-sans text-[13px] leading-relaxed text-muted mt-2 max-w-[340px]">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
          className="bg-surface/85 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="p-6">{children}</div>
          <div className="p-4 text-center font-sans text-[13px] text-muted border-t border-border/70 bg-surface-subtle/50">
            {footer}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
          className="font-mono text-[11px] uppercase tracking-widest text-muted/50 text-center mt-6"
        >
          Hulu Track · {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  )
}
