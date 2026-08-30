export declare class UserReference {
    id: string;
    name: string;
    email?: string;
}
export declare class Penalty {
    id: string;
    amount: number;
    status: string;
}
export declare class AttendanceLog {
    id: string;
    date: string;
    scannedAt: Date;
    isLate: boolean;
    latenessMinutes: number;
    calculatedPenalty: number;
    isManualScan: boolean;
    user: UserReference;
    penalty?: Penalty;
}
export declare class AttendanceEvent {
    id: string;
    cohortId: string;
    sessionId: string;
    date: string;
    scannedAt: Date;
    user: UserReference;
    isLate: boolean;
    latenessMinutes: number;
    calculatedPenalty: number;
}
export declare class AttendanceReportRow {
    id: string;
    date: string;
    status: string;
    traineeId: string;
    traineeName: string;
    sessionName?: string;
    cohortName?: string;
    latenessMinutes: number;
    penalty: number;
}
export declare class StudentAttendanceSummary {
    presentDays: number;
    lateDays: number;
    totalPenalty: number;
    lateLogs: AttendanceLog[];
}
