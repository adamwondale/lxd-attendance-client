import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
export declare class AttendanceService {
    private readonly prisma;
    private readonly qrService;
    constructor(prisma: PrismaService, qrService: QrService);
    private normalizeDays;
    private dateInTimezone;
    private getExpectedTime;
    private calculatePenalty;
    private assertDeviceAvailable;
    private lockDevice;
    logAttendance(userId: string, qrCode: string, deviceSignature?: string): Promise<({
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
    }) | null>;
    logAttendanceById(traineeId: string, qrCode: string, deviceSignature?: string): Promise<({
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
    }) | null>;
    adminLogAttendance(studentId: string, sessionId: string): Promise<({
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
    }) | null>;
    adminScanStudentBadge(badgeCode: string): Promise<({
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
    }) | null>;
    private processAttendance;
    getMyAttendanceSummary(userId: string): Promise<{
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
    getAttendanceLogs(cohortId?: string, sessionId?: string, tenantId?: string): Promise<({
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
    getDailyRosterStats(tenantId: string): Promise<{
        presentToday: number;
        lateToday: number;
        absentToday: number;
    }>;
    getAttendanceReport(tenantId: string, startDate: string, endDate: string, cohortId?: string, sessionId?: string): Promise<any[]>;
    waivePenalty(penaltyId: string): Promise<{
        id: string;
        userId: string;
        status: string;
        attendanceLogId: string;
        amount: number;
        createdAt: Date;
    }>;
}
