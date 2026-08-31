"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type ActiveNavLinkProps = React.ComponentProps<typeof Link>

export function ActiveNavLink({ href, className, children, ...props }: ActiveNavLinkProps) {
  const pathname = usePathname()
  const hrefString = typeof href === "string" ? href : href.pathname || ""
  const isActive =
    hrefString === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === hrefString || pathname.startsWith(`${hrefString}/`)

  const classes = [
    typeof className === "string" ? className : "",
    "relative",
    isActive ? "bg-black/8 text-black" : "",
  ].filter(Boolean).join(" ")

  return (
    <Link
      href={href}
      className={classes}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-black"
        />
      )}
    </Link>
  )
}
