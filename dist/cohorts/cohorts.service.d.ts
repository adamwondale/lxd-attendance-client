import { PrismaService } from '../prisma/prisma.service';
export declare class CohortsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    joinCohort(userId: string, pin: string): Promise<{
        id: string;
        userId: string;
        cohortId: string;
        joinedAt: Date;
        status: string;
        sessionId: string | null;
    }>;
}
