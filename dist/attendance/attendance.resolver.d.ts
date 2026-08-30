import { AttendanceService } from './attendance.service';
import { PubSub } from 'graphql-subscriptions';
export declare class AttendanceResolver {
    private readonly attendanceService;
    private pubSub;
    constructor(attendanceService: AttendanceService, pubSub: PubSub);
    myAttendanceSummary(user: any): Promise<{
        presentDays: number;
        lateDays: number;
        totalPenalty: number;
        lateLogs: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
            penalty: {
                id: string;
                userId: string;
                status: string;
                attendanceLogId: string;
                amount: number;
                createdAt: Date;
            } | null;
            session: {
                id: string;
                name: string;
                cohortId: string;
                startTime: string;
                gracePeriodMinutes: number;
                recurrenceDays: string[];
                latePenaltyAmount: number;
                escalationThresholdMinutes: number;
                escalationRate: number;
                escalationIntervalMinutes: number;
            };
        } & {
            id: string;
            userId: string;
            sessionId: string;
            date: string;
            scannedAt: Date;
            isLate: boolean;
            latenessMinutes: number;
            calculatedPenalty: number;
            deviceSignature: string | null;
            isManualScan: boolean;
        })[];
    }>;
    getAttendanceLogs(user: any, cohortId?: string, sessionId?: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
        penalty: {
            id: string;
            userId: string;
            status: string;
            attendanceLogId: string;
            amount: number;
            createdAt: Date;
        } | null;
        session: {
            id: string;
            name: string;
            cohortId: string;
            startTime: string;
            gracePeriodMinutes: number;
            recurrenceDays: string[];
            latePenaltyAmount: number;
            escalationThresholdMinutes: number;
            escalationRate: number;
            escalationIntervalMinutes: number;
        };
    } & {
        id: string;
        userId: string;
        sessionId: string;
        date: string;
        scannedAt: Date;
        isLate: boolean;
        latenessMinutes: number;
        calculatedPenalty: number;
        deviceSignature: string | null;
        isManualScan: boolean;
    })[]>;
    attendanceReport(user: any, startDate: string, endDate: string, cohortId?: string, sessionId?: string): Promise<any[]>;
    waivePenalty(penaltyId: string): Promise<{
        id: string;
        userId: string;
        status: string;
        attendanceLogId: string;
        amount: number;
        createdAt: Date;
    }>;
    logAttendance(user: any, qrCode: string, deviceSignature?: string): Promise<any>;
    logAttendanceById(traineeId: string, qrCode: string, deviceSignature?: string): Promise<any>;
    adminLogAttendance(studentId: string, sessionId: string): Promise<any>;
    adminScanStudentBadge(badgeCode: string): Promise<any>;
    private publishAttendance;
    attendanceLogged(sessionId: string): any;
    onAttendanceUpdated(): any;
}
