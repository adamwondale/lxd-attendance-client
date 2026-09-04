import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/navigation/DashboardShell";

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
    <DashboardShell isStudent={isStudent}>
      {children}
    </DashboardShell>
  );
}
