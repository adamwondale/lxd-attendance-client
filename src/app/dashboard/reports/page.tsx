"use client"

import { useMemo, useState } from "react"
import { gql } from "@apollo/client/core/index.js"
import { useQuery, useSubscription } from "@apollo/client/react/index.js"
import { Download, Printer, FileSpreadsheet, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const COHORTS = gql`
  query ReportCohorts { listCohorts { id name sessions { id name } } }
`
const REPORT = gql`
  query AttendanceReport($startDate: String!, $endDate: String!, $cohortId: String, $sessionId: String) {
    attendanceReport(startDate: $startDate, endDate: $endDate, cohortId: $cohortId, sessionId: $sessionId) {
      id date status traineeId traineeName cohortName sessionName latenessMinutes penalty
    }
  }
`

const ON_ATTENDANCE_UPDATED = gql`
  subscription OnAttendanceUpdated {
    onAttendanceUpdated
  }
`

function iso(d: Date) { return d.toISOString().slice(0, 10) }
function rangeFor(period: string) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  if (period === "month") start.setDate(1);
  else if (period === "year") { start.setMonth(0, 1); }
  else start.setDate(start.getDate() - 6);
  return { start: iso(start), end: iso(end) }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("week")
  const initial = rangeFor("week")
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [cohortId, setCohortId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const { data: cohortData } = useQuery(COHORTS, { fetchPolicy: "cache-first" })
  const { data, loading, refetch } = useQuery(REPORT, { variables: { startDate, endDate, cohortId: cohortId || undefined, sessionId: sessionId || undefined }, fetchPolicy: "cache-and-network" })

  useSubscription(ON_ATTENDANCE_UPDATED, { onData: () => refetch() })

  const cohorts = cohortData?.listCohorts || []
  const selectedCohort = cohorts.find((c: any) => c.id === cohortId)
  const rows = data?.attendanceReport || []
  const totals = useMemo(() => ({ present: rows.filter((r: any) => r.status === "Present").length, late: rows.filter((r: any) => r.status === "Late").length, absent: rows.filter((r: any) => r.status === "Absent").length, penalty: rows.reduce((n: number, r: any) => n + r.penalty, 0) }), [rows])

  const setPreset = (value: string) => { setPeriod(value); const r = rangeFor(value); setStartDate(r.start); setEndDate(r.end) }
  const exportExcel = () => {
    if (!rows.length) return toast("No report data to export")
    const escape = (v: any) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const table = `<table><tr><th>Date</th><th>Trainee</th><th>Cohort</th><th>Session</th><th>Status</th><th>Late Minutes</th><th>Penalty (ETB)</th></tr>${rows.map((r: any) => `<tr><td>${escape(r.date)}</td><td>${escape(r.traineeName)}</td><td>${escape(r.cohortName)}</td><td>${escape(r.sessionName)}</td><td>${escape(r.status)}</td><td>${r.latenessMinutes}</td><td>${r.penalty}</td></tr>`).join("")}</table>`
    const blob = new Blob([`<html><body>${table}</body></html>`], { type: "application/vnd.ms-excel;charset=utf-8" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `attendance-report-${startDate}-to-${endDate}.xls`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="p-10 space-y-8 max-w-[1600px] mx-auto text-secondary">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl mb-2 tracking-tight">Attendance Reports</h1>
          <p className="font-mono text-[13px] text-muted uppercase">
            Daily, monthly and yearly views across cohorts and sessions
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="h-11 px-5 border border-border bg-white text-secondary hover:bg-background transition-colors rounded-none flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
            <Printer className="w-4 h-4"/> Print
          </button>
          <button onClick={exportExcel} className="h-11 px-5 bg-secondary text-white hover:bg-secondary-hover transition-colors rounded-none flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4"/> Export Excel
          </button>
        </div>
      </div>

      {/* Filters (Print Hidden) */}
      <div className="print:hidden bg-surface border border-border p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <select value={period} onChange={e => setPreset(e.target.value)} className="h-11 border border-border bg-background px-3 text-[14px] font-sans focus:border-secondary outline-none transition-colors rounded-none appearance-none cursor-pointer">
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="custom">Custom</option>
        </select>
        <input type="date" value={startDate} onChange={e => {setPeriod("custom"); setStartDate(e.target.value)}} className="h-11 border border-border bg-background px-3 text-[14px] font-sans focus:border-secondary outline-none transition-colors rounded-none" />
        <input type="date" value={endDate} onChange={e => {setPeriod("custom"); setEndDate(e.target.value)}} className="h-11 border border-border bg-background px-3 text-[14px] font-sans focus:border-secondary outline-none transition-colors rounded-none" />
        <select value={cohortId} onChange={e => {setCohortId(e.target.value); setSessionId("")}} className="h-11 border border-border bg-background px-3 text-[14px] font-sans focus:border-secondary outline-none transition-colors rounded-none appearance-none cursor-pointer">
          <option value="">All Cohorts</option>
          {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2">
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="h-11 border border-border bg-background px-3 text-[14px] font-sans focus:border-secondary outline-none transition-colors rounded-none appearance-none cursor-pointer flex-1">
            <option value="">All Sessions</option>
            {(selectedCohort?.sessions || cohorts.flatMap((c:any) => c.sessions || [])).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => refetch()} className="h-11 w-11 border border-border bg-white hover:bg-background hover:text-secondary text-muted transition-colors rounded-none flex items-center justify-center shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-secondary' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border bg-surface">
        <Stat label="Present" value={totals.present} />
        <Stat label="Late" value={totals.late} />
        <Stat label="Absent" value={totals.absent} />
        <Stat label="Total Penalties" value={`${totals.penalty} ETB`} />
      </div>

      {/* Detailed Report Table */}
      <div className="bg-surface border border-border rounded-none overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Detailed Report</h2>
            <p className="text-[13px] text-muted font-mono mt-1 uppercase tracking-widest">{startDate} → {endDate}</p>
          </div>
          <div className="text-[11px] font-mono text-muted uppercase tracking-widest border border-border px-4 py-2 bg-background">
            {rows.length} records found
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] font-sans">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Date</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Trainee</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Cohort</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Session</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Status</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">Late</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal text-right">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest animate-pulse">
                    Generating report...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest">
                    No attendance data for the selected period
                  </td>
                </tr>
              ) : (
                rows.map((r:any) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                    <td className="p-4 font-mono text-[13px] whitespace-nowrap">{r.date}</td>
                    <td className="p-4 font-medium text-[15px]">{r.traineeName}</td>
                    <td className="p-4 text-muted text-[14px]">{r.cohortName}</td>
                    <td className="p-4 text-muted text-[14px]">{r.sessionName}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-[11px] font-mono uppercase tracking-widest border ${
                        r.status === 'Present' ? 'border-green-600 text-green-700' : 
                        r.status === 'Late' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 
                        'border-red-600 text-red-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-[14px]">
                      {r.latenessMinutes ? <span className="font-mono text-primary">{r.latenessMinutes} min</span> : <span className="text-muted">--</span>}
                    </td>
                    <td className="p-4 text-right">
                      {r.penalty ? <span className="font-mono text-primary text-[14px]">{r.penalty} ETB</span> : <span className="text-muted">--</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({label, value}: {label: string, value: any}) { 
  return (
    <div className="p-6 border-r border-border last:border-r-0 flex flex-col justify-center">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">{label}</p>
      <p className="text-3xl font-serif text-secondary">{value}</p>
    </div>
  ) 
}
