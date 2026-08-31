"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { AlertCircle, CheckCircle2, Loader2, Camera, RefreshCcw, Scan } from "lucide-react"
import { Html5Qrcode, type CameraDevice } from "html5-qrcode"

const ADMIN_SCAN = gql`
  mutation AdminScanStudentBadge($badgeCode: String!) {
    adminScanStudentBadge(badgeCode: $badgeCode)
  }
`

const SCANNER_ID = "lxd-admin-qr-reader"

function extractBadgeCode(decodedText: string) {
  try {
    const url = new URL(decodedText)
    return url.searchParams.get("studentBadge") || url.searchParams.get("code") || decodedText
  } catch {
    return decodedText.trim()
  }
}

export default function AdminScanPage() {
  const [adminScan] = useMutation(ADMIN_SCAN)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const runningRef = useRef(false)
  const processingRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startScannerRef = useRef<() => Promise<void>>(async () => {})

  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [cameraError, setCameraError] = useState("")
  const [cameraLoading, setCameraLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [cameras, setCameras] = useState<CameraDevice[]>([])

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner || !runningRef.current) {
      setIsActive(false)
      return
    }

    try {
      await scanner.stop()
    } catch {
      // The camera may already have stopped after a permission/device change.
    } finally {
      runningRef.current = false
      setIsActive(false)
    }
  }, [])

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return
    const badgeCode = extractBadgeCode(decodedText)
    if (!badgeCode) return

    processingRef.current = true
    setScanStatus("loading")
    setErrorMsg("")
    await stopScanner()

    try {
      await adminScan({ variables: { badgeCode } })
      setScanStatus("success")
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid Student Badge"
      setScanStatus("error")
      setErrorMsg(message)
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([300])
    } finally {
      restartTimerRef.current = setTimeout(() => {
        processingRef.current = false
        setScanStatus("idle")
        void startScannerRef.current()
      }, 2200)
    }
  }, [adminScan, stopScanner])

  const startScanner = useCallback(async () => {
    if (runningRef.current || cameraLoading) return

    setCameraLoading(true)
    setCameraError("")
    setErrorMsg("")

    try {
      const available = cameras.length ? cameras : await Html5Qrcode.getCameras()
      if (!available.length) throw new Error("No camera was found on this device.")
      setCameras(available)

      const preferred = available.find((camera) =>
        /back|rear|environment/i.test(camera.label),
      ) || available[0]

      const scanner = scannerRef.current || new Html5Qrcode(SCANNER_ID, { verbose: false })
      scannerRef.current = scanner

      await scanner.start(
        preferred.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => { void handleScan(decodedText) },
        () => undefined,
      )

      runningRef.current = true
      setIsActive(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to start the camera."
      setCameraError(message)
      setIsActive(false)
      runningRef.current = false
    } finally {
      setCameraLoading(false)
    }
  }, [cameraLoading, cameras, handleScan])

  const switchCamera = useCallback(async () => {
    if (cameras.length < 2 || cameraLoading) return
    await stopScanner()
    const currentCameraId = scannerRef.current ? cameras.find((camera) => camera.label && /back|rear|environment/i.test(camera.label))?.id : undefined
    const currentIndex = currentCameraId ? cameras.findIndex((camera) => camera.id === currentCameraId) : 0
    const nextCamera = cameras[(Math.max(currentIndex, 0) + 1) % cameras.length]
    const scanner = scannerRef.current
    if (!scanner || runningRef.current) return

    setCameraLoading(true)
    try {
      await scanner.start(
        nextCamera.id,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1, disableFlip: false },
        (decodedText) => { void handleScan(decodedText) },
        () => undefined,
      )
      runningRef.current = true
      setIsActive(true)
    } catch (error: unknown) {
      setCameraError(error instanceof Error ? error.message : "Unable to switch camera.")
    } finally {
      setCameraLoading(false)
    }
  }, [cameraLoading, cameras, handleScan, stopScanner])

  useEffect(() => {
    startScannerRef.current = startScanner
  }, [startScanner])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const autoBadge = searchParams.get("studentBadge")
    if (!autoBadge) return

    void handleScan(autoBadge)
    window.history.replaceState({}, "", window.location.pathname)
  }, [handleScan])

  useEffect(() => {
    void startScanner()
  }, [startScanner])

  useEffect(() => () => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    const scanner = scannerRef.current
    if (scanner && runningRef.current) void scanner.stop().catch(() => undefined)
  }, [])

  return (
    <div className="p-10 space-y-8 h-full flex flex-col">
      <div>
        <h1 className="font-serif text-4xl mb-2">Scan Badge</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Scan a student ID QR code. The student&apos;s active session is detected automatically.</p>
      </div>

      <div className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <Card className="flex-1 bg-black overflow-hidden flex flex-col border-black relative rounded-xl shadow-2xl min-h-[450px]">
          <CardContent className="p-0 flex-1 relative w-full h-full">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
              <div className="text-white/80 font-mono text-[10px] uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
                {cameraLoading ? "Starting Camera" : isActive ? "Active Camera" : "Ready"}
              </div>
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={() => void switchCamera()}
                  disabled={cameraLoading || !isActive}
                  className="bg-black/60 p-2 rounded-full text-white/80 hover:text-white disabled:opacity-50"
                  aria-label="Switch camera"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <div id={SCANNER_ID} className="w-full h-full min-h-[450px] bg-zinc-950 [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

            {!isActive && !cameraLoading && !scanStatus.includes("loading") && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/55 pointer-events-none">
                <Scan className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-mono text-[11px] uppercase tracking-widest">Camera is Paused</p>
              </div>
            )}

            {(cameraError || (scanStatus === "error" && errorMsg)) && (
              <div className="absolute inset-x-0 bottom-0 z-40 bg-black/90 text-white p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
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
                  className="absolute inset-0 z-50 bg-green-500/95 text-white flex flex-col items-center justify-center"
                >
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <h2 className="font-serif text-3xl">Attendance Recorded</h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest mt-2">Ready for the next student</p>
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
              onClick={() => void startScanner()}
              disabled={cameraLoading}
              className="flex-1 h-12 bg-black text-white hover:bg-black/80 font-sans text-[14px]"
            >
              {cameraLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
              {cameraLoading ? "Starting..." : "Start Scanner"}
            </Button>
          ) : (
            <Button
              onClick={() => void stopScanner()}
              className="flex-1 h-12 bg-white text-black border border-black/20 hover:bg-black/5 font-sans text-[14px]"
            >
              Stop Scanner
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
