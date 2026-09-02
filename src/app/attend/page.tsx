"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDeviceSignature } from "@/lib/device"

const LOG_ATTENDANCE = gql`
  mutation LogAttendance($qrCode: String!, $deviceSignature: String) {
    logAttendance(qrCode: $qrCode, deviceSignature: $deviceSignature)
  }
`

function AttendContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const [logAttendance, { loading }] = useMutation(LOG_ATTENDANCE)
  
  const [result, setResult] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    let cancelled = false
    void getSession().then((session) => {
      if (cancelled) return
      setStatus(session ? 'authenticated' : 'unauthenticated')
      if (session && code && result === 'IDLE') {
        logAttendance({ variables: { qrCode: code, deviceSignature: getDeviceSignature() } })
          .then(() => { if (!cancelled) setResult('SUCCESS') })
          .catch((err) => {
            if (cancelled) return
            setResult('ERROR')
            setErrorMsg(err.message || "Failed to log attendance")
          })
      }
    })
    return () => { cancelled = true }
  }, [code, result, logAttendance])

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-sm border-black">
          <CardHeader>
            <CardTitle className="text-center font-serif text-2xl">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-[var(--color-muted)] font-mono text-sm">
            No attendance code was provided in the URL.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="animate-pulse font-mono uppercase tracking-widest text-sm text-[var(--color-muted)]">
          Authenticating...
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,#fff_0,#F5F5F3_55%,#ecece8_100%)]">
        <Card className="w-full max-w-md border-black/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-semibold">L</div>
            <CardTitle className="font-serif text-3xl">Sign in to Check In</CardTitle>
            <p className="text-sm text-muted mt-2">Your attendance QR is valid for 20 seconds. Sign in with your student account and you will be checked in automatically.</p>
          </CardHeader>
          <CardContent className="pt-3">
            <Button onClick={() => signIn(undefined, { callbackUrl: `/attend?code=${encodeURIComponent(code || '')}` })} className="w-full h-14 rounded-2xl bg-black text-white hover:bg-[#222]">
              Sign in to continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className={`border-2 shadow-xl ${result === 'SUCCESS' ? 'border-green-500' : result === 'ERROR' ? 'border-red-500' : 'border-black'}`}>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl">
              {loading ? "Recording..." : result === 'SUCCESS' ? "Success!" : result === 'ERROR' ? "Failed" : "Waiting"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8 text-center">
            {loading && (
              <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin my-4" />
            )}
            
            {result === 'SUCCESS' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-4"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {result === 'ERROR' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mb-4"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            )}

            <p className="font-mono text-[13px] uppercase text-muted mt-2">
              {loading ? "Verifying cryptographic signature..." : 
               result === 'SUCCESS' ? "Attendance successfully logged. You can close this page." : 
               result === 'ERROR' ? errorMsg : ""}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function AttendPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="animate-pulse font-mono uppercase tracking-widest text-sm text-[var(--color-muted)]">
          Loading...
        </div>
      </div>
    }>
      <AttendContent />
    </Suspense>
  )
}
