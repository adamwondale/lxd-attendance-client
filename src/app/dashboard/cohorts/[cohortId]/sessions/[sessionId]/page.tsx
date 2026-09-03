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

  if (sessionLoading) return <div className="p-10">Loading session...</div>

  const logs = logsData?.getAttendanceLogs || []
  const sessionDetails = cohortData?.cohortDetails?.sessions?.find((s: any) => s.id === unwrappedParams.sessionId)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 relative">
      <div className="mb-4">
        <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}`} className="text-sm font-mono uppercase tracking-widest text-[#878786] hover:text-black flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </Link>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2">{sessionDetails?.name || "Live Session"}</h1>
          <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Listening for scans on {sessionDetails?.startTime}...
          </p>
        </div>
        <div className="flex gap-4">
          <Link href={`/scan/projector?cohortId=${unwrappedParams.cohortId}&sessionId=${unwrappedParams.sessionId}`} target="_blank" rel="noopener noreferrer">
            <Button className="bg-black text-white hover:bg-black/80">Launch Projector</Button>
          </Link>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Penalty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logsLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 w-32 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-black/5 rounded"></div>
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : logs.length > 0 ? (
            <>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-[12px] font-mono uppercase border ${
                      log.isLate 
                        ? 'border-[var(--color-accent)] text-[var(--color-accent)]' 
                        : 'border-green-600 text-green-700'
                    }`}>
                      {log.isLate ? 'Late' : 'Present'}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--color-muted)] text-sm">
                    {new Date(log.scannedAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-[var(--color-accent)] text-sm">
                    {log.penalty ? `${log.penalty.amount} ETB` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center p-8 text-[var(--color-muted)] font-mono text-[13px] uppercase">
                No scans recorded yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
