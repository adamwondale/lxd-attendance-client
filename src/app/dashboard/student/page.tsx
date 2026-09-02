"use client"

import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"

const MY_ATTENDANCE_SUMMARY = gql`
  query MyAttendanceSummary {
    myAttendanceSummary {
      presentDays
      lateDays
      totalPenalty
      recentLogs {
        id
        date
        scannedAt
        latenessMinutes
        isLate
        calculatedPenalty
        penalty { amount status }
      }
    }
  }
`

export default function StudentDashboardPage() {
  const { data: summaryData, loading: summaryLoading } = useQuery(MY_ATTENDANCE_SUMMARY, { fetchPolicy: "cache-and-network" })

  return (
    <div className="p-6 max-w-[640px] mx-auto space-y-12 text-[#0A0A0A] bg-[#F9F9F8] min-h-screen font-sans">
      
      {/* Stats Summary */}
      <section className="grid grid-cols-3 gap-0 border border-[#E5E5E4] bg-[#FFFFFF]">
        {[
          ['Present', summaryData?.myAttendanceSummary?.presentDays ?? 0],
          ['Late', summaryData?.myAttendanceSummary?.lateDays ?? 0],
          ['Penalties', `${summaryData?.myAttendanceSummary?.totalPenalty ?? 0} ETB`],
        ].map(([label, value], idx) => (
          <div key={String(label)} className={`p-3 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left ${idx > 0 ? 'border-l border-[#E5E5E4]' : ''}`}>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#878786] font-mono mb-1 sm:mb-2 w-full truncate">{label}</p>
            {summaryLoading && !summaryData?.myAttendanceSummary ? (
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-[#F9F9F8] animate-pulse mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-serif whitespace-nowrap">{value}</p>
            )}
          </div>
        ))}
      </section>

      {/* Attendance Records */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Attendance Record</h3>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E5E4] rounded-none shadow-sm">
          {summaryLoading && !summaryData?.myAttendanceSummary ? (
            <div className="divide-y divide-[#E5E5E4]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-[#F9F9F8] animate-pulse" />
                    <div className="h-4 w-32 bg-[#F9F9F8] animate-pulse" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <div className="h-6 w-16 bg-[#F9F9F8] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (summaryData?.myAttendanceSummary?.recentLogs || []).length ? (
            <div className="divide-y divide-[#E5E5E4]">
              {summaryData.myAttendanceSummary.recentLogs.slice(0, 15).map((log: any) => (
                <div key={log.id} className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 hover:bg-[#F9F9F8] transition-colors">
                  <div>
                    <p className="font-medium text-[14px] sm:text-[15px]">{new Date(log.scannedAt).toLocaleDateString()}</p>
                    <p className={`text-[12px] sm:text-[13px] mt-0.5 sm:mt-1 ${log.isLate ? 'text-[#E54D2E]' : 'text-[#878786]'}`}>
                      {log.isLate ? `${log.latenessMinutes} min late` : 'On time'}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.isLate ? (
                      <>
                        <p className="font-serif text-base sm:text-lg text-[#E54D2E] whitespace-nowrap">{log.penalty?.amount ?? log.calculatedPenalty ?? 0} ETB</p>
                        <p className="text-[9px] sm:text-[11px] uppercase tracking-widest font-mono text-[#878786]">{log.penalty?.status ?? 'UNPAID'}</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 font-mono text-[10px]">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="p-10 text-center text-[13px] text-[#878786] font-mono uppercase tracking-widest">No attendance records yet.</div>}
        </div>
      </section>

    </div>
  )
}
