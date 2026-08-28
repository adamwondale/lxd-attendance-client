"use client"

import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import QRCode from "react-qr-code"
import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"

const GENERATE_SESSION_QR = gql`
  query GenerateSessionQr($sessionId: String!) {
    generateSessionQr(sessionId: $sessionId)
  }
`

const ATTENDANCE_LOGGED = gql`
  subscription OnAttendanceLogged($sessionId: String!) {
    attendanceLogged(sessionId: $sessionId)
  }
`

export default function ProjectorView({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const unwrappedParams = use(searchParams)
  const sessionId = unwrappedParams.sessionId || "SESSION1"

  const { data: qrData, refetch } = useQuery<{ generateSessionQr: string }>(GENERATE_SESSION_QR, {
    variables: { sessionId },
    fetchPolicy: "network-only"
  })

  // We are not passing full user details in the subscription yet, so we mock names based on the log ID.
  // In a full implementation, the subscription should return the user's name.
  const { data: subData } = useSubscription<{ attendanceLogged: string }>(ATTENDANCE_LOGGED, {
    variables: { sessionId }
  })

  const [timeLeft, setTimeLeft] = useState(15)
  const [scans, setScans] = useState<any[]>([])

  useEffect(() => {
    if (subData?.attendanceLogged) {
      const logId = subData.attendanceLogged;
      // Prevent duplicates
      if (!scans.find(s => s.id === logId)) {
        setScans(prev => [{
          id: logId,
          name: "Student " + logId.substring(0, 4).toUpperCase(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
      }
    }
  }, [subData])

  useEffect(() => {
    // 15-second timer loop for the QR
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger QR code rotation
          refetch()
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [refetch])

  // Calculate circumference for SVG circle (r=120)
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft / 15) * circumference

  // Ensure this uses absolute URL so mobile devices can open it.
  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lxd-attendance.vercel.app'
  const qrString = qrData?.generateSessionQr || ""
  const scanUrl = `${hostUrl}/attend?code=${qrString}`

  return (
    <div className="min-h-screen bg-[var(--color-primary)] text-[var(--color-surface)] flex flex-row relative overflow-hidden">
      
      {/* Absolute top header */}
      <div className="absolute top-10 left-10 flex flex-col">
        <h1 className="font-serif text-5xl">Live Attendance</h1>
        <p className="font-mono text-xl text-gray-400 mt-2 uppercase tracking-widest">Scan to Check-In</p>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Progress Ring */}
          <svg
            className="absolute -inset-10 w-[400px] h-[400px] -rotate-90 transform"
            viewBox="0 0 300 300"
          >
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-[var(--color-surface)]/20 fill-none"
              strokeWidth="4"
            />
            <motion.circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-[var(--color-surface)] fill-none"
              strokeWidth="4"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              strokeLinecap="square"
            />
          </svg>

          {/* QR Code Area */}
          <div className="bg-[var(--color-surface)] p-8 relative z-10">
            <div className="w-[200px] h-[200px] bg-white flex items-center justify-center p-2">
              {qrString ? (
                <QRCode value={scanUrl} size={180} />
              ) : (
                <div className="text-black font-mono animate-pulse">Loading...</div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown text */}
        <div className="font-mono text-4xl tabular-nums mt-16">
          00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Live Feed Sidebar */}
      <div className="w-96 border-l border-white/10 p-8 flex flex-col">
        <h2 className="font-mono text-sm tracking-widest uppercase text-gray-400 mb-6">Recent Scans</h2>
        <ul className="flex-1 space-y-4 overflow-y-auto">
          <AnimatePresence>
            {scans.map((scan) => (
              <motion.li
                key={scan.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 p-4 rounded-lg flex justify-between items-center"
              >
                <div className="font-sans font-medium">{scan.name}</div>
                <div className="font-mono text-xs text-green-400">{scan.time}</div>
              </motion.li>
            ))}
            {scans.length === 0 && (
              <div className="text-gray-500 font-mono text-xs uppercase text-center mt-10">
                Waiting for students...
              </div>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}
