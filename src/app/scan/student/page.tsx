"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentScanner() {
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    let html5QrcodeScanner: any;

    const startScanner = async () => {
      // Dynamic import since html5-qrcode is a client-side library
      const { Html5QrcodeScanner } = await import("html5-qrcode")
      
      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      )

      html5QrcodeScanner.render(
        (decodedText: string) => {
          // Verify it's a URL and has the attend code
          if (decodedText.includes('/attend?code=')) {
            // Vibrate device if supported
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100])
            }
            setScanStatus("success")
            
            // Redirect to the parsed URL
            try {
              const url = new URL(decodedText)
              // We just push the path + search params instead of full URL to stay within Next.js router
              router.push(url.pathname + url.search)
            } catch {
              router.push(decodedText)
            }
            
            html5QrcodeScanner.clear()
          } else {
            // Vibrate device if supported
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([300])
            }
            setScanStatus("error")
            setErrorMsg("Invalid QR format")
            setTimeout(() => setScanStatus("idle"), 3000)
          }
        },
        (error: any) => {
          // ignored, happens on every frame when no QR code is found
        }
      )
    }

    startScanner()

    return () => {
      if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear() } catch {}
      }
    }
  }, [isClient, router])

  if (!isClient) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Loading camera...</div>
  }

  return (
    <div className="min-h-screen bg-[var(--color-primary)] flex flex-col relative overflow-hidden">
      
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <Link href="/dashboard/student" className="text-white hover:opacity-80 transition-opacity">
          <X className="w-8 h-8" />
        </Link>
        <div className="font-mono text-sm tracking-widest uppercase text-white opacity-80">
          Studio Check-In
        </div>
      </div>
      
      {/* Scanner Viewfinder overlay */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center pt-20">
        
        <div id="reader" className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black">
          {/* html5-qrcode injects its UI here */}
        </div>
        
        <p className="text-white/50 font-mono text-xs mt-8 text-center px-8 uppercase tracking-widest">
          Point camera at the projector screen<br/>to log your attendance
        </p>

      </div>

      {/* Multimodal Feedback Overlay */}
      <AnimatePresence>
        {scanStatus !== "idle" && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={`absolute bottom-0 left-0 right-0 p-8 z-50 ${
              scanStatus === "success" 
                ? "bg-green-500 text-white" 
                : "bg-[var(--color-accent)] text-white"
            }`}
          >
            <div className="flex items-center gap-4">
              {scanStatus === "success" ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
              <div>
                <h3 className="font-serif text-2xl">
                  {scanStatus === "success" ? "Validating..." : "Invalid QR Code"}
                </h3>
                <p className="font-mono text-sm uppercase mt-1 opacity-90">
                  {scanStatus === "success" ? "Redirecting..." : errorMsg}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide HTML5 QR Code Scanner ugly default UI elements */
        #reader__dashboard_section_csr span { display: none; }
        #reader__dashboard_section_swaplink { display: none; }
        #reader button {
          background-color: white !important;
          color: black !important;
          border: none !important;
          padding: 8px 16px !important;
          font-family: inherit !important;
          text-transform: uppercase !important;
          font-size: 12px !important;
          letter-spacing: 1px !important;
          margin-top: 10px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
        }
      `}} />
    </div>
  )
}
