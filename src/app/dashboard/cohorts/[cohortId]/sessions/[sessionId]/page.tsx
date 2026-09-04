"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

const SESSION_DETAILS = gql`
  query CohortDetails($id: String!) {
    cohortDetails(id: $id) {
      id
      name
      sessions {
        id
        name
        startTime
        gracePeriodMinutes
      }
    }
  }
`

const ATTENDANCE_LOGGED = gql`
  subscription AttendanceLogged($sessionId: String!) {
    attendanceLogged(sessionId: $sessionId) { id sessionId user { name } scannedAt isLate latenessMinutes calculatedPenalty }
  }
`

const GET_ATTENDANCE_LOGS = gql`
  query GetAttendanceLogs($sessionId: String) {
    getAttendanceLogs(sessionId: $sessionId) {
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


type SessionLiveData = { cohortDetails: { id: string; name: string; sessions: Array<{ id: string; name: string; startTime: string; gracePeriodMinutes: number }> } | null }
type SessionLogsData = { getAttendanceLogs: Array<any> }

export default function SessionLiveView({ params }: { params: Promise<{ cohortId: string, sessionId: string }> }) {
  const unwrappedParams = use(params)
  const { data: cohortData, loading: sessionLoading } = useQuery<SessionLiveData>(SESSION_DETAILS, { variables: { id: unwrappedParams.cohortId } })
  
  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useQuery<SessionLogsData>(GET_ATTENDANCE_LOGS, {
    variables: { sessionId: unwrappedParams.sessionId },
    fetchPolicy: "network-only"
  })

  useSubscription(ATTENDANCE_LOGGED, {
    variables: { sessionId: unwrappedParams.sessionId },
    onData: () => refetchLogs()
  })

  if (sessionLoading) return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12 text-center text-sm text-muted-foreground animate-pulse">
      Loading session details...
    </div>
  )

  const logs = logsData?.getAttendanceLogs || []
  const sessionDetails = cohortData?.cohortDetails?.sessions?.find((s: any) => s.id === unwrappedParams.sessionId)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 relative">
      <div className="mb-4">
        <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">{sessionDetails?.name || "Live Session"}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Listening for scans on {sessionDetails?.startTime}...
          </p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Link href={`/scan/projector?cohortId=${unwrappedParams.cohortId}&sessionId=${unwrappedParams.sessionId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button variant="brand" className="w-full sm:w-auto rounded-xl active:scale-[0.98] justify-center">Launch Projector</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-surface-subtle/50">
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">Name</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">Status</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">Time</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">Penalty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-b border-border/80">
                      <TableCell>
                        <div className="h-4 w-32 bg-surface-subtle rounded-lg"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-16 bg-surface-subtle rounded-full"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-surface-subtle rounded-lg"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-surface-subtle rounded-lg"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : logs.length > 0 ? (
                <>
                  {logs.map((log: any) => (
                    <TableRow key={log.id} className="border-b border-border/80 hover:bg-surface-hover/80 transition-colors">
                      <TableCell className="font-medium text-foreground">{log.user.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase border ${
                          log.isLate 
                            ? 'border-secondary/20 bg-secondary/10 text-secondary' 
                            : 'border-primary/20 bg-primary/10 text-primary'
                        }`}>
                          {log.isLate ? 'Late' : 'Present'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted text-sm font-mono">
                        {new Date(log.scannedAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-danger font-mono font-medium text-sm">
                        {log.penalty ? `${log.penalty.amount} ETB` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-8 text-muted font-mono text-[13px] uppercase">
                    No scans recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
