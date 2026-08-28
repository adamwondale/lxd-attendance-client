import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardOverviewContent from "./DashboardOverviewContent"

export default async function DashboardOverview() {
  const session = await auth()
  if (session?.user?.role === "STUDENT") {
    redirect("/dashboard/student")
  }
  return (
    <div className="p-10">
      <div>
        <h1 className="font-serif text-4xl mb-2">Overview</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Active System Status</p>
      </div>

      <DashboardOverviewContent />
    </div>
  )
}
