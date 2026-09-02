"use client"

import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import QRCode from "react-qr-code"
import { StudentProfile } from "@/components/StudentProfile"
import { LogOut, ChevronRight, Download, Loader2 } from "lucide-react"

const MY_QR_QUERY = gql`
  query MyQrBadge {
    myQrBadge
  }
`

export default function StudentProfilePage() {
  const { data: qrData, loading: qrLoading } = useQuery<{ myQrBadge: string }>(MY_QR_QUERY, { fetchPolicy: "cache-first" })

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
      downloadLink.download = "LXD-Identity-Badge.png"
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8 bg-[#F9F9F8] min-h-[calc(100vh-68px)] font-sans text-[#0A0A0A]">
      
      {/* Header Area */}
      <div>
        <h2 className="font-serif text-3xl mb-1">Your Profile</h2>
        <p className="text-[13px] text-[#878786]">Manage your account and view your badge.</p>
      </div>

      <section className="bg-[#FFFFFF] border border-[#E5E5E4] rounded-none p-6 shadow-sm">
        <StudentProfile />
      </section>

      {/* QR Code Section (Badge) */}
      <section className="space-y-4">
        <h3 className="font-serif text-2xl">Identity Badge</h3>
        
        <div className="border border-[#E5E5E4] bg-[#FFFFFF] p-6 sm:p-10 flex flex-col items-center justify-center gap-6 sm:gap-8 rounded-none shadow-sm text-center">
          <p className="font-sans text-[14px] sm:text-[15px] text-[#878786] leading-relaxed max-w-sm">
            Present this badge to the coordinator to log your attendance.
          </p>

          {qrLoading && !qrData?.myQrBadge ? (
            <div className="w-[200px] sm:w-[240px] h-[200px] sm:h-[240px] bg-[#F9F9F8] border border-[#E5E5E4] animate-pulse rounded-none" />
          ) : qrData?.myQrBadge ? (
            <div className="bg-[#FFFFFF] p-3 sm:p-4 border border-[#E5E5E4] rounded-none shadow-sm">
              <QRCode
                id="student-qr-code"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/scan?studentBadge=${encodeURIComponent(qrData.myQrBadge)}`}
                size={typeof window !== 'undefined' && window.innerWidth < 400 ? 180 : 220}
                level="H"
                fgColor="#0A0A0A"
              />
            </div>
          ) : (
            <div className="w-[200px] sm:w-[240px] h-[200px] sm:h-[240px] flex items-center justify-center bg-[#F9F9F8] border border-[#E5E5E4] rounded-none">
              <p className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#878786]">Error loading QR</p>
            </div>
          )}
          
          <button
            onClick={handleDownload}
            disabled={qrLoading || !qrData?.myQrBadge}
            className="flex items-center justify-center gap-2 px-6 h-[44px] border border-[#E5E5E4] bg-[#FFFFFF] text-[#0A0A0A] font-mono text-[11px] uppercase tracking-widest hover:bg-[#F9F9F8] hover:border-[#0A0A0A] transition-colors disabled:opacity-50 rounded-none w-full max-w-[260px]"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#878786] px-1">Account Actions</h3>
        
        <div className="bg-[#FFFFFF] border border-[#E5E5E4] rounded-none overflow-hidden shadow-sm">
          <ul className="divide-y divide-[#E5E5E4]">
            <li>
              <a href="/api/auth/signout" className="flex items-center justify-between p-4 hover:bg-[#F9F9F8] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-red-50 flex items-center justify-center border border-red-100">
                    <LogOut className="w-4 h-4 text-[#E54D2E]" />
                  </div>
                  <span className="font-medium text-[15px] text-[#E54D2E]">Sign Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#878786] group-hover:text-[#0A0A0A] transition-colors" />
              </a>
            </li>
          </ul>
        </div>
      </section>

    </div>
  )
}
