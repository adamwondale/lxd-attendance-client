import Image from "next/image";
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
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ActiveNavLink } from "@/components/navigation/ActiveNavLink";
import { ProjectorLauncher } from "@/components/ProjectorLauncher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/student/login");
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  const isStudent = role === "STUDENT";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-foreground">
      {/* Ambient Brand Atmospheric Lighting */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 rounded-full bg-[#36AC86]/10 blur-[100px] dark:bg-[#36AC86]/8 z-0" aria-hidden="true" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#4D6C84]/12 blur-[100px] dark:bg-[#4D6C84]/10 z-0" aria-hidden="true" />

      {/* Desktop Sidebar (Liquid Glass) */}
      <aside className="hidden md:flex w-64 border-r border-border/80 bg-surface/80 backdrop-blur-xl flex-col z-20 shrink-0">
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <Image
              src="/hulu7.svg"
              alt="Hulu Track Logo"
              width={26}
              height={26}
              className="shrink-0 drop-shadow-sm"
              priority
            />
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Hulu Track{isStudent && <span className="font-sans text-xs font-mono uppercase text-muted ml-1.5">Student</span>}
            </span>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-3 flex flex-col space-y-1">
          {isStudent ? (
            <>
              <ActiveNavLink
                href="/dashboard/student"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/cohorts"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Users className="w-4 h-4" />
                <span>Cohorts</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/scan"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Scan className="w-4 h-4" />
                <span>Scan Badge</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <UserCircle className="w-4 h-4" />
                <span>Profile</span>
              </ActiveNavLink>
            </>
          ) : (
            <>
              <ActiveNavLink
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/cohorts"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Users className="w-4 h-4" />
                <span>Cohorts</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/students"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Students</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/attendance"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Calendar className="w-4 h-4" />
                <span>Attendance</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/reports"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <FileBarChart2 className="w-4 h-4" />
                <span>Reports</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/scan"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-[14px]"
              >
                <Scan className="w-4 h-4" />
                <span>Scan Badge</span>
              </ActiveNavLink>
            </>
          )}

          <div className="mt-auto flex flex-col space-y-2 pt-8">
            {!isStudent && <ProjectorLauncher />}

            <a
              href="/api/auth/signout"
              className="flex items-center space-x-3 px-3 py-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover font-medium text-[14px] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Mobile Top Header (only visible on mobile) */}
      <header className="md:hidden h-14 flex items-center justify-between px-5 bg-surface/85 backdrop-blur-xl border-b border-border/80 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Image
            src="/hulu7.svg"
            alt="Hulu Track Logo"
            width={22}
            height={22}
            className="shrink-0 drop-shadow-sm"
          />
          <h1 className="font-serif text-lg tracking-tight text-foreground">
            Hulu Track{isStudent && <span className="font-sans text-[11px] font-mono text-muted ml-1 uppercase">Student</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="/api/auth/signout"
            className="text-muted hover:text-foreground transition-colors p-1"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 w-full relative bg-transparent">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Liquid Glass) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/85 backdrop-blur-xl border-t border-border/80 flex items-center justify-around z-50">
        {isStudent ? (
          <>
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
          </>
        ) : (
          <>
            <ActiveNavLink
              href="/dashboard"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground"
            >
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Home</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/cohorts"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/reports"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
            >
              <FileBarChart2 className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Reports</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/scan"
              className="flex flex-col items-center justify-center w-full h-full text-foreground hover:text-foreground transition-colors focus:text-foreground border-l border-border/50 relative"
            >
              <div className="absolute -top-5 bg-gradient-to-tr from-[#2A9E80] to-[#36AC86] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background active:scale-95 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide mt-5">Scan</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/attendance"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Logs</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/students"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-foreground transition-colors focus:text-foreground border-l border-border/50"
            >
              <GraduationCap className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">
                Students
              </span>
            </ActiveNavLink>
          </>
        )}
      </nav>
    </div>
  );
}
