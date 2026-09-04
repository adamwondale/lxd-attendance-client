"use client";

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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { ActiveNavLink } from "@/components/navigation/ActiveNavLink";
import { ProjectorLauncher } from "@/components/ProjectorLauncher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignOutButton } from "@/components/auth/SignOutButton";

type DashboardShellProps = {
  children: React.ReactNode;
  isStudent: boolean;
};

/**
 * Shared responsive navigation shell.
 *
 * Desktop keeps the existing navigation destinations while allowing the rail
 * to collapse to an icon-only state. Mobile replaces the former bottom bar
 * with the same navigation as a left-side icon rail that can expand on demand.
 */
export function DashboardShell({ children, isStudent }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const widthClass = collapsed ? "md:w-[76px]" : "md:w-64";
  const mobileWidthClass = mobileExpanded ? "w-60" : "w-[72px]";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop navigation: full labels or compact icon rail. */}
      <aside
        className={`hidden md:flex ${widthClass} shrink-0 border-r border-border bg-surface/80 backdrop-blur-xl flex-col transition-[width] duration-[400ms] ${collapsed ? "glass-surface" : "glass-surface"}`}
      >
        <div className={`h-16 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 border-b border-border`}>
          {!collapsed && (
            <h1 className="font-serif text-2xl tracking-tight text-foreground">
              Hulu Track{isStudent && " Student"}
            </h1>
          )}
          <div className="flex items-center gap-1">
            {!collapsed && <ThemeToggle />}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="glass-control w-9 h-9 rounded-xl border border-border bg-surface/70 text-muted hover:text-foreground flex items-center justify-center"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <DashboardNav
          isStudent={isStudent}
          collapsed={collapsed}
          onNavigate={() => undefined}
        />
      </aside>

      {/* Mobile navigation: persistent icon rail replacing the old bottom bar. */}
      <aside
        className={`md:hidden fixed left-0 top-14 bottom-0 z-50 ${mobileWidthClass} glass-surface border-r transition-[width] duration-[400ms] overflow-hidden`}
      >
        <DashboardNav
          isStudent={isStudent}
          collapsed={!mobileExpanded}
          onNavigate={() => setMobileExpanded(false)}
          mobile
        />
      </aside>

      {mobileExpanded && (
        <button
          type="button"
          aria-label="Close mobile sidebar"
          onClick={() => setMobileExpanded(false)}
          className="md:hidden fixed inset-0 top-14 z-40 bg-black/10 backdrop-blur-[1px]"
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="h-14 md:h-16 flex items-center justify-between px-4 sm:px-6 bg-surface/75 backdrop-blur-xl border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileExpanded((value) => !value)}
              className="md:hidden glass-control w-9 h-9 rounded-xl border border-border bg-surface/70 text-muted hover:text-foreground flex items-center justify-center"
              aria-label={mobileExpanded ? "Collapse mobile sidebar" : "Expand mobile sidebar"}
              title={mobileExpanded ? "Collapse menu" : "Open menu"}
            >
              {mobileExpanded ? <PanelLeftClose className="w-4 h-4" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="md:hidden font-serif text-xl tracking-tight text-foreground">
              Hulu Track{isStudent && " Student"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            <div className="hidden md:block">
              <SignOutButton role={isStudent ? "STUDENT" : "ADMIN"} compact />
            </div>
          </div>
        </header>

        {/* Main content keeps a small mobile rail gutter so content remains usable. */}
        <main className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] overflow-auto w-full relative bg-background ml-[72px] md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardNav({
  isStudent,
  collapsed,
  onNavigate,
  mobile = false,
}: {
  isStudent: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  mobile?: boolean;
}) {
  const itemClass = `group flex items-center ${collapsed ? "justify-center" : "gap-3"} w-full px-3 py-2.5 rounded-xl font-medium text-[14px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-hover`;

  return (
    <nav className="flex-1 p-3 flex flex-col min-h-0">
      <div className="space-y-1.5 overflow-y-auto">
        {isStudent ? (
          <>
            <NavItem href="/dashboard/student" label="Home" icon={<Home className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/student/cohorts" label="Cohorts" icon={<Users className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/student/scan" label="Scan Badge" icon={<Scan className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/student/profile" label="Profile" icon={<UserCircle className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
          </>
        ) : (
          <>
            <NavItem href="/dashboard" label="Overview" icon={<LayoutDashboard className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/cohorts" label="Cohorts" icon={<Users className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/students" label="Students" icon={<GraduationCap className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/attendance" label="Attendance" icon={<Calendar className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/reports" label="Reports" icon={<FileBarChart2 className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
            <NavItem href="/dashboard/scan" label="Scan Badge" icon={<Scan className="w-4 h-4 shrink-0" />} collapsed={collapsed} className={itemClass} onNavigate={onNavigate} />
          </>
        )}
      </div>

      <div className="mt-auto pt-5 space-y-2">
        {!isStudent && (
          <div className={collapsed ? "flex justify-center" : ""}>
            <ProjectorLauncher collapsed={collapsed} />
          </div>
        )}

        {/* Sign-out is a confirmation action rather than a direct navigation. */}
        <SignOutButton role={isStudent ? "STUDENT" : "ADMIN"} collapsed={collapsed} />

        {mobile && (
          <p className={`text-[9px] font-mono uppercase tracking-widest text-muted/50 text-center pt-2 ${collapsed ? "hidden" : "block"}`}>
            Menu
          </p>
        )}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  collapsed,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  className: string;
  onNavigate: () => void;
}) {
  return (
    <ActiveNavLink
      href={href}
      className={className}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </ActiveNavLink>
  );
}
