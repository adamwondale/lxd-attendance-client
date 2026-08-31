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

export default function DashboardOverviewContent() {
  const { data, loading, error, refetch } = useQuery(DASHBOARD_METRICS)

  useSubscription(ON_COHORTS_UPDATED, { onData: () => refetch() })
  useSubscription(ON_STUDENTS_UPDATED, { onData: () => refetch() })

  if (loading) return <div className="animate-pulse bg-black/5 h-64 rounded-xl mt-8"></div>
  if (error) return <div className="text-red-500 mt-8">Failed to load metrics.</div>

  const metrics = data?.dashboardMetrics

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
        {[
          ['Active Cohorts', metrics?.activeCohorts || 0, 'Currently running', ''],
          ['Total Students', metrics?.totalStudents || 0, 'Across active cohorts', ''],
          ['Present Today', metrics?.presentToday || 0, 'Checked in', 'text-emerald-600'],
          ['Late Today', metrics?.lateToday || 0, 'Arrived after grace', 'text-amber-600'],
          ['Absent Today', metrics?.absentToday || 0, 'No check-in recorded', 'text-red-600'],
          ["Today's Penalties", `${metrics?.todayRevenue?.toFixed(2) || '0.00'} ETB`, 'Calculated automatically', 'text-[var(--color-accent)]'],
        ].map(([title, value, caption, valueClass]) => (
          <Card key={String(title)} className="surface-lift rounded-2xl border-black/5 bg-white/90">
            <CardHeader className="pb-2"><CardTitle className="text-[11px] uppercase tracking-widest text-[var(--color-muted)]">{title}</CardTitle></CardHeader>
            <CardContent><div className={`text-3xl font-semibold tracking-tight ${valueClass}`}>{value}</div><p className="text-xs text-[var(--color-muted)] mt-2">{caption}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-8 border-t border-[var(--color-border)] mt-8">
        <Link href="/dashboard/cohorts">
          <Button>Manage Cohorts</Button>
        </Link>
      </div>
    </>
  )
}
