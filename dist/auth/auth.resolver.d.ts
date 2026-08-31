import { AuthService } from './auth.service';
export declare class AuthResolver {
    private readonly authService;
    constructor(authService: AuthService);
    registerAdmin(email: string, passwordRaw: string, name: string, tenantName: string, companyPhone?: string, username?: string, companyEmail?: string): Promise<string>;
    loginAdmin(email: string, passwordRaw: string): Promise<{
        accessToken: string;
    }>;
    loginWithGoogle(idToken: string): Promise<{
        accessToken: string;
    }>;
    registerStudent(email: string, passwordRaw: string, name: string, phone: string, username: string, cohortId?: string, sessionId?: string, cohortPin?: string): Promise<string>;
    loginStudent(identifier: string, passwordRaw: string): Promise<{
        accessToken: string;
    }>;
}
