'use client';

import {
  useQuery,
  useMutation,
  useSubscription,
} from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Check, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const GET_ATTENDANCE_LOGS = gql`
  query GetAttendanceLogs {
    getAttendanceLogs {
      id
      scannedAt
      isLate
      latenessMinutes
      calculatedPenalty
      date
      isManualScan
      user {
        id
        name
        email
      }
      penalty {
        id
        amount
        status
      }
    }
  }
`;

const WAIVE_PENALTY = gql`
  mutation WaivePenalty($penaltyId: String!, $reason: String!) {
    waivePenalty(penaltyId: $penaltyId, reason: $reason) {
      id
      status
    }
  }
`;

const ON_ATTENDANCE_UPDATED = gql`
  subscription OnAttendanceUpdated {
    onAttendanceUpdated
  }
`;

interface AttendanceLog {
  id: string;
  scannedAt: string;
  isLate: boolean;
  latenessMinutes: number;
  calculatedPenalty: number;
  date: string;
  isManualScan: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  penalty: {
    id: string;
    amount: number;
    status: string;
  } | null;
}

interface GetAttendanceLogsData {
  getAttendanceLogs: AttendanceLog[];
}

export default function AttendancePage() {
  const { data, loading, refetch } = useQuery<GetAttendanceLogsData>(GET_ATTENDANCE_LOGS, {
    fetchPolicy: 'cache-and-network',
  });
  
  const attendanceLogs = data?.getAttendanceLogs ?? [];

  useSubscription(ON_ATTENDANCE_UPDATED, { onData: () => refetch() });

  const [waivePenalty, { loading: waiving }] = useMutation(WAIVE_PENALTY);
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const PAGE_SIZE = 7;
  const totalPages = Math.max(1, Math.ceil(attendanceLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = attendanceLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleWaive = async (penaltyId: string) => {
    const reason = window.prompt("Enter reason for waiving this penalty:");
    if (!reason) return;
    
    try {
      setWaivingId(penaltyId);
      await waivePenalty({ variables: { penaltyId, reason } });
      toast.success('Penalty waived successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to waive penalty');
    } finally {
      setWaivingId(null);
    }
  };

  const exportToExcel = () => {
    if (!attendanceLogs.length) { toast('No data to export'); return; }
    const escape = (value: unknown) => String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const body = attendanceLogs.map((log) => `<tr>
      <td>${escape(log.user.name)}</td><td>${escape(log.user.email)}</td><td>${escape(log.date)}</td>
      <td>${escape(new Date(log.scannedAt).toLocaleTimeString())}</td><td>${log.isLate ? 'Late' : 'Present'}</td>
      <td>${log.latenessMinutes || 0}</td><td>${log.penalty?.amount ?? 0}</td><td>${escape(log.penalty?.status ?? 'N/A')}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif;color:#111} h1{font-size:22px;margin:0 0 6px} p{color:#666;margin:0 0 18px;font-size:12px}
      table{border-collapse:collapse;width:100%} th{background:#0A0A0A;color:#fff;font-weight:700;text-align:left;padding:10px;border:1px solid #ddd} td{padding:9px;border:1px solid #ddd} tr:nth-child(even){background:#f7f7f5}
    </style></head><body><h1>LXD Attendance Report</h1><p>Generated ${escape(new Date().toLocaleString())} · ${attendanceLogs.length} records</p>
    <table><thead><tr><th>Student Name</th><th>Email</th><th>Date</th><th>Time</th><th>Status</th><th>Late Minutes</th><th>Penalty (ETB)</th><th>Penalty Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `attendance-${new Date().toISOString().slice(0,10)}.xls`; a.click(); URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!attendanceLogs.length) { toast('No data to export'); return; }
    // Uses the browser's native print engine so Chrome, Edge, Firefox, macOS and Windows can save a clean PDF.
    setPrinting(true);
    window.setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 bg-background text-foreground">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2 text-foreground">Attendance</h1>
          <p className="font-mono text-[13px] text-muted uppercase">
            All Cohort Scans
          </p>
        </div>
        <div className="print:hidden flex flex-wrap gap-2">
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 rounded-none">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2 rounded-none">
            <FileText className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && attendanceLogs.length === 0 ? (
            <>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 w-32 bg-surface-subtle rounded-none mb-2"></div>
                    <div className="h-3 w-48 bg-surface-subtle rounded-none"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-subtle rounded-none mb-2"></div>
                    <div className="h-3 w-16 bg-surface-subtle rounded-none"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 bg-surface-subtle rounded-none"></div>
                  </TableCell>
                  <TableCell className="text-right flex justify-end">
                    <div className="h-8 w-8 bg-surface-subtle rounded-none"></div>
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : attendanceLogs.length > 0 ? (
            <>
              {(printing ? attendanceLogs : pagedLogs).map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium text-[15px] text-foreground">
                      {log.user.name}
                    </div>
                    <div className="text-[13px] text-muted">
                      {log.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[14px] text-foreground">
                      <div>
                        {new Date(log.scannedAt).toLocaleDateString('en-US', { weekday: 'long' })}, {log.date || new Date(log.scannedAt).toLocaleDateString()}
                      </div>
                      <div className="text-[12px] text-muted font-mono">
                        {new Date(log.scannedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-[12px] font-mono uppercase border ${
                        log.isLate
                          ? 'border-danger text-danger bg-danger-surface'
                          : 'border-success/30 text-success bg-success-surface'
                      }`}
                    >
                      {log.isLate
                        ? `Late · ${log.latenessMinutes || 0} min`
                        : 'Present'}
                    </span>
                    {log.penalty && (
                      <div className="text-[11px] font-mono mt-1 text-muted">
                        Fee: {log.penalty.amount} ETB ({log.penalty.status})
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex justify-end">
                    {log.penalty && log.penalty.status === 'UNPAID' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWaive(log.penalty.id)}
                        disabled={waiving && waivingId === log.penalty.id}
                        className="h-8 text-[12px] border-border text-foreground hover:bg-surface-hover"
                      >
                        {waiving && waivingId === log.penalty.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Waive Fee'
                        )}
                      </Button>
                    )}
                    {log.penalty && log.penalty.status === 'WAIVED' && (
                      <span className="flex items-center gap-1 text-[12px] font-mono text-success bg-success-surface px-2 py-1 rounded-none border border-success/20">
                        <Check className="w-3 h-3" /> Waived
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center p-8 text-muted font-mono text-[13px] uppercase"
              >
                No attendance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {attendanceLogs.length > PAGE_SIZE && (
        <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none border border-border bg-surface px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Page {safePage} of {totalPages} · {attendanceLogs.length} records</span>
          <div className="flex items-center gap-2">
            <button aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-none border border-border bg-surface text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4 mx-auto" /></button>
            <button aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-9 w-9 rounded-none border border-border bg-surface text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4 mx-auto" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
