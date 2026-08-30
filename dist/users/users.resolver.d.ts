import { PubSub } from 'graphql-subscriptions';
import { UsersService } from './users.service';
import { User } from './dto/user.type';
export declare class UsersResolver {
    private readonly usersService;
    private pubSub;
    constructor(usersService: UsersService, pubSub: PubSub);
    me(user: any): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    } | null>;
    updateProfile(user: any, name?: string, username?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    listStudents(user: any): Promise<{
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
    adminEnrollStudent(userId: string, cohortId: string, sessionId: string): Promise<boolean>;
    adminUpdateStudentMembership(userId: string, cohortId: string, sessionId: string): Promise<boolean>;
    adminRemoveStudentFromCohort(userId: string, cohortId: string): Promise<boolean>;
    onStudentsUpdated(): import("graphql-subscriptions/dist/pubsub-async-iterable-iterator").PubSubAsyncIterableIterator<unknown>;
    memberships(user: User): Promise<({
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
