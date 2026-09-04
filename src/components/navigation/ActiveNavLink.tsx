"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type ActiveNavLinkProps = React.ComponentProps<typeof Link> & {
  activeClassName?: string;
  inactiveClassName?: string;
  hideIndicator?: boolean;
}

export function ActiveNavLink({ href, className, activeClassName, inactiveClassName, hideIndicator, children, ...props }: ActiveNavLinkProps) {
  const pathname = usePathname()
  const hrefString = typeof href === "string" ? href : href.pathname || ""
  const isDashboardRoot = hrefString === "/dashboard" || hrefString === "/dashboard/student"
  const isActive = isDashboardRoot
      ? pathname === hrefString
      : pathname === hrefString || pathname.startsWith(`${hrefString}/`)

  const classes = [
    typeof className === "string" ? className : "",
    "relative transition-all duration-150 active:scale-[0.98]",
    isActive ? (activeClassName || "bg-primary/10 text-primary font-medium rounded-xl") : (inactiveClassName || "text-muted hover:text-foreground hover:bg-surface-hover rounded-xl"),
  ].filter(Boolean).join(" ")

  return (
    <Link
      href={href}
      className={classes}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
      {isActive && !hideIndicator && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary"
        />
      )}
    </Link>
  )
}
