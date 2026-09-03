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
  query ProjectorRecentScans($cohortId: String!, $sessionId: String, $since: String) {
    projectorRecentScans(cohortId: $cohortId, sessionId: $sessionId, since: $since) {
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
  const [launchedAt, setLaunchedAt] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRequestedCohortId(params.get("cohortId") || "")
    setRequestedSessionId(params.get("sessionId") || "")
    setLaunchedAt(params.get("launchedAt") || "")
  }, [])

  const { data: cohortListData, loading: cohortsLoading, error: cohortsError } = useQuery<{
    publicActiveCohorts: ProjectorCohort[]
  }>(LIST_PUBLIC_COHORTS, {
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
    variables: { cohortId, sessionId: sessionId || undefined, since: launchedAt || undefined },
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

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `activeProjector_${sessionId}`) {
        const newValue = e.newValue ? JSON.parse(e.newValue) : null;
        if (!newValue || newValue.launchedAt.toString() !== launchedAt) {
          // Session was ended or a new one was started
          window.location.href = '/dashboard/attendance';
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [launchedAt])

  const endSession = () => {
    localStorage.removeItem(`activeProjector_${sessionId}`)
    window.location.href = '/dashboard/attendance'
  }

  const scanUrl = qrData?.projectorQr || "";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-row relative overflow-hidden">
      <button
        onClick={endSession}
        aria-label="End Session"
        className="absolute top-7 right-7 z-30 inline-flex items-center gap-2 border border-red-500/50 bg-red-500/20 px-4 py-2 text-xs font-mono uppercase tracking-widest text-red-200 transition hover:bg-red-500 hover:text-white"
      >
        <AlertCircle className="w-4 h-4" />
        End Session
      </button>

      <div className="absolute top-10 left-10 flex flex-col z-10 pr-52">
        <h1 className="font-serif text-5xl">Live Attendance</h1>
        <p className="font-mono text-xl text-white/50 mt-2 uppercase tracking-widest">Open Hulu Track App to Scan</p>
        {selectedCohort && (
          <p className="font-mono text-xs text-[var(--color-primary)] mt-3 uppercase tracking-widest">
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

          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <div className="bg-[#161616] p-10 rounded-3xl relative z-10 shadow-2xl border border-white/5 flex flex-col items-center">
                <div className="w-[280px] h-[280px] bg-white flex items-center justify-center p-5 rounded-2xl">
                  {scanUrl ? (
                    <QRCode 
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/attend?code=${scanUrl}`} 
                      size={230} 
                      level="H" 
                      bgColor="#ffffff" 
                      fgColor="#000000" 
                    />
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

                <div className="w-full mt-8">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--color-primary)]"
                      initial={false}
                      animate={{ width: `${(timeLeft / QR_TTL_SECONDS) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      QR Refreshes{refreshingQr ? " · Updating" : ""}
                    </p>
                    <div className="font-mono text-sm tabular-nums text-white/60">
                      00:{timeLeft.toString().padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-96 border-l border-white/5 p-8 flex flex-col pt-28 bg-[#111111]">
        <div className="flex flex-col items-center justify-center mb-8 bg-white/5 rounded-2xl py-8 border border-white/5 shadow-lg">
          <span className="font-mono text-7xl font-bold tabular-nums text-[var(--color-primary)] leading-none">{scans.length}</span>
          <h2 className="font-mono text-xs tracking-widest uppercase text-white/40 mt-4">Students Present</h2>
        </div>
        <h3 className="font-mono text-xs tracking-widest uppercase text-white/30 mb-4">Recent Scans</h3>
        <ul className="flex-1 space-y-3 overflow-y-auto pr-2">
          <AnimatePresence>
            {scans.map((scan) => (
              <motion.li key={scan.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#1C1C1C] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-sans font-medium text-[14px]">{scan.name}</div>
                  <div className="font-mono text-[10px] uppercase text-white/40 mt-1">{scan.status}</div>
                </div>
                <div className="font-mono text-[11px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md">{scan.time}</div>
              </motion.li>
            ))}
            {scans.length === 0 && (
              <div className="text-white/30 font-mono text-xs uppercase text-center mt-10">Waiting for students...</div>
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
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ProjectorContent />
    </Suspense>
  )
}
