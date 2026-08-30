import { PrismaService } from '../prisma/prisma.service';
export declare class CohortService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCohort(userId: string, name: string, pin: string, startDate: Date, endDate: Date, durationMonths?: number): Promise<{
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    }>;
    updateCohort(cohortId: string, name?: string, pin?: string, startDate?: Date, endDate?: Date, isActive?: boolean, durationMonths?: number): Promise<{
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    }>;
    deleteCohort(cohortId: string): Promise<boolean>;
    createCohortSession(cohortId: string, name: string, startTime: string, gracePeriodMinutes: number, recurrenceDays: string[], latePenaltyAmount: number, escalationThresholdMinutes?: number, escalationRate?: number, escalationIntervalMinutes?: number): Promise<{
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
    }>;
    updateCohortSession(sessionId: string, name?: string, startTime?: string, gracePeriodMinutes?: number, recurrenceDays?: string[], latePenaltyAmount?: number, escalationThresholdMinutes?: number, escalationRate?: number, escalationIntervalMinutes?: number): Promise<{
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
    }>;
    deleteCohortSession(sessionId: string): Promise<boolean>;
    listCohorts(userId: string): Promise<({
        sessions: {
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
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    })[]>;
    getDashboardMetrics(userId: string): Promise<{
        activeCohorts: number;
        totalStudents: number;
        presentToday: number;
        absentToday: number;
        lateToday: number;
        todayRevenue: number;
    }>;
    getCompanyProfile(userId: string): Promise<{
        id: string;
        companyName: string;
        companyEmail: string;
        companyPhone: string | null;
        adminName: string;
        username: string | null;
        timezone: string;
    }>;
    updateCompanyProfile(userId: string, companyName?: string, companyEmail?: string, companyPhone?: string, adminName?: string, username?: string): Promise<{
        id: string;
        companyName: string;
        companyEmail: string;
        companyPhone: string | null;
        adminName: string;
        username: string | null;
        timezone: string;
    }>;
    getCohortDetails(cohortId: string): Promise<({
        sessions: {
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
        }[];
        memberships: ({
            user: {
                id: string;
                name: string;
                email: string;
                password: string | null;
                oauthId: string | null;
                phone: string | null;
                username: string | null;
            };
        } & {
            id: string;
            userId: string;
            cohortId: string;
            joinedAt: Date;
            status: string;
            sessionId: string | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    }) | null>;
    publicActiveCohorts(): Promise<({
        sessions: {
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
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    })[]>;
    availableCohorts(userId: string): Promise<({
        sessions: {
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
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    })[]>;
    myCohorts(userId: string): Promise<({
        sessions: {
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
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        pin: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        durationMonths: number | null;
    })[]>;
    joinCohort(userId: string, cohortId: string, sessionId: string, pin: string): Promise<boolean>;
    getJoinedSession(userId: string, cohortId: string): Promise<{
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
    } | null>;
}
