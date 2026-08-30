import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    me(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    } | null>;
    updateProfile(userId: string, name?: string, username?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    listStudents(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }[]>;
    adminCreateStudent(name: string, email: string, phone: string, username: string, password: string, cohortId?: string, sessionId?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    adminUpdateStudent(id: string, name?: string, email?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    adminDeleteStudent(id: string): Promise<boolean>;
    adminEnrollStudent(userId: string, cohortId: string, sessionId: string): Promise<{
        id: string;
        userId: string;
        cohortId: string;
        joinedAt: Date;
        status: string;
        sessionId: string | null;
    }>;
    adminUpdateStudentMembership(userId: string, cohortId: string, sessionId: string): Promise<{
        id: string;
        userId: string;
        cohortId: string;
        joinedAt: Date;
        status: string;
        sessionId: string | null;
    }>;
    adminRemoveStudentFromCohort(userId: string, cohortId: string): Promise<boolean>;
    getMemberships(userId: string): Promise<({
        cohort: {
            id: string;
            tenantId: string;
            name: string;
            pin: string;
            startDate: Date;
            endDate: Date;
            isActive: boolean;
            durationMonths: number | null;
        };
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
        } | null;
    } & {
        id: string;
        userId: string;
        cohortId: string;
        joinedAt: Date;
        status: string;
        sessionId: string | null;
    })[]>;
}
