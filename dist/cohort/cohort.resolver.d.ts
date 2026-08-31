import { PubSub } from 'graphql-subscriptions';
import { Cohort } from './dto/cohort.type';
import { CohortService } from './cohort.service';
export declare class CohortResolver {
    private readonly cohortService;
    private pubSub;
    constructor(cohortService: CohortService, pubSub: PubSub);
    createCohort(user: any, name: string, pin: string, startDate: string, endDate: string, durationMonths?: number): Promise<string>;
    updateCohort(cohortId: string, name?: string, pin?: string, startDate?: string, endDate?: string, isActive?: boolean, durationMonths?: number): Promise<string>;
    deleteCohort(cohortId: string): Promise<boolean>;
    createCohortSession(cohortId: string, name: string, startTime: string, gracePeriodMinutes: number, recurrenceDays: string[], latePenaltyAmount: number, escalationThresholdMinutes?: number, escalationRate?: number, escalationIntervalMinutes?: number): Promise<string>;
    updateCohortSession(sessionId: string, name?: string, startTime?: string, gracePeriodMinutes?: number, recurrenceDays?: string[], latePenaltyAmount?: number, escalationThresholdMinutes?: number, escalationRate?: number, escalationIntervalMinutes?: number): Promise<string>;
    deleteCohortSession(sessionId: string): Promise<boolean>;
    listCohorts(user: any): Promise<({
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
    cohortDetails(id: string): Promise<({
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
    dashboardMetrics(user: any): Promise<{
        activeCohorts: number;
        totalStudents: number;
        presentToday: number;
        absentToday: number;
        lateToday: number;
        todayRevenue: number;
    }>;
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
    availableCohorts(user: any): Promise<({
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
    myCohorts(user: any): Promise<({
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
    joinCohort(user: any, cohortId: string, sessionId: string, pin: string): Promise<boolean>;
    companyProfile(user: any): Promise<{
        id: string;
        companyName: string;
        companyEmail: string;
        companyPhone: string | null;
        adminName: string;
        username: string | null;
        timezone: string;
    }>;
    updateCompanyProfile(user: any, companyName?: string, companyEmail?: string, companyPhone?: string, adminName?: string, username?: string): Promise<{
        id: string;
        companyName: string;
        companyEmail: string;
        companyPhone: string | null;
        adminName: string;
        username: string | null;
        timezone: string;
    }>;
    onCohortsUpdated(): import("graphql-subscriptions/dist/pubsub-async-iterable-iterator").PubSubAsyncIterableIterator<unknown>;
    joinedSession(cohort: Cohort, user: any): Promise<{
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
