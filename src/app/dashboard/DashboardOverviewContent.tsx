"use client"

import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const DASHBOARD_METRICS = gql`
  query DashboardMetrics {
    dashboardMetrics {
      activeCohorts
      totalStudents
      presentToday
      absentToday
      lateToday
      todayRevenue
    }
  }
`

type DashboardMetricsData = { dashboardMetrics: { activeCohorts: number; totalStudents: number; presentToday: number; absentToday: number; lateToday: number; todayRevenue: number } }

const ON_COHORTS_UPDATED = gql`
  subscription OnCohortsUpdated {
    onCohortsUpdated
  }
`

const ON_STUDENTS_UPDATED = gql`
  subscription OnStudentsUpdated {
    onStudentsUpdated
  }
`

const ON_ATTENDANCE_UPDATED = gql`
  subscription OnAttendanceUpdated {
    onAttendanceUpdated
  }
`

export default function DashboardOverviewContent() {
  const { data, loading, error, refetch } = useQuery<DashboardMetricsData>(DASHBOARD_METRICS, { fetchPolicy: "cache-and-network" })

  useSubscription(ON_COHORTS_UPDATED, { onData: () => refetch() })
  useSubscription(ON_STUDENTS_UPDATED, { onData: () => refetch() })
  useSubscription(ON_ATTENDANCE_UPDATED, { onData: () => refetch() })

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-surface border shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-3 w-20 bg-surface-subtle rounded-xl animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-surface-subtle rounded-xl animate-pulse"></div>
              <div className="h-3 w-32 bg-surface-subtle rounded-xl mt-3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  if (error) return <div className="text-danger mt-8 font-mono text-sm">Failed to load metrics.</div>

  const metrics = data?.dashboardMetrics

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
        {[
          ['Active Cohorts', metrics?.activeCohorts || 0, 'Currently running', 'text-foreground', '/dashboard/cohorts'],
          ['Total Students', metrics?.totalStudents || 0, 'Across active cohorts', 'text-foreground', '/dashboard/students'],
          ['Present Today', metrics?.presentToday || 0, 'Checked in', 'text-success', '/dashboard/attendance'],
          ['Late Today', metrics?.lateToday || 0, 'Arrived after grace', 'text-amber-500', '/dashboard/attendance'],
          ['Absent Today', metrics?.absentToday || 0, 'No check-in recorded', 'text-danger', '/dashboard/attendance'],
          ["Today's Penalties", `${metrics?.todayRevenue?.toFixed(2) || '0.00'} ETB`, 'Calculated automatically', 'text-danger', '/dashboard/reports'],
        ].map(([title, value, caption, valueClass, href]) => (
          <Link
            key={String(title)}
            href={String(href)}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`Open ${String(title)} details`}
          >
            <Card className="glass-surface glass-interactive h-full border shadow-sm cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] uppercase tracking-widest text-muted font-mono">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-semibold tracking-tight font-serif ${valueClass}`}>{value}</div>
                <p className="text-xs text-muted mt-2 font-sans">{caption}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-8 border-t border-border mt-8">
        <Link href="/dashboard/cohorts">
          <Button>Manage Cohorts</Button>
        </Link>
      </div>
    </>
  )
}
