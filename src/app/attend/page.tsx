"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
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

const LOG_ATTENDANCE_BY_ID = gql`
  mutation LogAttendanceById($traineeId: String!, $qrCode: String!, $deviceSignature: String) {
    logAttendanceById(traineeId: $traineeId, qrCode: $qrCode, deviceSignature: $deviceSignature)
  }
`

function AttendContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const { status } = useSession()
  const [logAttendance, { loading }] = useMutation(LOG_ATTENDANCE)
  const [logAttendanceById] = useMutation(LOG_ATTENDANCE_BY_ID)
  const [traineeId, setTraineeId] = useState("")
  
  const [result, setResult] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (status === 'authenticated' && code && result === 'IDLE') {
      // Auto-submit
      logAttendance({ variables: { qrCode: code, deviceSignature: getDeviceSignature() } })
        .then(() => setResult('SUCCESS'))
        .catch((err) => {
          setResult('ERROR')
          setErrorMsg(err.message || "Failed to log attendance")
        })
    }
  }, [status, code, result, logAttendance])

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F9F8]">
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F9F8]">
        <div className="animate-pulse font-mono uppercase tracking-widest text-sm text-[var(--color-muted)]">
          Authenticating...
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    const submitById = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!traineeId.trim() || !code) return
      setErrorMsg("")
      setResult('IDLE')
      try {
        await logAttendanceById({ variables: { traineeId: traineeId.trim(), qrCode: code, deviceSignature: getDeviceSignature() } })
        setResult('SUCCESS')
      } catch (err: any) {
        setResult('ERROR')
        setErrorMsg(err.message || 'Unable to verify trainee ID')
      }
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,#fff_0,#F5F5F3_55%,#ecece8_100%)]">
        <Card className="w-full max-w-md border-black/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-semibold">L</div>
            <CardTitle className="font-serif text-3xl">Confirm Attendance</CardTitle>
            <p className="text-sm text-[#878786] mt-2">Enter your registered trainee ID. The QR code has already been verified.</p>
          </CardHeader>
          <CardContent className="pt-3">
            <form onSubmit={submitById} className="space-y-4">
              <input value={traineeId} onChange={e => setTraineeId(e.target.value)} autoFocus placeholder="Trainee ID" className="w-full h-14 px-4 text-center tracking-[.18em] uppercase rounded-2xl border border-black/10 bg-[#F9F9F8] outline-none focus:border-black transition-colors" />
              {result === 'ERROR' && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{errorMsg}</p>}
              {result === 'SUCCESS' ? (
                <div className="rounded-2xl bg-green-50 text-green-700 p-4 text-center font-medium">Attendance recorded successfully.</div>
              ) : (
                <Button disabled={!traineeId.trim()} className="w-full h-14 rounded-2xl bg-black text-white hover:bg-[#222]">Confirm Check-in</Button>
              )}
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => signIn(undefined, { callbackUrl: `/attend?code=${code}` })} className="text-sm underline underline-offset-4 text-black/60 hover:text-black">Sign in instead</button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F9F8]">
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

            <p className="font-mono text-[13px] uppercase text-[#878786] mt-2">
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F9F8]">
        <div className="animate-pulse font-mono uppercase tracking-widest text-sm text-[var(--color-muted)]">
          Loading...
        </div>
      </div>
    }>
      <AttendContent />
    </Suspense>
  )
}
