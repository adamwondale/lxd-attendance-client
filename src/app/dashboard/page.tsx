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
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl mb-2 text-foreground">Overview</h1>
        <p className="font-mono text-[12px] sm:text-[13px] text-muted uppercase tracking-wider">
          Active System Status
        </p>
      </div>

      <DashboardOverviewContent />
    </div>
  );
}
