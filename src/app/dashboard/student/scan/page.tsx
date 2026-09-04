"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { AlertCircle, CheckCircle2, Loader2, Camera, RefreshCcw, Scan } from "lucide-react"
import { useQRScanner } from "@caffeineai/qr-code"
import { getDeviceSignature } from "@/lib/device"

const LOG_ATTENDANCE = gql`
  mutation LogAttendance($qrCode: String!, $deviceSignature: String) {
    logAttendance(qrCode: $qrCode, deviceSignature: $deviceSignature)
  }
`

function extractAttendanceCode(decodedText: string) {
  try {
    const url = new URL(decodedText)
    return url.searchParams.get("studentBadge") || url.searchParams.get("code") || decodedText
  } catch {
    return decodedText.trim()
  }
}

export default function StudentScanPage() {
  const { status } = useSession()
  const [logAttendance] = useMutation(LOG_ATTENDANCE)

  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const {
    qrResults,
    isActive,
    isSupported,
    error: cameraErrorObj,
    isLoading: cameraLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100, // Make it super fast!
    maxResults: 1
  })

  const handleScan = useCallback(async (decodedText: string) => {
    if (scanStatus !== "idle") return
    
    const qrCode = extractAttendanceCode(decodedText)
    if (!qrCode) return

    if (status === "unauthenticated") {
      await signIn(undefined, { callbackUrl: window.location.href })
      return
    }

    setScanStatus("loading")
    setErrorMsg("")
    await stopScanning() // Pause scanning during mutation

    try {
      await logAttendance({ variables: { qrCode, deviceSignature: getDeviceSignature() } })
      setScanStatus("success")
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid QR code"
      setScanStatus("error")
      setErrorMsg(message)
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([300])
    } finally {
      setTimeout(() => {
        setScanStatus("idle")
        clearResults()
        void startScanning()
      }, 2200)
    }
  }, [logAttendance, scanStatus, status, stopScanning, clearResults, startScanning])

  useEffect(() => {
    if (qrResults.length > 0 && scanStatus === "idle") {
      handleScan(qrResults[0].data)
    }
  }, [qrResults, scanStatus, handleScan])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const autoBadge = searchParams.get("studentBadge")
    if (!autoBadge) return

    void handleScan(autoBadge)
    window.history.replaceState({}, "", window.location.pathname)
  }, [handleScan])

  useEffect(() => {
    if (status === "authenticated" && canStartScanning && !isActive && scanStatus === "idle") {
      void startScanning()
    }
  }, [status, canStartScanning, isActive, scanStatus, startScanning])

  const cameraError = cameraErrorObj?.message || ""
  const isPermissionDenied = cameraErrorObj?.type === "permission"

  return (
    <div className="p-6 space-y-8 h-full flex flex-col max-w-lg mx-auto text-foreground">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Scan Badge</h1>
      </div>

      <div className="flex-1 flex flex-col gap-6 w-full">
        <Card className="flex-1 bg-black overflow-hidden flex flex-col border border-border/80 relative rounded-2xl shadow-2xl min-h-[450px]">
          <CardContent className="p-0 flex-1 relative w-full h-full">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
              <div className="text-white/80 font-mono text-[10px] uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
                {cameraLoading ? "Starting Camera" : isActive ? "Active Camera" : "Ready"}
              </div>
              <button
                type="button"
                onClick={() => void switchCamera()}
                disabled={cameraLoading || !isActive}
                className="bg-black/60 p-2 rounded-full text-white/80 hover:text-white disabled:opacity-50"
                aria-label="Switch camera"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            {isSupported === false && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/55 bg-black/90">
                <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-mono text-[11px] uppercase tracking-widest">Camera not supported</p>
              </div>
            )}

            <video 
              ref={videoRef} 
              className="w-full h-full min-h-[450px] bg-zinc-950 object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {status === "unauthenticated" && (
              <div className="absolute inset-0 z-20 bg-black/90 text-white flex flex-col items-center justify-center p-6 text-center">
                <p className="font-serif text-2xl mb-2">Student sign-in required</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-5">Sign in before scanning the projector QR.</p>
                <Button onClick={() => void signIn(undefined, { callbackUrl: window.location.href })} className="bg-white text-black hover:bg-white/90 rounded-xl">Sign in</Button>
              </div>
            )}

            {isPermissionDenied && (
              <div className="absolute inset-0 z-20 bg-black/90 text-white flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 mb-4 text-danger" />
                <p className="font-serif text-2xl mb-2">Camera Access Denied</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-5 max-w-xs">Please allow camera permissions in your browser settings to scan your badge.</p>
                <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-white/90 rounded-xl">Reload Page</Button>
              </div>
            )}

            {!isActive && !cameraLoading && !scanStatus.includes("loading") && !isPermissionDenied && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/55 pointer-events-none">
                <Scan className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-mono text-[11px] uppercase tracking-widest">Camera is Paused</p>
              </div>
            )}

            {(cameraError || (scanStatus === "error" && errorMsg)) && (
              <div className="absolute inset-x-0 bottom-0 z-40 bg-black/90 text-white p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{scanStatus === "error" ? "Scan failed" : "Camera error"}</p>
                    <p className="font-mono text-[10px] uppercase opacity-70 mt-1">{errorMsg || cameraError}</p>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {scanStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-[#2A9E80]/95 text-white flex flex-col items-center justify-center"
                >
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <h2 className="font-serif text-3xl">Attendance Recorded</h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest mt-2">Ready for the next scan</p>
                </motion.div>
              )}
              {scanStatus === "loading" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-black/75 text-white flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-serif text-2xl">Validating Badge...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="flex gap-4 pb-10">
          {!isActive ? (
            <Button
              onClick={() => void startScanning()}
              disabled={!canStartScanning || cameraLoading}
              className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary-hover font-sans text-[14px] rounded-xl active:scale-[0.98] shadow-sm"
            >
              {cameraLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
              {cameraLoading ? "Starting..." : "Start Scanner"}
            </Button>
          ) : (
            <Button
              onClick={() => void stopScanning()}
              className="flex-1 h-12 bg-surface text-foreground border border-border hover:bg-surface-hover font-sans text-[14px] rounded-xl active:scale-[0.98] shadow-sm"
            >
              Stop Scanner
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
