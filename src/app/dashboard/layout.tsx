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
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 border-r border-border bg-surface flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="font-serif text-2xl tracking-tight">Hulu Track{isStudent && " Student"}</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col space-y-2">
          {isStudent ? (
            <>
              <ActiveNavLink
                href="/dashboard/student"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/cohorts"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Cohorts</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/scan"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <Scan className="w-4 h-4" />
                <span>Scan Badge</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/student/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                <span>Profile</span>
              </ActiveNavLink>
            </>
          ) : (
            <>
              <ActiveNavLink
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/cohorts"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Cohorts</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/students"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Students</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/attendance"
                className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Attendance</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/reports"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
              >
                <FileBarChart2 className="w-4 h-4" />
                <span>Reports</span>
              </ActiveNavLink>
              <ActiveNavLink
                href="/dashboard/scan"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
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
              className="flex items-center space-x-3 px-3 py-2 rounded-(--radius-none) text-muted hover:text-black hover:bg-black/5 font-medium text-[14px] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Mobile Top Header (only visible on mobile) */}
      <header className="md:hidden h-14 flex items-center justify-between px-6 bg-surface border-b border-border sticky top-0 z-40">
        <h1 className="font-serif text-xl tracking-tight">Hulu Track{isStudent && " Student"}</h1>
        <a
          href="/api/auth/signout"
          className="text-muted hover:text-black transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 w-full relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-50">
        {isStudent ? (
          <>
            <ActiveNavLink
              href="/dashboard/student"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black"
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Home</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/student/cohorts"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/student/scan"
              className="flex flex-col items-center justify-center w-full h-full text-text hover:text-black transition-colors focus:text-black border-l border-black/5 relative"
            >
              <div className="absolute -top-6 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide mt-5">Scan</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/student/profile"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
            >
              <UserCircle className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Profile</span>
            </ActiveNavLink>
          </>
        ) : (
          <>
            <ActiveNavLink
              href="/dashboard"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black"
            >
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Home</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/cohorts"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/reports"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
            >
              <FileBarChart2 className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Reports</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/scan"
              className="flex flex-col items-center justify-center w-full h-full text-text hover:text-black transition-colors focus:text-black border-l border-black/5 relative"
            >
              <div className="absolute -top-6 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide mt-5">Scan</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/attendance"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">Logs</span>
            </ActiveNavLink>
            <ActiveNavLink
              href="/dashboard/students"
              className="flex flex-col items-center justify-center w-full h-full text-muted hover:text-black transition-colors focus:text-black border-l border-black/5"
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
