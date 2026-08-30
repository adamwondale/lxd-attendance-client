export declare class CohortMembership {
    id: string;
    userId: string;
    cohortId: string;
    sessionId?: string;
    status: string;
    cohort?: any;
    session?: any;
}
export declare class CohortSession {
    id: string;
    cohortId: string;
    name: string;
    startTime: string;
    gracePeriodMinutes: number;
    recurrenceDays: string[];
    latePenaltyAmount: number;
    escalationThresholdMinutes: number;
    escalationRate: number;
    escalationIntervalMinutes: number;
}
export declare class Cohort {
    id: string;
    tenantId: string;
    name: string;
    startDate: Date;
    pin: string;
    endDate: Date;
    isActive: boolean;
    durationMonths?: number;
    sessions?: CohortSession[];
    joinedSession?: CohortSession;
}
