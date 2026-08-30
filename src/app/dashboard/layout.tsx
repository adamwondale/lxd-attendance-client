import { Users, LayoutDashboard, QrCode, LogOut, Calendar, GraduationCap, Scan, FileBarChart2, Building2 } from "lucide-react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role

  if (role === "STUDENT") {
    // ------------------------------------------------------------------
    // Student Layout — Mobile-First with Bottom Navigation
    // ------------------------------------------------------------------
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-background)] pb-16">
        {/* Minimal Top Header */}
        <header className="h-14 flex items-center justify-center px-6 bg-[var(--color-surface)]">
          <h1 className="font-serif text-xl tracking-tight">LXD Student</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[var(--color-border)] flex items-center justify-around z-50">
          <Link href="/dashboard/student" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black focus:outline-none group">
            <QrCode className="w-5 h-5 mb-1 group-active:scale-95 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">ID Card</span>
          </Link>
          <Link href="/dashboard/student/cohorts" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black focus:outline-none group border-l border-r border-black/5">
            <Users className="w-5 h-5 mb-1 group-active:scale-95 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
          </Link>
          <Link href="/dashboard/student/profile" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black focus:outline-none group">
            <LogOut className="w-5 h-5 mb-1 group-active:scale-95 transition-transform" />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </Link>
        </nav>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Admin Layout — Responsive sidebar & mobile bottom nav
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-background)]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
          <h1 className="font-serif text-2xl tracking-tight">LXD Studio</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </Link>
          <Link href="/dashboard/cohorts" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <Users className="w-4 h-4" />
            <span>Cohorts</span>
          </Link>
          <Link href="/dashboard/students" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <GraduationCap className="w-4 h-4" />
            <span>Students</span>
          </Link>
          <Link href="/dashboard/attendance" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Attendance</span>
          </Link>
          <Link href="/dashboard/reports" className="flex items-center space-x-3 px-3 py-2 rounded-xl text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <FileBarChart2 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
          <Link href="/dashboard/scan" className="flex items-center space-x-3 px-3 py-2 rounded-xl text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
            <Scan className="w-4 h-4" />
            <span>Scan Badge</span>
          </Link>
          <div className="mt-auto flex flex-col space-y-2 pt-8">
            <Link href="/scan/projector" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-text)] hover:bg-black/5 font-medium text-[14px] transition-colors">
              <QrCode className="w-4 h-4" />
              <span>Launch Projector</span>
            </Link>
            <a href="/api/auth/signout" className="flex items-center space-x-3 px-3 py-2 rounded-[var(--radius-none)] text-[var(--color-muted)] hover:text-black hover:bg-black/5 font-medium text-[14px] transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Mobile Top Header (only visible on mobile) */}
      <header className="md:hidden h-14 flex items-center justify-between px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <h1 className="font-serif text-xl tracking-tight">LXD Studio</h1>
        <a href="/api/auth/signout" className="text-[var(--color-muted)] hover:text-black transition-colors">
          <LogOut className="w-5 h-5" />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 w-full relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[var(--color-border)] flex items-center justify-around z-50">
        <Link href="/dashboard" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black">
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </Link>
        <Link href="/dashboard/cohorts" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black border-l border-black/5">
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Cohorts</span>
        </Link>
        <Link href="/dashboard/reports" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black border-l border-black/5">
          <FileBarChart2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Reports</span>
        </Link>
        <Link href="/dashboard/scan" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-text)] hover:text-black transition-colors focus:text-black border-l border-black/5 relative">
          <div className="absolute -top-6 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-[var(--color-background)]">
            <Scan className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium tracking-wide mt-5">Scan</span>
        </Link>
        <Link href="/dashboard/attendance" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black border-l border-black/5">
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Logs</span>
        </Link>
        <Link href="/dashboard/students" className="flex flex-col items-center justify-center w-full h-full text-[var(--color-muted)] hover:text-black transition-colors focus:text-black border-l border-black/5">
          <GraduationCap className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Students</span>
        </Link>
      </nav>
    </div>
  )
}
