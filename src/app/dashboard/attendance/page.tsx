'use client';

import {
  useQuery,
  useMutation,
  useSubscription,
} from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

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

  const exportToCSV = () => {
    if (attendanceLogs.length === 0) {
      toast('No data to export');
      return;
    }

    const headers = [
      'Student Name',
      'Email',
      'Date',
      'Time',
      'Status',
      'Late Minutes',
      'Penalty Amount',
      'Penalty Status',
    ];

    const rows = attendanceLogs.map((log: any) => {
      const date = new Date(log.scannedAt).toLocaleDateString();
      const time = new Date(log.scannedAt).toLocaleTimeString();
      const status = log.isLate ? 'Late' : 'Present';
      const penaltyAmount = log.penalty ? log.penalty.amount : 0;
      const penaltyStatus = log.penalty ? log.penalty.status : 'N/A';

      return [
        `"${log.user.name}"`,
        `"${log.user.email}"`,
        date,
        time,
        status,
        log.latenessMinutes || 0,
        penaltyAmount,
        penaltyStatus,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `attendance_export_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2">Attendance</h1>
          <p className="font-mono text-[13px] text-muted uppercase">
            All Cohort Scans
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
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
                    <div className="h-4 w-32 bg-black/5 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-black/5 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 bg-black/5 rounded"></div>
                  </TableCell>
                  <TableCell className="text-right flex justify-end">
                    <div className="h-8 w-8 bg-black/10 rounded"></div>
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : attendanceLogs.length > 0 ? (
            <>
              {attendanceLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium text-[15px]">
                      {log.user.name}
                    </div>
                    <div className="text-[13px] text-muted">
                      {log.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[14px]">
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
                          ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                          : 'border-green-600 text-green-700'
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
                        className="h-8 text-[12px] border-black text-black hover:bg-black hover:text-white"
                      >
                        {waiving && waivingId === log.penalty.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Waive Fee'
                        )}
                      </Button>
                    )}
                    {log.penalty && log.penalty.status === 'WAIVED' && (
                      <span className="flex items-center gap-1 text-[12px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
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
                className="text-center p-8 text-[var(--color-muted)] font-mono text-[13px] uppercase"
              >
                No attendance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
