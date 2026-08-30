"use client"

import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Scan, CheckCircle2, AlertCircle, Loader2, Camera, RefreshCcw } from "lucide-react"
import { useQRScanner } from "@caffeineai/qr-code"

const LOG_ATTENDANCE = gql`
  mutation LogAttendance($qrCode: String!) {
    logAttendance(qrCode: $qrCode)
  }
`

export default function StudentScanPage() {
  const [logAttendance] = useMutation(LOG_ATTENDANCE)
  
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  
  // Aggressive Debouncing State
  const [lastScannedCode, setLastScannedCode] = useState<{ code: string, time: number } | null>(null);

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
    scanInterval: 150, // Optimized interval to prevent mobile overheating
    maxResults: 1
  });

  // Handle scanned results
  useEffect(() => {
    if (qrResults.length > 0 && scanStatus === "idle") {
      const decodedText = qrResults[0].data;
      
      let parsedCode = decodedText;
      try {
        const url = new URL(decodedText);
        const codeParam = url.searchParams.get("code");
        if (codeParam) parsedCode = codeParam;
      } catch {
        // Not a URL, use as is
      }
      
      // 1. Aggressive Debouncing
      const now = Date.now();
      if (lastScannedCode && lastScannedCode.code === parsedCode && now - lastScannedCode.time < 5000) {
        // Ignore the exact same code if scanned within the last 5 seconds
        clearResults();
        return;
      }
      
      setLastScannedCode({ code: parsedCode, time: now });

      // 2. Instant Haptic Feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100]); // Vibrate immediately so student knows it was captured
      }

      setScanStatus("loading");
      logAttendance({ variables: { qrCode: parsedCode } })
        .then(() => {
          setScanStatus("success");
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => {
            setScanStatus("idle");
            clearResults();
          }, 3000);
        })
        .catch((err: any) => {
          setScanStatus("error");
          // 3. Graceful Expiration Handling
          const errorMessage = err.message || "Invalid QR Code";
          if (errorMessage.toLowerCase().includes("expired")) {
            setErrorMsg("Code expired. Please scan the new code on the projector.");
          } else {
            setErrorMsg(errorMessage);
          }
          
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([300]);
          setTimeout(() => {
            setScanStatus("idle");
            clearResults();
          }, 4000);
        });
    }
  }, [qrResults, logAttendance, scanStatus, clearResults, lastScannedCode]);


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
        <h1 className="font-serif text-4xl mb-2">Check In</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Scan the QR code on the projector to mark attendance.</p>
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
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        {scanStatus === "success" ? "Success!" : scanStatus === "loading" ? "Validating..." : "Scan Failed"}
                      </h3>
                      <p className="font-mono text-[10px] uppercase mt-1 opacity-90">
                        {scanStatus === "success" ? "Attendance Logged" : scanStatus === "loading" ? "Please wait..." : errorMsg}
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
