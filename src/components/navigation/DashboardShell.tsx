"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  LayoutDashboard,
  LogOut,
  Calendar,
  GraduationCap,
  Scan,
  FileBarChart2,
  UserCircle,
  Home,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { ActiveNavLink } from "@/components/navigation/ActiveNavLink"
import { ProjectorLauncher } from "@/components/ProjectorLauncher"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SignOutProvider, useSignOutModal } from "@/components/navigation/SignOutContext"
import { ProjectorProvider } from "@/components/projector/ProjectorContext"

interface DashboardShellProps {
  children: React.ReactNode
  isStudent: boolean
}

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/cohorts", label: "Cohorts", icon: Users },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap },
  { href: "/dashboard/attendance", label: "Attendance", icon: Calendar },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart2 },
  { href: "/dashboard/scan", label: "Scan Badge", icon: Scan },
]

const STUDENT_NAV_ITEMS = [
  { href: "/dashboard/student", label: "Home", icon: Home },
  { href: "/dashboard/student/cohorts", label: "Cohorts", icon: Users },
  { href: "/dashboard/student/scan", label: "Scan Badge", icon: Scan },
  { href: "/dashboard/student/profile", label: "Profile", icon: UserCircle },
]

function getPageTitle(pathname: string, isStudent: boolean): string {
  if (isStudent) {
    if (pathname === "/dashboard/student") return "Student Home"
    if (pathname.startsWith("/dashboard/student/cohorts")) return "Cohorts"
    if (pathname.startsWith("/dashboard/student/scan")) return "Scan Badge"
    if (pathname.startsWith("/dashboard/student/profile")) return "Profile"
    return "Dashboard"
  }
  if (pathname === "/dashboard") return "Overview"
  if (pathname.startsWith("/dashboard/cohorts")) return "Cohorts"
  if (pathname.startsWith("/dashboard/students")) return "Students"
  if (pathname.startsWith("/dashboard/attendance")) return "Attendance Logs"
  if (pathname.startsWith("/dashboard/reports")) return "Reports & Analytics"
  if (pathname.startsWith("/dashboard/scan")) return "Scan Badge"
  return "Dashboard"
}

function DashboardShellContent({ children, isStudent }: DashboardShellProps) {
  const pathname = usePathname()
  const { openSignOut } = useSignOutModal()

  // Sidebar collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard_sidebar_collapsed")
      if (saved !== null) {
        setIsCollapsed(saved === "true")
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("dashboard_sidebar_collapsed", String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  // Auto-close mobile drawer on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = isStudent ? STUDENT_NAV_ITEMS : ADMIN_NAV_ITEMS
  const pageTitle = getPageTitle(pathname, isStudent)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-foreground">
      {/* Ambient Brand Atmospheric Lighting */}
      <div
        className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 rounded-full bg-[#36AC86]/10 blur-[100px] dark:bg-[#36AC86]/8 z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#4D6C84]/12 blur-[100px] dark:bg-[#4D6C84]/10 z-0"
        aria-hidden="true"
      />

      {/* Desktop Collapsible Sidebar (Liquid Glass) */}
      <aside
        className={`hidden md:flex flex-col border-r border-border/80 bg-surface/80 backdrop-blur-xl z-20 shrink-0 sticky top-0 h-screen transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div
          className={`h-14 border-b border-border/70 flex items-center shrink-0 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href={isStudent ? "/dashboard/student" : "/dashboard"}
            className="flex items-center gap-2.5 overflow-hidden"
            title="Hulu Track Home"
          >
            <Image
              src="/hulu7.svg"
              alt="Hulu Track Logo"
              width={26}
              height={26}
              className="shrink-0 drop-shadow-sm"
              priority
            />
            {!isCollapsed && (
              <span className="font-serif text-lg font-semibold tracking-tight text-foreground truncate">
                Hulu Track
                {isStudent && (
                  <span className="font-sans text-[10px] font-mono uppercase text-muted ml-1.5 border border-border px-1.5 py-0.5 rounded-md">
                    Student
                  </span>
                )}
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <ActiveNavLink
                key={item.href}
                href={item.href}
                hideIndicator={isCollapsed}
                title={isCollapsed ? item.label : undefined}
                className={
                  isCollapsed
                    ? "flex items-center justify-center w-full h-10 rounded-xl"
                    : "flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </ActiveNavLink>
            )
          })}

          <div className="pt-4 border-t border-border/60 mt-4 space-y-1">
            {!isStudent && <ProjectorLauncher collapsed={isCollapsed} />}

            {isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar"
                className="flex items-center justify-center w-full h-10 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={openSignOut}
              title="Sign out"
              className={`flex items-center text-muted hover:text-danger hover:bg-danger-surface transition-colors cursor-pointer active:scale-[0.98] ${
                isCollapsed
                  ? "justify-center w-full h-10 rounded-xl"
                  : "space-x-3 w-full px-3 py-2 rounded-xl font-medium text-[14px]"
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area + Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Dashboard Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-surface/85 backdrop-blur-xl border-b border-border/80 px-4 sm:px-6 flex items-center justify-between">
          {/* Header Left Area */}
          <div className="flex items-center gap-3">
            {/* Admin Hamburger Button (Smaller screens) */}
            {!isStudent && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Brand Title */}
            <div className="flex items-center gap-2 md:hidden">
              <Image
                src="/hulu7.svg"
                alt="Hulu Track Logo"
                width={22}
                height={22}
                className="shrink-0 drop-shadow-sm"
              />
              <h1 className="font-serif text-lg tracking-tight text-foreground truncate">
                Hulu Track
                {isStudent ? (
                  <span className="font-sans text-[10px] font-mono text-muted uppercase ml-1.5 border border-border px-1 py-0.5 rounded">
                    Student
                  </span>
                ) : (
                  <span className="font-sans text-[10px] font-mono text-primary uppercase ml-1.5 border border-primary/30 bg-primary/10 px-1 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </h1>
            </div>

            {/* Desktop Page Title / Breadcrumb context */}
            <div className="hidden md:flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                {isStudent ? "Student Portal" : "Admin Workspace"}
              </span>
              <span className="text-border">/</span>
              <span className="font-serif text-base font-medium text-foreground">
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Header Right Area: Theme button and Signout button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={openSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-surface hover:bg-danger-surface hover:border-danger/30 hover:text-danger text-muted transition-all duration-150 text-xs font-mono uppercase tracking-wider active:scale-[0.97] cursor-pointer shadow-sm"
              title="Sign out of your account"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 overflow-auto w-full relative bg-transparent ${
            isStudent ? "pb-20 md:pb-0" : "pb-6 md:pb-0"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Admin Mobile Hamburger Drawer (Slide-over for smaller screens) */}
      {!isStudent && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-surface/95 backdrop-blur-2xl border-r border-border/80 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-border/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/hulu7.svg"
                  alt="Hulu Track Logo"
                  width={24}
                  height={24}
                  className="shrink-0 drop-shadow-sm"
                />
                <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  Hulu Track
                  <span className="font-sans text-[10px] font-mono text-primary uppercase ml-1.5 border border-primary/30 bg-primary/10 px-1 py-0.5 rounded">
                    Admin
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Nav Items */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted px-2 pt-1 pb-1">
                Navigation
              </p>
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <ActiveNavLink
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-[14px]"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </ActiveNavLink>
                )
              })}

              <div className="pt-3 border-t border-border/70 mt-3">
                <ProjectorLauncher />
              </div>
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border/70 bg-surface-subtle/50 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Appearance</span>
                <ThemeToggle />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  openSignOut()
                }}
                className="w-full flex items-center justify-center gap-2 h-10 border border-danger/30 bg-danger-surface text-danger rounded-xl font-mono text-xs uppercase tracking-wider hover:bg-danger/15 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Mobile Bottom Navigation (Liquid Glass - 4 spacious tabs) */}
      {isStudent && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/85 backdrop-blur-xl border-t border-border/80 flex items-center justify-around z-50">
          <ActiveNavLink
            href="/dashboard/student"
            className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium tracking-wide">Home</span>
          </ActiveNavLink>
          <ActiveNavLink
            href="/dashboard/student/cohorts"
            className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
          </ActiveNavLink>
          <ActiveNavLink
            href="/dashboard/student/scan"
            className="flex flex-col items-center justify-center w-full h-full text-foreground hover:text-foreground transition-colors focus:text-foreground border-l border-border/50 relative"
          >
            <div className="absolute -top-5 bg-gradient-to-tr from-[#2A9E80] to-[#36AC86] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background active:scale-95 transition-transform">
              <Scan className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium tracking-wide mt-5">Scan</span>
          </ActiveNavLink>
          <ActiveNavLink
            href="/dashboard/student/profile"
            className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
          >
            <UserCircle className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </ActiveNavLink>
        </nav>
      )}
    </div>
  )
}

export function DashboardShell({ children, isStudent }: DashboardShellProps) {
  return (
    <SignOutProvider isStudent={isStudent}>
      <ProjectorProvider>
        <DashboardShellContent isStudent={isStudent}>
          {children}
        </DashboardShellContent>
      </ProjectorProvider>
    </SignOutProvider>
  )
}
