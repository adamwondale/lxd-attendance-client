"use client"

import { useEffect, useState, use } from "react"
import { useSession, signIn } from "next-auth/react"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const LOG_ATTENDANCE = gql`
  mutation LogAttendance($qrCode: String!) {
    logAttendance(qrCode: $qrCode)
  }
`

export default function AttendPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = use(searchParams)
  const { status } = useSession()
  const [logAttendance, { loading }] = useMutation(LOG_ATTENDANCE)
  
  const [result, setResult] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (status === 'authenticated' && code && result === 'IDLE') {
      // Auto-submit
      logAttendance({ variables: { qrCode: code } })
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
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F9F8]">
        <Card className="w-full max-w-sm border-black shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-3xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <p className="font-mono text-[12px] text-center text-[#878786] uppercase mb-8 leading-relaxed">
              You must be logged in to <br /> record your attendance.
            </p>
            <Button 
              className="w-full h-12 bg-black text-white hover:bg-black/80 font-sans text-[15px]" 
              onClick={() => signIn(undefined, { callbackUrl: `/attend?code=${code}` })}
            >
              Continue to Login
            </Button>
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
