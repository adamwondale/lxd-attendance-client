"use client"

import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Scan, Download, Loader2 } from "lucide-react"
import QRCode from "react-qr-code"
import Link from "next/link"

const MY_QR_QUERY = gql`
  query MyQrBadge {
    myQrBadge
  }
`

const MY_ATTENDANCE_SUMMARY = gql`
  query MyAttendanceSummary {
    myAttendanceSummary {
      presentDays
      lateDays
      totalPenalty
      lateLogs {
        id
        date
        scannedAt
        latenessMinutes
        calculatedPenalty
        penalty { amount status }
      }
    }
  }
`

export default function StudentDashboardPage() {
  const { data: qrData, loading: qrLoading } = useQuery<{ myQrBadge: string }>(MY_QR_QUERY)
  const { data: summaryData, loading: summaryLoading } = useQuery(MY_ATTENDANCE_SUMMARY, { fetchPolicy: "network-only" })

  const handleDownload = () => {
    const svg = document.getElementById("student-qr-code")
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 40
      canvas.height = img.height + 40
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 20, 20)
      }
      
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = "LXD-Attendance-QR.png"
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">
      
      <section className="grid grid-cols-3 gap-3">
        {[
          ['Present', summaryData?.myAttendanceSummary?.presentDays ?? 0],
          ['Late', summaryData?.myAttendanceSummary?.lateDays ?? 0],
          ['Penalties', `${summaryData?.myAttendanceSummary?.totalPenalty ?? 0} ETB`],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface-lift rounded-2xl border border-black/5 bg-white p-4">
            <p className="text-[10px] uppercase tracking-widest text-black/45 font-mono">{label}</p>
            <p className="text-xl font-semibold mt-2">{summaryLoading ? '—' : value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-medium text-[16px]">Late Attendance & Penalties</h3>
          <span className="text-[10px] uppercase tracking-widest font-mono text-black/40">ETB</span>
        </div>
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
          {(summaryData?.myAttendanceSummary?.lateLogs || []).length ? (
            <div className="divide-y divide-black/5">
              {summaryData.myAttendanceSummary.lateLogs.slice(0, 8).map((log: any) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-black/[.02] transition-colors">
                  <div><p className="font-medium text-sm">{new Date(log.scannedAt).toLocaleDateString()}</p><p className="text-xs text-black/45 mt-1">{log.latenessMinutes} minutes late</p></div>
                  <div className="text-right"><p className="font-semibold text-sm text-[var(--color-accent)]">{log.penalty?.amount ?? log.calculatedPenalty ?? 0} ETB</p><p className="text-[10px] uppercase font-mono text-black/40">{log.penalty?.status ?? 'UNPAID'}</p></div>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-black/45">No late attendance records yet.</div>}
        </div>
      </section>

      {/* QR Code Section */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between px-2">
          <h3 className="font-sans font-medium text-[16px]">Your Identity Badge</h3>
        </div>
        
        <div className="border border-[var(--color-border)] bg-white p-8 flex flex-col items-center justify-center gap-6 rounded-2xl shadow-sm">
          {qrLoading ? (
            <div className="w-48 h-48 flex items-center justify-center bg-black/5 animate-pulse rounded-xl">
              <Loader2 className="w-6 h-6 text-black/20 animate-spin" />
            </div>
          ) : qrData?.myQrBadge ? (
            <div className="bg-white p-2 border border-black/10 rounded-xl overflow-hidden shadow-sm">
              <QRCode
                id="student-qr-code"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/scan?studentBadge=${encodeURIComponent(qrData.myQrBadge)}`}
                size={220}
                level="H"
              />
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-black/5 rounded-xl">
              <p className="text-sm font-mono text-black/50">Error loading QR</p>
            </div>
          )}
          
          <button
            onClick={handleDownload}
            disabled={qrLoading || !qrData?.myQrBadge}
            className="button flex items-center justify-center gap-2 w-full max-w-[200px] h-10 border border-[var(--color-border)] bg-white text-black font-sans text-[13px] hover:bg-[var(--color-background)] transition-colors disabled:opacity-50 rounded-full"
          >
            <Download className="w-4 h-4" />
            <span>Save to Wallet</span>
          </button>
        </div>
      </section>

      {/* Scan Actions */}
      <section className="space-y-4">
        <h3 className="font-sans font-medium text-[16px] px-2">Check In</h3>
        
        <div className="border border-[var(--color-border)] bg-white p-6 flex flex-col gap-4 rounded-2xl shadow-sm">
          <p className="font-sans text-[14px] text-[var(--color-muted)] leading-relaxed text-center">
            Tap below and point your camera at the studio projector to securely check in for today's session.
          </p>
          
          <Link 
            href="/scan/student"
            className="button mt-2 flex items-center justify-center gap-2 w-full h-14 bg-black text-white font-sans text-[16px] hover:bg-black/90 transition-colors rounded-xl shadow-md active:scale-[0.98]"
          >
            <Scan className="w-5 h-5" />
            <span>Scan Projector Code</span>
          </Link>
        </div>
      </section>

    </div>
  )
}
