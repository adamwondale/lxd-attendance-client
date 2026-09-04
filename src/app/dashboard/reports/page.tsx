'use client';

import { useEffect, useMemo, useState } from 'react';
import { gql } from '@apollo/client/core/index.js';
import { useQuery, useSubscription, useApolloClient } from '@apollo/client/react/index.js';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const COHORTS = gql`
  query ReportCohorts {
    listCohorts {
      id
      name
      sessions {
        id
        name
      }
    }
  }
`;
const REPORT = gql`
  query AttendanceReport(
    $startDate: String!
    $endDate: String!
    $cohortId: String
    $sessionId: String
    $page: Int
    $limit: Int
  ) {
    attendanceReport(
      startDate: $startDate
      endDate: $endDate
      cohortId: $cohortId
      sessionId: $sessionId
      page: $page
      limit: $limit
    ) {
      data {
        id
        date
        status
        traineeId
        traineeName
        cohortName
        sessionName
        latenessMinutes
        penalty
      }
      totalCount
      summary {
        present
        late
        absent
        penalty
      }
    }
  }
`;

type ReportCohort = {
  id: string;
  name: string;
  sessions: Array<{ id: string; name: string }>;
};
type ReportCohortsData = { listCohorts: ReportCohort[] };
type ReportRow = {
  id: string;
  date: string;
  status: string;
  traineeId: string;
  traineeName: string;
  cohortName: string;
  sessionName: string;
  latenessMinutes: number;
  penalty: number;
};
type ReportData = { 
  attendanceReport: {
    data: ReportRow[];
    totalCount: number;
    summary: { present: number; late: number; absent: number; penalty: number };
  }
};

const ON_ATTENDANCE_UPDATED = gql`
  subscription OnAttendanceUpdated {
    onAttendanceUpdated
  }
`;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function rangeFor(period: string) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  if (period === 'month') start.setDate(1);
  else if (period === 'year') {
    start.setMonth(0, 1);
  } else start.setDate(start.getDate() - 6);
  return { start: iso(start), end: iso(end) };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('week');
  const initial = rangeFor('week');
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [cohortId, setCohortId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const client = useApolloClient();

  const { data: cohortData } = useQuery<ReportCohortsData>(COHORTS, {
    fetchPolicy: 'cache-first',
  });
  const { data, previousData, loading, error, refetch } = useQuery<ReportData>(REPORT, {
    variables: {
      startDate,
      endDate,
      cohortId: cohortId || undefined,
      sessionId: sessionId || undefined,
      page,
      limit: PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  useSubscription(ON_ATTENDANCE_UPDATED, { onData: () => refetch() });

  const cohorts = cohortData?.listCohorts || [];
  const selectedCohort = cohorts.find((c: any) => c.id === cohortId);
  const activeData = data ?? previousData;
  const reportData = activeData?.attendanceReport;
  const rawRows = reportData?.data || [];
  
  const totalCount = reportData?.totalCount ?? rawRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  
  // Resilient pagination: handles both server-paginated and full-array server responses
  const displayRows = rawRows.length > PAGE_SIZE 
    ? rawRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) 
    : rawRows;

  useEffect(() => {
    // Only clamp if not loading, data exists, and page strictly exceeds totalPages
    if (!loading && reportData && page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, loading, reportData]);

  const totals = reportData?.summary || { present: 0, late: 0, absent: 0, penalty: 0 };

  const setPreset = (value: string) => {
    setPeriod(value);
    setPage(1);
    const r = rangeFor(value);
    setStartDate(r.start);
    setEndDate(r.end);
  };
  const fetchAllReportData = async () => {
    const res = await client.query<ReportData>({
      query: REPORT,
      variables: {
        startDate,
        endDate,
        cohortId: cohortId || undefined,
        sessionId: sessionId || undefined,
        page: 1,
        limit: 1000000,
      },
      fetchPolicy: 'network-only',
    });
    return res.data?.attendanceReport.data || [];
  };

  const exportExcel = async () => {
    if (!totalCount) return toast('No report data to export');
    setExporting(true);
    try {
      const allRows = await fetchAllReportData();
      const escape = (value: unknown) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      const body = allRows
        .map(
          (r: any) =>
            `<tr><td>${escape(r.date)}</td><td>${escape(r.traineeName)}</td><td>${escape(r.cohortName)}</td><td>${escape(r.sessionName)}</td><td>${escape(r.status)}</td><td>${r.latenessMinutes || 0}</td><td>${r.penalty || 0}</td></tr>`,
        )
        .join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#111}h1{font-size:22px;margin:0 0 6px}p{color:#666;margin:0 0 18px;font-size:12px}table{border-collapse:collapse;width:100%}th{background:#0A0A0A;color:#fff;font-weight:700;text-align:left;padding:10px;border:1px solid #ddd}td{padding:9px;border:1px solid #ddd}tr:nth-child(even){background:#f7f7f5}</style></head><body><h1>Hulu Track Attendance Report</h1><p><strong>From:</strong> ${escape(startDate)} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>To:</strong> ${escape(endDate)} · ${allRows.length} records</p><table><thead><tr><th>Date</th><th>Trainee</th><th>Cohort</th><th>Session</th><th>Status</th><th>Late Minutes</th><th>Penalty (ETB)</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
      const blob = new Blob([html], {
        type: 'application/vnd.ms-excel;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-from-${startDate}-to-${endDate}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const printFullReport = async () => {
    if (!totalCount) return toast('No report data to print');
    setPrinting(true);
    try {
      const allRows = await fetchAllReportData();
      const escape = (value: unknown) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
          
      const body = allRows
        .map(
          (r: any) =>
            `<tr>
              <td style="white-space:nowrap">${escape(r.date)}</td>
              <td><strong>${escape(r.traineeName)}</strong></td>
              <td style="color:#666">${escape(r.cohortName)}</td>
              <td style="color:#666">${escape(r.sessionName)}</td>
              <td>${escape(r.status)}</td>
              <td>${r.latenessMinutes ? r.latenessMinutes + ' min' : '--'}</td>
              <td>${r.penalty ? r.penalty + ' ETB' : '--'}</td>
            </tr>`,
        )
        .join('');
        
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Hulu Track Attendance Report</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0A0A0A; line-height: 1.4; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 2px solid #0A0A0A; padding-bottom: 12px; }
          .title { margin: 0; font-size: 24px; font-weight: 700; font-family: sans-serif; }
          .range-box { display: inline-flex; gap: 14px; margin-top: 6px; font-size: 11px; color: #334155; }
          .meta { margin: 0; color: #64748B; font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.5px; }
          table { border-collapse: collapse; width: 100%; text-align: left; margin-top: 10px; }
          th { padding: 8px 6px; border-bottom: 2px solid #0A0A0A; font-family: monospace; font-size: 9px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 600; }
          td { padding: 10px 6px; border-bottom: 1px solid #E2E8F0; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; }
          .summary-item { border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 18px; flex: 1; }
          .summary-label { font-family: monospace; font-size: 9px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
          .summary-value { font-size: 20px; font-weight: 700; margin: 0; color: #0F172A; }
        </style>
        </head><body>
          <div class="header">
            <div>
              <h1 class="title">Hulu Track &middot; Attendance Report</h1>
              <div class="range-box">
                <span><strong>From:</strong> ${escape(startDate)}</span>
                <span>&bull;</span>
                <span><strong>To:</strong> ${escape(endDate)}</span>
                ${selectedCohort ? `<span>&bull;</span><span><strong>Cohort:</strong> ${escape(selectedCohort.name)}</span>` : ''}
              </div>
            </div>
            <div class="meta" style="text-align: right;">
              <div><strong>${allRows.length}</strong> TOTAL RECORDS</div>
              <div style="font-size: 9px; color: #94A3B8; margin-top: 4px;">Generated on ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="summary">
            <div class="summary-item"><div class="summary-label">Present</div><div class="summary-value">${totals.present}</div></div>
            <div class="summary-item"><div class="summary-label">Late</div><div class="summary-value">${totals.late}</div></div>
            <div class="summary-item"><div class="summary-label">Absent</div><div class="summary-value">${totals.absent}</div></div>
            <div class="summary-item"><div class="summary-label">Penalties</div><div class="summary-value">${totals.penalty} ETB</div></div>
          </div>
          <table><thead><tr><th>Date</th><th>Trainee</th><th>Cohort</th><th>Session</th><th>Status</th><th>Late</th><th>Penalty</th></tr></thead><tbody>${body}</tbody></table>
        </body></html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      }
    } catch (e) {
      toast.error("Failed to prepare print document");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
            Attendance Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily, monthly and yearly views across cohorts and sessions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={printFullReport}
            disabled={printing}
            className="h-11 px-5 border border-border bg-surface text-foreground hover:bg-surface-hover transition-all rounded-xl flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {printing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Print
          </button>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="h-11 px-5 bg-primary text-primary-foreground hover:bg-primary-hover transition-all rounded-xl flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Export Excel
          </button>
        </div>
      </div>

      {/* Filters (Print Hidden) */}
      <div className="print:hidden bg-surface/85 backdrop-blur-xl border border-border/80 p-6 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            Period
          </label>
          <select
            value={period}
            onChange={(e) => setPreset(e.target.value)}
            className="w-full h-11 border border-border bg-surface-subtle text-foreground px-3.5 text-[14px] font-sans focus:border-primary outline-none transition-colors rounded-xl appearance-none cursor-pointer"
          >
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            From
          </label>
          <input
            type="date"
            aria-label="From Date"
            value={startDate}
            onChange={(e) => {
              setPeriod('custom');
              setPage(1);
              setStartDate(e.target.value);
            }}
            className="w-full h-11 border border-border bg-surface-subtle text-foreground px-3.5 text-[14px] font-sans focus:border-primary outline-none transition-colors rounded-xl cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            To
          </label>
          <input
            type="date"
            aria-label="To Date"
            value={endDate}
            onChange={(e) => {
              setPeriod('custom');
              setPage(1);
              setEndDate(e.target.value);
            }}
            className="w-full h-11 border border-border bg-surface-subtle text-foreground px-3.5 text-[14px] font-sans focus:border-primary outline-none transition-colors rounded-xl cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            Cohort
          </label>
          <select
            value={cohortId}
            onChange={(e) => {
              setCohortId(e.target.value);
              setSessionId('');
              setPage(1);
            }}
            className="w-full h-11 border border-border bg-surface-subtle text-foreground px-3.5 text-[14px] font-sans focus:border-primary outline-none transition-colors rounded-xl appearance-none cursor-pointer"
          >
            <option value="">All Cohorts</option>
            {cohorts.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            Session
          </label>
          <div className="flex gap-2">
            <select
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setPage(1);
              }}
              className="h-11 border border-border bg-surface-subtle text-foreground px-3.5 text-[14px] font-sans focus:border-primary outline-none transition-colors rounded-xl appearance-none cursor-pointer flex-1"
            >
              <option value="">All Sessions</option>
              {(
                selectedCohort?.sessions ||
                cohorts.flatMap((c: any) => c.sessions || [])
              ).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => refetch()}
              title="Refresh report data"
              aria-label="Refresh report data"
              className="h-11 w-11 border border-border bg-surface hover:bg-surface-hover text-muted hover:text-foreground transition-all rounded-xl flex items-center justify-center shrink-0 active:scale-95 shadow-sm cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border/80 bg-surface/85 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
        <Stat label="Present" value={totals.present} />
        <Stat label="Late" value={totals.late} />
        <Stat label="Absent" value={totals.absent} />
        <Stat label="Total Penalties" value={`${totals.penalty} ETB`} />
      </div>

      {/* Detailed Report Table */}
      <div className="bg-surface/85 backdrop-blur-xl border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Detailed Report</h2>
            <p className="text-sm text-muted-foreground mt-1">
              From: <span className="text-foreground font-semibold">{startDate}</span> &nbsp;&bull;&nbsp; To: <span className="text-foreground font-semibold">{endDate}</span>
            </p>
          </div>
          <div className="text-[11px] font-mono text-muted uppercase tracking-widest border border-border/80 px-4 py-2 bg-surface-subtle rounded-xl">
            {totalCount} records found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] font-sans">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Date
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Trainee
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Cohort
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Session
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Status
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal">
                  Late
                </th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted font-normal text-right">
                  Penalty
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && !activeData ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest animate-pulse"
                  >
                    Generating report...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-danger font-mono text-xs"
                  >
                    Failed to load report: {error.message}
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-3 block mx-auto px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground font-sans text-xs hover:bg-surface-hover cursor-pointer"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                  >
                    No attendance data for the selected period
                  </td>
                </tr>
              ) : (
                displayRows.map((r: any) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border/70 last:border-0 hover:bg-surface-hover/80 transition-colors ${
                      loading ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <td className="p-4 font-mono text-[13px] whitespace-nowrap text-foreground">
                      {r.date}
                    </td>
                    <td className="p-4 font-medium text-[15px] text-foreground">
                      {r.traineeName}
                    </td>
                    <td className="p-4 text-muted-foreground text-[14px]">
                      {r.cohortName}
                    </td>
                    <td className="p-4 text-muted-foreground text-[14px]">
                      {r.sessionName}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          r.status === 'Present'
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : r.status === 'Late'
                              ? 'border-secondary/20 bg-secondary/10 text-secondary'
                              : 'border-danger/20 bg-danger/10 text-danger'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-[14px]">
                      {r.latenessMinutes ? (
                        <span className="font-mono text-primary font-medium">
                          {r.latenessMinutes} min
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {r.penalty ? (
                        <span className="font-mono text-danger font-medium text-[14px]">
                          {r.penalty} ETB
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xl px-5 py-3.5 shadow-sm">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Page {safePage} of {totalPages} &nbsp;&bull;&nbsp; {totalCount} records
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              disabled={safePage <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 mx-auto" />
            </button>
            <span className="text-xs font-mono font-medium px-2 text-foreground">
              {safePage} / {totalPages}
            </span>
            <button
              aria-label="Next page"
              disabled={safePage >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-6 border-r border-border/80 last:border-r-0 flex flex-col justify-center">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
        {label}
      </p>
      <p className="text-3xl font-serif text-foreground">{value}</p>
    </div>
  );
}
