import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardOverviewContent from "./DashboardOverviewContent";

export default async function DashboardOverview() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const userRole = (session.user as { role?: string } | undefined)?.role;

  if (userRole === "STUDENT") {
    redirect("/dashboard/student");
  }

  if (userRole !== "ADMIN") {
    redirect("/admin/login");
  }
  return (
    <div className="p-10">
      <div>
        <h1 className="font-serif text-4xl mb-2">Overview</h1>
        <p className="font-mono text-[13px] text-muted uppercase">
          Active System Status
        </p>
      </div>

      <DashboardOverviewContent />
    </div>
  );
}
