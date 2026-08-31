import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        userId: any;
        email: any;
        role: any;
        tenantId: any;
    }>;
}
export {};
