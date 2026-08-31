"use client"

import { useMemo, useState } from "react"
import { gql } from "@apollo/client/core/index.js"
import { useQuery } from "@apollo/client/react/index.js"
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
  const { data, loading, refetch } = useQuery(REPORT, { variables: { startDate, endDate, cohortId: cohortId || undefined, sessionId: sessionId || undefined }, fetchPolicy: "network-only" })

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

  return <div className="p-5 md:p-10 space-y-7 max-w-[1500px] mx-auto">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
      <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-black/40">Analytics & exports</p><h1 className="font-serif text-4xl md:text-5xl tracking-tight mt-2">Attendance Reports</h1><p className="text-sm text-black/50 mt-2">Daily, monthly and yearly views across cohorts and sessions.</p></div>
      <div className="flex gap-2"><button onClick={() => window.print()} className="interactive h-10 px-4 rounded-xl border border-black/10 bg-white flex items-center gap-2 text-sm"><Printer className="w-4 h-4"/> Print / PDF</button><button onClick={exportExcel} className="interactive h-10 px-4 rounded-xl bg-black text-white flex items-center gap-2 text-sm"><FileSpreadsheet className="w-4 h-4"/> Excel</button></div>
    </div>

    <div className="print:hidden rounded-2xl border border-black/5 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <select value={period} onChange={e => setPreset(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-[#F9F9F8] px-3 text-sm"><option value="week">Last 7 days</option><option value="month">This month</option><option value="year">This year</option><option value="custom">Custom</option></select>
      <input type="date" value={startDate} onChange={e => {setPeriod("custom"); setStartDate(e.target.value)}} className="h-11 rounded-xl border border-black/10 px-3 text-sm" />
      <input type="date" value={endDate} onChange={e => {setPeriod("custom"); setEndDate(e.target.value)}} className="h-11 rounded-xl border border-black/10 px-3 text-sm" />
      <select value={cohortId} onChange={e => {setCohortId(e.target.value); setSessionId("")}} className="h-11 rounded-xl border border-black/10 bg-[#F9F9F8] px-3 text-sm"><option value="">All cohorts</option>{cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <div className="flex gap-2"><select value={sessionId} onChange={e => setSessionId(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-[#F9F9F8] px-3 text-sm flex-1"><option value="">All sessions</option>{(selectedCohort?.sessions || cohorts.flatMap((c:any) => c.sessions || [])).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button onClick={() => refetch()} className="h-11 w-11 rounded-xl border border-black/10 hover:bg-black hover:text-white transition-colors flex items-center justify-center"><RefreshCw className="w-4 h-4"/></button></div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Present" value={totals.present}/><Stat label="Late" value={totals.late}/><Stat label="Absent" value={totals.absent}/><Stat label="Penalties" value={`${totals.penalty} ETB`}/></div>

    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-black/5 flex justify-between"><div><h2 className="font-medium">Detailed report</h2><p className="text-xs text-black/40 mt-1">{startDate} → {endDate}</p></div><span className="text-xs font-mono text-black/40">{rows.length} records</span></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[10px] uppercase tracking-widest text-black/40 border-b border-black/5"><th className="p-4">Date</th><th className="p-4">Trainee</th><th className="p-4">Cohort</th><th className="p-4">Session</th><th className="p-4">Status</th><th className="p-4">Late</th><th className="p-4 text-right">Penalty</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-12 text-center text-black/40">Generating report…</td></tr> : rows.map((r:any) => <tr key={r.id} className="border-b border-black/5 last:border-0 hover:bg-black/[.02] transition-colors"><td className="p-4 font-mono text-xs">{r.date}</td><td className="p-4 font-medium">{r.traineeName}</td><td className="p-4 text-black/55">{r.cohortName}</td><td className="p-4 text-black/55">{r.sessionName}</td><td className="p-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase ${r.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span></td><td className="p-4">{r.latenessMinutes ? `${r.latenessMinutes} min` : '—'}</td><td className="p-4 text-right font-medium">{r.penalty ? `${r.penalty} ETB` : '—'}</td></tr>)}{!loading && !rows.length && <tr><td colSpan={7} className="p-12 text-center text-black/40">No attendance data for the selected period.</td></tr>}</tbody></table></div>
    </div>
  </div>
}
function Stat({label,value}:{label:string,value:any}) { return <div className="surface-lift bg-white rounded-2xl border border-black/5 p-4"><p className="text-[10px] font-mono uppercase tracking-widest text-black/40">{label}</p><p className="text-2xl font-semibold mt-2">{value}</p></div> }
