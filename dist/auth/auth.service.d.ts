import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    registerAdmin(email: string, passwordRaw: string, name: string, tenantName: string, companyPhone?: string, username?: string, companyEmail?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    loginAdmin(email: string, passwordRaw: string): Promise<{
        accessToken: string;
    }>;
    registerStudent(email: string, passwordRaw: string, name: string, phone: string, username: string, cohortId?: string, sessionId?: string, cohortPin?: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string | null;
        oauthId: string | null;
        phone: string | null;
        username: string | null;
    }>;
    loginStudent(identifier: string, passwordRaw: string): Promise<{
        accessToken: string;
    }>;
    loginWithGoogle(idToken: string): Promise<{
        accessToken: string;
    }>;
}
