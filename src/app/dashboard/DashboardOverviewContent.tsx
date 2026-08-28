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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans tracking-tight">{metrics?.activeCohorts || 0}</div>
            <p className="text-sm text-[var(--color-muted)] mt-1">Currently running sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans tracking-tight">{metrics?.totalStudents || 0}</div>
            <p className="text-sm text-[var(--color-muted)] mt-1">Across all active cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans tracking-tight text-[var(--color-accent)]">{metrics?.todayRevenue?.toFixed(2) || "0.00"} ETB</div>
            <p className="text-sm text-[var(--color-muted)] mt-1">From late penalties</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-8 border-t border-[var(--color-border)] mt-8">
        <Link href="/dashboard/cohorts">
          <Button>Manage Cohorts</Button>
        </Link>
      </div>
    </>
  )
}
