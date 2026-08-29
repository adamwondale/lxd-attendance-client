"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Scan, CheckCircle2, AlertCircle, Loader2, Camera, RefreshCcw } from "lucide-react"
import { useQRScanner } from "@caffeineai/qr-code"

const ADMIN_SCAN = gql`
  mutation AdminScanStudentBadge($badgeCode: String!) {
    adminScanStudentBadge(badgeCode: $badgeCode)
  }
`

export default function AdminScanPage() {
  const [adminScan] = useMutation(ADMIN_SCAN)
  
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error: cameraError,
    isLoading: isCameraLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 1
  });

  // Handle scanned results
  useEffect(() => {
    if (qrResults.length > 0 && scanStatus === "idle") {
      const decodedText = qrResults[0].data;
      
      let parsedBadge = decodedText;
      try {
        const url = new URL(decodedText);
        const badgeParam = url.searchParams.get("studentBadge");
        if (badgeParam) parsedBadge = badgeParam;
      } catch {
        // Not a URL, use as is
      }
      
      setScanStatus("loading");
      adminScan({ variables: { badgeCode: parsedBadge } })
        .then(() => {
          setScanStatus("success");
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => {
            setScanStatus("idle");
            clearResults();
          }, 2000);
        })
        .catch((err: any) => {
          setScanStatus("error");
          setErrorMsg(err.message || "Invalid Student Badge");
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([300]);
          setTimeout(() => {
            setScanStatus("idle");
            clearResults();
          }, 3000);
        });
    }
  }, [qrResults, adminScan, scanStatus, clearResults]);

  // Auto-scan if launched from native camera app via URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const autoBadge = searchParams.get("studentBadge")
    
    if (autoBadge && scanStatus === "idle") {
      setScanStatus("loading")
      adminScan({ variables: { badgeCode: autoBadge } })
        .then(() => {
          setScanStatus("success")
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100])
          window.history.replaceState({}, '', window.location.pathname)
          setTimeout(() => setScanStatus("idle"), 3000)
        })
        .catch((err: any) => {
          setScanStatus("error")
          setErrorMsg(err.message || "Invalid Student Badge")
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([300])
          window.history.replaceState({}, '', window.location.pathname)
          setTimeout(() => setScanStatus("idle"), 3000)
        })
    }
  }, [adminScan, scanStatus])

  if (isSupported === false) {
    return (
      <div className="p-10 space-y-8 h-full flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="font-serif text-2xl">Camera Not Supported</h2>
        <p className="font-mono text-sm text-[var(--color-muted)]">Your device does not support camera access.</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 h-full flex flex-col">
      <div>
        <h1 className="font-serif text-4xl mb-2">Scan Badge</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Manually scan student ID cards. Sessions are auto-detected.</p>
      </div>

      <div className="flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <Card className="flex-1 bg-black overflow-hidden flex flex-col border-black relative rounded-xl shadow-2xl min-h-[450px]">
          <CardContent className="p-0 flex-1 flex flex-col items-center justify-center relative w-full h-full">
            
            {cameraError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
                <AlertCircle className="w-10 h-10 mb-4 text-red-500" />
                <p className="font-sans font-medium mb-2">{cameraError.message}</p>
                <p className="font-mono text-[10px] uppercase opacity-70">Please check camera permissions.</p>
              </div>
            )}

            <div className="w-full h-full relative flex items-center justify-center bg-zinc-950 overflow-hidden">
              <video 
                ref={videoRef}
                className="absolute w-full h-full object-cover z-0"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Overlay Scanner Frame */}
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10" />
              
              {!isActive && !isCameraLoading && (
                <div className="absolute z-10 flex flex-col items-center text-white/50">
                  <Scan className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-mono text-[11px] uppercase tracking-widest">Camera is Paused</p>
                </div>
              )}
            </div>
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30 drop-shadow-md">
              <div className="text-white/80 font-mono text-[10px] uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                {isActive ? "Active Camera" : "Ready"}
              </div>
              
              {/* Switch camera on mobile */}
              {typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                <button 
                  onClick={switchCamera} 
                  disabled={isCameraLoading || !isActive}
                  className="bg-black/50 p-2 rounded-full backdrop-blur-md text-white/80 hover:text-white disabled:opacity-50"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {scanStatus !== "idle" && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className={`absolute bottom-0 left-0 right-0 p-6 z-50 flex items-center justify-between ${
                    scanStatus === "success" 
                      ? "bg-green-500 text-white" 
                      : scanStatus === "loading"
                      ? "bg-black text-white border-t border-white/20"
                      : "bg-[var(--color-accent)] text-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {scanStatus === "success" ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : scanStatus === "loading" ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                    <div>
                      <h3 className="font-serif text-lg">
                        {scanStatus === "success" ? "Scanned Successfully" : scanStatus === "loading" ? "Validating Badge..." : "Scan Failed"}
                      </h3>
                      <p className="font-mono text-[10px] uppercase mt-1 opacity-90">
                        {scanStatus === "success" ? "Ready for next student" : scanStatus === "loading" ? "Please wait..." : errorMsg}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-4 pb-10">
          {!isActive ? (
            <Button 
              onClick={startScanning} 
              disabled={!canStartScanning}
              className="flex-1 h-12 bg-black text-white hover:bg-black/80 font-sans text-[14px]"
            >
              {isCameraLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
              Start Scanner
            </Button>
          ) : (
            <Button 
              onClick={stopScanning}
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
