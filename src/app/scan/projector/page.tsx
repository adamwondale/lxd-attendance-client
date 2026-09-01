"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import QRCode from "react-qr-code"

import { useSearchParams } from "next/navigation"
import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { AlertCircle, ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react"

const LIST_PUBLIC_COHORTS = gql`
  query ProjectorCohorts {
    publicActiveCohorts {
      id
      name
      startDate
      endDate
      isActive
      sessions {
        id
        name
        recurrenceDays
        startTime
      }
    }
  }
`

const GENERATE_PROJECTOR_QR = gql`
  query ProjectorQr($cohortId: String!, $sessionId: String) {
    projectorQr(cohortId: $cohortId, sessionId: $sessionId)
  }
`

const PROJECTOR_RECENT_SCANS = gql`
  query ProjectorRecentScans($cohortId: String!, $sessionId: String) {
    projectorRecentScans(cohortId: $cohortId, sessionId: $sessionId) {
      id
      sessionId
      user { name }
      scannedAt
      isLate
      latenessMinutes
      calculatedPenalty
    }
  }
`

type ProjectorCohort = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  sessions: Array<{
    id: string
    name: string
    recurrenceDays: string[]
    startTime: string
  }>
}

type AttendanceScan = {
  id: string
  name: string
  time: string
  status: string
}

const QR_TTL_SECONDS = 20

function ProjectorContent() {
  const [requestedCohortId, setRequestedCohortId] = useState("")
  const [requestedSessionId, setRequestedSessionId] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRequestedCohortId(params.get("cohortId") || "")
    setRequestedSessionId(params.get("sessionId") || "")
  }, [])

  const { data: cohortListData, loading: cohortsLoading, error: cohortsError } = useQuery<{
    publicActiveCohorts: ProjectorCohort[]
  }>(LIST_PUBLIC_COHORTS, {
function ProjectorContent() {
  const searchParams = useSearchParams()
  const cohortId = searchParams.get("cohortId") || "COHORT1"

  const { data: qrData, refetch, error } = useQuery<{ generateCohortQr: string }>(GENERATE_COHORT_QR, {
    variables: { cohortId },
    fetchPolicy: "network-only",
  })

  const cohorts = cohortListData?.publicActiveCohorts || []

  const selectedCohort = useMemo(() => {
    if (requestedCohortId) {
      return cohorts.find((cohort) => cohort.id === requestedCohortId)
    }
    if (requestedSessionId) {
      return cohorts.find((cohort) => cohort.sessions.some((session) => session.id === requestedSessionId))
    }
    return cohorts.find((cohort) => cohort.isActive && cohort.sessions.length > 0) || cohorts[0]
  }, [cohorts, requestedCohortId, requestedSessionId])

  const selectedSession = useMemo(() => {
    if (!selectedCohort) return undefined
    if (requestedSessionId) {
      return selectedCohort.sessions.find((session) => session.id === requestedSessionId)
    }
    return selectedCohort.sessions[0]
  }, [selectedCohort, requestedSessionId])

  const cohortId = selectedCohort?.id || ""
  const sessionId = selectedSession?.id || ""

  const {
    data: qrData,
    loading: qrLoading,
    error: qrError,
    refetch,
  } = useQuery<{ projectorQr: string }>(GENERATE_PROJECTOR_QR, {
    variables: { cohortId, sessionId: sessionId || undefined },
    fetchPolicy: "no-cache",
    skip: !cohortId,
  })

  const { data: recentScanData } = useQuery<{
    projectorRecentScans: Array<{
      id: string
      sessionId: string
      user?: { name?: string }
      scannedAt: string
      isLate: boolean
      latenessMinutes: number
    }>
  }>(PROJECTOR_RECENT_SCANS, {
    variables: { cohortId, sessionId: sessionId || undefined },
    fetchPolicy: "network-only",
    pollInterval: 2000,
    skip: !cohortId,
  })

  const [timeLeft, setTimeLeft] = useState(QR_TTL_SECONDS)
  const [refreshingQr, setRefreshingQr] = useState(false)
  const scans: AttendanceScan[] = useMemo(() => (recentScanData?.projectorRecentScans || []).map((event) => ({
    id: event.id,
    name: event.user?.name || "Student",
    time: new Date(event.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: event.isLate ? `Late · ${event.latenessMinutes} min` : "On time",
  })), [recentScanData])
  const sessionId = searchParams.get("sessionId");
  const { data: subData } = useSubscription<any>(ATTENDANCE_LOGGED, {
    variables: { sessionId },
    skip: !sessionId
  })

  if (error) {
    console.error("GraphQL Error in generateCohortQr:", error);
  }

  const [timeLeft, setTimeLeft] = useState(15)
  const [scans, setScans] = useState<any[]>([])

  useEffect(() => {
    if (!cohortId) return

    setTimeLeft(QR_TTL_SECONDS)
    let cancelled = false
    let countdownId: number | undefined
    let refreshId: number | undefined

    const refreshQr = async () => {
      if (cancelled) return
      setRefreshingQr(true)
      try {
        await refetch()
      } finally {
        if (!cancelled) {
          setTimeLeft(QR_TTL_SECONDS)
          setRefreshingQr(false)
        }
      }
    }

    countdownId = window.setInterval(() => {
      setTimeLeft((previous) => (previous > 1 ? previous - 1 : 0))
    }, 1000)

    refreshId = window.setInterval(() => {
      void refreshQr()
    }, QR_TTL_SECONDS * 1000)

    return () => {
      cancelled = true
      if (countdownId !== undefined) window.clearInterval(countdownId)
      if (refreshId !== undefined) window.clearInterval(refreshId)
    }
  }, [cohortId, sessionId, refetch])

  // Dynamically grab the exact URL you are viewing the projector on (so the QR code always matches your real Vercel URL)
  const [hostUrl, setHostUrl] = useState("");
  useEffect(() => {
    // Change this line to just use window.location.origin
    setHostUrl(window.location.origin); 
  }, []);

  const qrString = qrData?.generateCohortQr || "";
  const scanUrl = hostUrl && qrString ? `${hostUrl}/attend?code=${qrString}` : "";

  return (
    <div className="min-h-screen bg-[var(--color-primary)] text-[var(--color-surface)] flex flex-row relative overflow-hidden">
      <Link
        href="/dashboard"
        aria-label="Back to admin dashboard"
        className="absolute top-7 right-7 z-30 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-widest text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <LayoutDashboard className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="absolute top-10 left-10 flex flex-col z-10 pr-52">
        <h1 className="font-serif text-5xl">Live Attendance</h1>
        <p className="font-mono text-xl text-gray-400 mt-2 uppercase tracking-widest">Scan to Check-In</p>
        {selectedCohort && (
          <p className="font-mono text-xs text-gray-500 mt-3 uppercase tracking-widest">
            {selectedCohort.name}{selectedSession ? ` · ${selectedSession.name}` : ""}
          </p>
        )}
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center">
        {cohortsLoading && !selectedCohort ? (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest">Loading projector...</span>
          </div>
        ) : !cohortId ? (
          <div className="max-w-md px-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-red-400" />
            <h2 className="font-serif text-3xl">No active cohort available</h2>
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mt-3">
              Open the projector from an active cohort or session in the admin dashboard.
            </p>
            {errorMessage && <p className="text-xs text-red-400 mt-4">{errorMessage}</p>}
          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <svg className="absolute -inset-10 w-[400px] h-[400px] -rotate-90 transform" viewBox="0 0 300 300" aria-hidden="true">
                <circle cx="150" cy="150" r="120" className="stroke-[var(--color-surface)]/20 fill-none" strokeWidth="4" />
                <motion.circle
                  cx="150"
                  cy="150"
                  r="120"
                  className="stroke-[var(--color-surface)] fill-none"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 120}
                  initial={false}
                  animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - timeLeft / QR_TTL_SECONDS) }}
                  transition={{ duration: 1, ease: "linear" }}
                  strokeLinecap="square"
                />
              </svg>

              <div className="bg-[var(--color-surface)] p-8 relative z-10 shadow-2xl">
                <div className="w-[260px] h-[260px] bg-white flex items-center justify-center p-4">
                  {scanUrl ? (
                    <QRCode value={scanUrl} size={230} level="H" bgColor="#ffffff" fgColor="#000000" />
                  ) : qrError && !refreshingQr ? (
                    <div className="text-center text-black px-5">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                      <p className="font-mono text-[10px] uppercase">Unable to generate QR</p>
                      <p className="font-mono text-[9px] text-black/50 mt-2 max-w-[210px]">{qrError.message}</p>
                    </div>
                  ) : (
                    <Loader2 className="w-8 h-8 text-black/30 animate-spin" />
                  )}
                </div>
              </div>
            </div>
            <div className="font-mono text-4xl tabular-nums mt-16">00:{timeLeft.toString().padStart(2, "0")}</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mt-3">QR refreshes every 20 seconds{refreshingQr ? " · updating" : ""}</p>
          </>
        )}
      </div>

      <div className="w-96 border-l border-white/10 p-8 flex flex-col pt-28">
        <h2 className="font-mono text-sm tracking-widest uppercase text-gray-400 mb-6">Recent Scans</h2>
        <ul className="flex-1 space-y-4 overflow-y-auto">
          <AnimatePresence>
            {scans.map((scan) => (
              <motion.li key={scan.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-sans font-medium">{scan.name}</div>
                  <div className="font-mono text-[10px] uppercase text-white/40 mt-1">{scan.status}</div>
                </div>
                <div className="font-mono text-xs text-green-400">{scan.time}</div>
              </motion.li>
            ))}
            {scans.length === 0 && (
              <div className="text-gray-500 font-mono text-xs uppercase text-center mt-10">Waiting for students...</div>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

export default function ProjectorView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-primary)] text-[var(--color-surface)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ProjectorContent />
    </Suspense>
  )
}
