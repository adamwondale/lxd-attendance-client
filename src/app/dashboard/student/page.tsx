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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-10 sm:space-y-12 text-primary bg-[#F9F9F8] min-h-full font-sans">
      <div className="mx-auto space-y-12 text-secondary bg-background min-h-screen font-sans">
      
      {/* Stats Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: 'Present',
              value: summaryData?.myAttendanceSummary?.presentDays ?? 0,
              colorClass: 'text-secondary',
            },
            {
              label: 'Late',
              value: summaryData?.myAttendanceSummary?.lateDays ?? 0,
              colorClass: 'text-secondary',
            },
            {
              label: 'Penalties',
              value: `${summaryData?.myAttendanceSummary?.totalPenalty ?? 0} ETB`,
              colorClass: 'text-primary',
            },
          ].map(({ label, value, colorClass }) => (
          <div
            key={String(label)}
            className="p-8 sm:p-10 flex flex-col items-center sm:items-start justify-center text-center sm:text-left border border-[#E5E5E4] bg-[#FFFFFF]"
          >
            <p className="text-[11px] sm:text-[12px] uppercase tracking-widest text-[#878786] font-mono mb-2 sm:mb-4">
              {label}
            </p>
            {summaryLoading && !summaryData?.myAttendanceSummary ? (
              <div className="h-16 w-32 bg-background animate-pulse mt-1" />
            ) : (
              <p
                className={`text-4xl sm:text-6xl lg:text-7xl font-serif tracking-tight ${colorClass}`}
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
          <h3 className="font-serif text-2xl">Attendance Record</h3>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E5E4] rounded-none shadow-sm">
          {summaryLoading && !summaryData?.myAttendanceSummary ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-background animate-pulse" />
                    <div className="h-4 w-32 bg-background animate-pulse" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <div className="h-6 w-16 bg-background animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (summaryData?.myAttendanceSummary?.recentLogs || []).length ? (
            <div className="divide-y divide-[#E5E5E4]">
              {(summaryData?.myAttendanceSummary?.recentLogs ?? [])
                .slice(0, 15)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 hover:bg-[#F9F9F8] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[14px] sm:text-[15px]">
                        {new Date(log.scannedAt).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-[12px] sm:text-[13px] mt-0.5 sm:mt-1 ${log.isLate ? 'text-[#E54D2E]' : 'text-[#878786]'}`}
                      >
                        {log.isLate
                          ? `${log.latenessMinutes} min late`
                          : 'On time'}
                      </p>
                    </div>
                    <div className="text-right">
                      {log.isLate ? (
                        <>
                          <p className="font-serif text-base sm:text-lg text-[#E54D2E] whitespace-nowrap">
                            {log.penalty?.amount ?? log.calculatedPenalty ?? 0}{' '}
                            ETB
                          </p>
                          <p className="text-[9px] sm:text-[11px] uppercase tracking-widest font-mono text-[#878786]">
                            {log.penalty?.status ?? 'UNPAID'}
                          </p>
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
          ) : (
            <div className="p-10 text-center text-[13px] text-[#878786] font-mono uppercase tracking-widest">
              No attendance records yet.
            </div>
          )}
        </div>
      </section>
    </div>
    </div>
  );
}
