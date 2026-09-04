"use client"

import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

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
          <Card key={i} className="border-border/80 bg-surface/85 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="h-3 w-24 bg-surface-subtle rounded-md animate-pulse"></div>
              <div className="h-6 w-6 rounded-full bg-surface-subtle animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-surface-subtle rounded-md animate-pulse"></div>
              <div className="flex items-center justify-between mt-3 pt-1">
                <div className="h-3 w-28 bg-surface-subtle rounded-md animate-pulse"></div>
                <div className="h-3 w-10 bg-surface-subtle rounded-md animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  if (error) return <div className="text-danger mt-8 font-mono text-sm">Failed to load metrics.</div>

  const metrics = data?.dashboardMetrics

  const statCards = [
    {
      title: 'Active Cohorts',
      value: metrics?.activeCohorts ?? 0,
      caption: 'Currently running',
      valueClass: 'text-foreground',
      href: '/dashboard/cohorts',
      glowClass: 'hover:border-primary/50 hover:shadow-[0_12px_32px_-8px_rgba(54,172,134,0.22)]',
      badgeClass: 'group-hover:bg-primary/15 group-hover:text-primary',
    },
    {
      title: 'Total Students',
      value: metrics?.totalStudents ?? 0,
      caption: 'Across active cohorts',
      valueClass: 'text-foreground',
      href: '/dashboard/students',
      glowClass: 'hover:border-primary/50 hover:shadow-[0_12px_32px_-8px_rgba(54,172,134,0.22)]',
      badgeClass: 'group-hover:bg-primary/15 group-hover:text-primary',
    },
    {
      title: 'Present Today',
      value: metrics?.presentToday ?? 0,
      caption: 'Checked in',
      valueClass: 'text-primary',
      href: '/dashboard/attendance',
      glowClass: 'hover:border-primary/60 hover:shadow-[0_12px_32px_-8px_rgba(54,172,134,0.25)]',
      badgeClass: 'group-hover:bg-primary/15 group-hover:text-primary',
    },
    {
      title: 'Late Today',
      value: metrics?.lateToday ?? 0,
      caption: 'Arrived after grace',
      valueClass: 'text-secondary',
      href: '/dashboard/attendance',
      glowClass: 'hover:border-secondary/60 hover:shadow-[0_12px_32px_-8px_rgba(93,127,155,0.25)]',
      badgeClass: 'group-hover:bg-secondary/15 group-hover:text-secondary',
    },
    {
      title: 'Absent Today',
      value: metrics?.absentToday ?? 0,
      caption: 'No check-in recorded',
      valueClass: 'text-danger',
      href: '/dashboard/attendance',
      glowClass: 'hover:border-danger/60 hover:shadow-[0_12px_32px_-8px_rgba(242,85,51,0.25)]',
      badgeClass: 'group-hover:bg-danger/15 group-hover:text-danger',
    },
    {
      title: "Today's Penalties",
      value: `${metrics?.todayRevenue?.toFixed(2) || '0.00'} ETB`,
      caption: 'Calculated automatically',
      valueClass: 'text-danger',
      href: '/dashboard/reports',
      glowClass: 'hover:border-danger/60 hover:shadow-[0_12px_32px_-8px_rgba(242,85,51,0.25)]',
      badgeClass: 'group-hover:bg-danger/15 group-hover:text-danger',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 select-none"
          >
            <Card
              className={`h-full relative overflow-hidden border-border/80 bg-surface/85 backdrop-blur-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 active:scale-[0.97] active:translate-y-0 active:duration-100 cursor-pointer ${card.glowClass}`}
            >
              {/* Subtle top specular glass light */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[11px] uppercase tracking-widest text-muted font-mono transition-colors duration-200 group-hover:text-foreground">
                  {card.title}
                </CardTitle>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center bg-surface-subtle/70 text-muted/60 transition-all duration-300 ${card.badgeClass}`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-semibold tracking-tight font-serif ${card.valueClass} transition-transform duration-300 group-hover:scale-[1.02] origin-left`}
                >
                  {card.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                  <p className="text-xs text-muted font-sans transition-colors duration-200 group-hover:text-foreground/80">
                    {card.caption}
                  </p>
                  <span className="text-[11px] font-mono font-medium text-muted/50 group-hover:text-primary transition-all duration-200 flex items-center gap-0.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                    View &rarr;
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-8 border-t border-border mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Link href="/dashboard/cohorts" className="w-full sm:w-auto">
          <Button variant="default" className="w-full sm:w-auto justify-center">Manage Cohorts</Button>
        </Link>
        <Link href="/dashboard/attendance" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto justify-center border-border hover:bg-surface-hover">Live Attendance Log</Button>
        </Link>
      </div>
    </>
  )
}
