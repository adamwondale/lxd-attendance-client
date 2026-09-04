"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/15 blur-[120px]" />
        <Card className="w-full max-w-sm rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center">
            <Image
              src="/512-512.png"
              alt="Hulu Track Logo"
              width={56}
              height={56}
              className="mx-auto mb-3 w-14 h-14 rounded-2xl shadow-md border border-border/80 object-cover"
            />
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground text-sm">
            No attendance code was provided in the URL.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/15 blur-[120px]" />
        <div className="animate-pulse text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          Authenticating...
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/15 blur-[120px]" />
        <Card className="w-full max-w-md border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-3">
            <Image
              src="/512-512.png"
              alt="Hulu Track Logo"
              width={64}
              height={64}
              className="mx-auto mb-4 w-16 h-16 rounded-2xl shadow-md border border-border/80 object-cover"
            />
            <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Sign in to Check In</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Your attendance QR is valid for 20 seconds. Sign in with your student account and you will be checked in automatically.</p>
          </CardHeader>
          <CardContent className="pt-3">
            <Button 
              variant="brand"
              onClick={() => signIn(undefined, { callbackUrl: `/attend?code=${encodeURIComponent(code || '')}` })} 
              className="w-full h-12 rounded-xl text-base font-medium shadow-sm active:scale-[0.98]"
            >
              Sign in to continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/15 blur-[120px]" />
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-sm"
      >
        <Card className={`rounded-3xl shadow-2xl border backdrop-blur-2xl bg-surface/90 transition-all ${
          result === 'SUCCESS' ? 'border-primary/40 shadow-primary/10' : 
          result === 'ERROR' ? 'border-danger/40 shadow-danger/10' : 
          'border-border/80'
        }`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {loading ? "Recording..." : result === 'SUCCESS' ? "Success!" : result === 'ERROR' ? "Failed" : "Waiting"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8 text-center">
            {loading && (
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin my-4" />
            )}
            
            {result === 'SUCCESS' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/25 mb-4"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {result === 'ERROR' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-danger text-danger-foreground rounded-full flex items-center justify-center shadow-lg shadow-danger/25 mb-4"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            )}

            <p className="text-sm text-muted-foreground mt-2 font-medium">
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
        <div className="animate-pulse text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          Loading...
        </div>
      </div>
    }>
      <AttendContent />
    </Suspense>
  )
}
