"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation, useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Scan, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

const LIST_COHORTS = gql`
  query ListCohorts {
    listCohorts {
      id
      name
      isActive
    }
  }
`

const ADMIN_SCAN = gql`
  mutation AdminScanStudentBadge($badgeCode: String!, $sessionId: String!) {
    adminScanStudentBadge(badgeCode: $badgeCode, sessionId: $sessionId)
  }
`

export default function AdminScanPage() {
  const { data, loading } = useQuery(LIST_COHORTS)
  const [adminScan] = useMutation(ADMIN_SCAN)

  const activeCohorts = data?.listCohorts?.filter((c: any) => c.isActive) || []
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // Auto-select first active cohort if none selected
  useEffect(() => {
    if (activeCohorts.length > 0 && !selectedCohortId) {
      setSelectedCohortId(activeCohorts[0].id)
    }
  }, [activeCohorts, selectedCohortId])

  // Auto-scan if launched from native camera app via URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const autoBadge = searchParams.get("studentBadge")
    
    if (autoBadge && selectedCohortId && scanStatus === "idle") {
      setScanStatus("loading")
      adminScan({ variables: { badgeCode: autoBadge, sessionId: selectedCohortId } })
        .then(() => {
          setScanStatus("success")
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100])
          }
          window.history.replaceState({}, '', window.location.pathname)
          setTimeout(() => setScanStatus("idle"), 3000)
        })
        .catch((err: any) => {
          setScanStatus("error")
          setErrorMsg(err.message || "Invalid Student Badge")
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([300])
          }
          window.history.replaceState({}, '', window.location.pathname)
          setTimeout(() => setScanStatus("idle"), 3000)
        })
    }
  }, [selectedCohortId, adminScan, scanStatus])

  useEffect(() => {
    if (!selectedCohortId) return;

    let html5QrcodeScanner: any;

    const startScanner = async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode")
      
      html5QrcodeScanner = new Html5QrcodeScanner(
        "admin-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      )

      html5QrcodeScanner.render(
        async (decodedText: string) => {
          if (scanStatus !== "idle") return;
          
          let parsedBadge = decodedText;
          try {
            const url = new URL(decodedText);
            const badgeParam = url.searchParams.get("studentBadge");
            if (badgeParam) parsedBadge = badgeParam;
          } catch {
            // Not a URL, use as is
          }
          
          setScanStatus("loading")
          try {
            await adminScan({ variables: { badgeCode: parsedBadge, sessionId: selectedCohortId } })
            setScanStatus("success")
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100])
            }
            setTimeout(() => setScanStatus("idle"), 2000)
          } catch (err: any) {
            setScanStatus("error")
            setErrorMsg(err.message || "Invalid Student Badge")
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([300])
            }
            setTimeout(() => setScanStatus("idle"), 3000)
          }
        },
        (error: any) => {
          // ignored
        }
      )
    }

    startScanner()

    return () => {
      if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear() } catch {}
      }
    }
  }, [selectedCohortId, adminScan])

  return (
    <div className="p-10 space-y-8 h-full flex flex-col">
      <div>
        <h1 className="font-serif text-4xl mb-2">Scan Badge</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Manually scan student ID cards</p>
      </div>

      {loading ? (
        <div className="animate-pulse bg-black/5 h-64 rounded-xl"></div>
      ) : activeCohorts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[var(--color-border)] text-[var(--color-muted)] font-mono text-[13px] uppercase">
          No active cohorts found to scan students for.
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 max-w-lg">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Target Session</label>
            <select 
              value={selectedCohortId || ""}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px] rounded-md"
            >
              {activeCohorts.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Card className="flex-1 bg-black overflow-hidden flex flex-col border-black relative rounded-xl shadow-2xl min-h-[400px]">
            <CardContent className="p-0 flex-1 flex flex-col items-center justify-center relative w-full h-full">
              
              <div id="admin-reader" className="w-full h-full flex items-center justify-center bg-black">
                {/* Scanner injects here */}
              </div>
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 drop-shadow-md pointer-events-none">
                <div className="text-white/80 font-mono text-[10px] uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                  Active Camera
                </div>
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
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        #admin-reader__dashboard_section_csr span { display: none; }
        #admin-reader__dashboard_section_swaplink { display: none; }
        #admin-reader button {
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
