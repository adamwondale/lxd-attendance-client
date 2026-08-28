"use client"

import { use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const COHORT_DETAILS = gql`
  query CohortDetails($id: String!) {
    cohortDetails(id: $id) {
      id
      name
      pin
    }
  }
`

const ATTENDANCE_LOGGED = gql`
  subscription AttendanceLogged($sessionId: String!) {
    attendanceLogged(sessionId: $sessionId)
  }
`

const GET_ATTENDANCE_LOGS = gql`
  query GetAttendanceLogs($cohortId: String) {
    getAttendanceLogs(cohortId: $cohortId) {
      id
      scannedAt
      isLate
      user {
        name
      }
      penalty {
        amount
      }
    }
  }
`

export default function CohortLiveView({ params }: { params: Promise<{ cohortId: string }> }) {
  const unwrappedParams = use(params)
  const { data: cohortData, loading: cohortLoading } = useQuery(COHORT_DETAILS, { variables: { id: unwrappedParams.cohortId } })
  
  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useQuery(GET_ATTENDANCE_LOGS, {
    variables: { cohortId: unwrappedParams.cohortId },
    fetchPolicy: "network-only"
  })

  useSubscription(ATTENDANCE_LOGGED, {
    variables: { sessionId: unwrappedParams.cohortId },
    onData: () => refetchLogs()
  })

  if (cohortLoading) return <div className="p-10">Loading session...</div>

  const logs = logsData?.getAttendanceLogs || []

  return (
    <div className="p-10 space-y-8 relative">
      <div className="mb-4">
        <Link href="/dashboard/cohorts" className="text-sm font-mono uppercase tracking-widest text-[#878786] hover:text-black flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Cohorts
        </Link>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2">{cohortData?.cohortDetails?.name || "Live Session"}</h1>
          <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Listening for scans...
          </p>
        </div>
        <div className="flex gap-4">
          <Link href={`/scan/projector?sessionId=${unwrappedParams.cohortId}`}>
            <Button className="bg-black text-white hover:bg-black/80">Launch Projector</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-[var(--color-border)]">
          <div className="grid grid-cols-4 text-[13px] font-mono text-[var(--color-muted)] uppercase">
            <div>Name</div>
            <div>Status</div>
            <div>Time</div>
            <div>Penalty</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-[var(--color-border)]">
            <AnimatePresence initial={false}>
              {logs.map((log: any) => (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, y: -20, backgroundColor: "#f0fdf4" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    backgroundColor: { duration: 1, ease: "easeOut" }
                  }}
                  className="grid grid-cols-4 p-4 items-center"
                >
                  <div className="font-medium">{log.user.name}</div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-[12px] font-mono uppercase border ${
                      log.isLate 
                        ? 'border-[var(--color-accent)] text-[var(--color-accent)]' 
                        : 'border-green-600 text-green-700'
                    }`}>
                      {log.isLate ? 'Late' : 'Present'}
                    </span>
                  </div>
                  <div className="text-[var(--color-muted)] text-sm">{new Date(log.scannedAt).toLocaleTimeString()}</div>
                  <div className="text-[var(--color-accent)] text-sm">{log.penalty ? `${log.penalty.amount} ETB` : "-"}</div>
                </motion.li>
              ))}
            </AnimatePresence>
            {!logsLoading && logs.length === 0 && (
              <li className="p-8 text-center text-[var(--color-muted)] font-mono text-[13px] uppercase">
                No scans recorded yet
              </li>
            )}
            {logsLoading && (
              <li className="p-8 text-center text-[var(--color-muted)] font-mono text-[13px] uppercase">
                Loading...
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
