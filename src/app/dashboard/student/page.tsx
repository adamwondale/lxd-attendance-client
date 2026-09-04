'use client';

import { useQuery } from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';

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
        penalty {
          amount
          status
        }
      }
    }
  }
`;

type AttendanceSummaryData = {
  myAttendanceSummary: {
    presentDays: number;
    lateDays: number;
    totalPenalty: number;
    recentLogs: Array<{
      id: string;
      date: string;
      scannedAt: string;
      latenessMinutes: number;
      isLate: boolean;
      calculatedPenalty: number;
      penalty?: { amount: number; status: string } | null;
    }>;
  } | null;
};

export default function StudentDashboardPage() {
  const { data: summaryData, loading: summaryLoading } =
    useQuery<AttendanceSummaryData>(MY_ATTENDANCE_SUMMARY, {
      fetchPolicy: 'cache-and-network',
    });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-10 sm:space-y-12 text-foreground bg-background min-h-screen font-sans">
      {/* Stats Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        {[
          {
            label: 'Present',
            value: summaryData?.myAttendanceSummary?.presentDays ?? 0,
            colorClass: 'text-primary',
          },
          {
            label: 'Late',
            value: summaryData?.myAttendanceSummary?.lateDays ?? 0,
            colorClass: 'text-foreground',
          },
          {
            label: 'Penalties',
            value: `${summaryData?.myAttendanceSummary?.totalPenalty ?? 0} ETB`,
            colorClass: 'text-danger',
          },
        ].map(({ label, value, colorClass }) => (
          <div
            key={String(label)}
            className="p-4 sm:p-6 lg:p-8 flex flex-col items-center sm:items-start justify-center text-center sm:text-left rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xl shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-[10px] sm:text-[12px] uppercase tracking-widest text-muted font-mono mb-1.5 sm:mb-4">
              {label}
            </p>
            {summaryLoading && !summaryData?.myAttendanceSummary ? (
              <div className="h-12 sm:h-16 w-24 sm:w-32 bg-surface-subtle animate-pulse mt-1 rounded-xl" />
            ) : (
              <p
                className={`text-3xl sm:text-5xl lg:text-6xl font-serif tracking-tight ${colorClass} truncate max-w-full`}
              >
                {value}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Attendance Records */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-foreground">Attendance Record</h3>
        </div>
        <div className="bg-surface/85 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm overflow-hidden">
          {summaryLoading && !summaryData?.myAttendanceSummary ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-surface-subtle animate-pulse rounded-md" />
                    <div className="h-4 w-32 bg-surface-subtle animate-pulse rounded-md" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <div className="h-6 w-16 bg-surface-subtle animate-pulse rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (summaryData?.myAttendanceSummary?.recentLogs || []).length ? (
            <div className="divide-y divide-border">
              {(summaryData?.myAttendanceSummary?.recentLogs ?? [])
                .slice(0, 15)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 hover:bg-surface-hover/80 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[14px] sm:text-[15px] text-foreground">
                        {new Date(log.scannedAt).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-[12px] sm:text-[13px] mt-0.5 sm:mt-1 ${log.isLate ? 'text-danger' : 'text-muted'}`}
                      >
                        {log.isLate
                          ? `${log.latenessMinutes} min late`
                          : 'On time'}
                      </p>
                    </div>
                    <div className="text-right">
                      {log.isLate ? (
                        <>
                          <p className="font-serif text-base sm:text-lg text-danger whitespace-nowrap">
                            {log.penalty?.amount ?? log.calculatedPenalty ?? 0}{' '}
                            ETB
                          </p>
                          <p className="text-[9px] sm:text-[11px] uppercase tracking-widest font-mono text-muted">
                            {log.penalty?.status ?? 'UNPAID'}
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-surface text-success font-mono text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-10 text-center text-[13px] text-muted font-mono uppercase tracking-widest">
              No attendance records yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
