"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const jwt_1 = require("@nestjs/jwt");
const mail_service_1 = require("../mail/mail.service");
const crypto = __importStar(require("crypto"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailService;
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async registerAdmin(email, passwordRaw, name, tenantName, companyPhone, username, companyEmail) {
        const existing = await this.prisma.user.findFirst({ where: { OR: [{ email }, ...(username ? [{ username }] : [])] } });
        if (existing)
            throw new common_1.BadRequestException('Admin email or username already exists');
        if (passwordRaw.length < 6)
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);
        return this.prisma.$transaction(async (tx) => {
            const slugBase = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    slug: `${slugBase}-${Date.now()}`,
                    companyEmail: companyEmail || email,
                    companyPhone,
                    adminName: name,
                },
            });
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    username,
                    phone: companyPhone,
                    password: hashedPassword,
                    tenants: { create: { tenantId: tenant.id, role: 'SUPER_ADMIN' } },
                },
            });
            return user;
        });
    }
    async hasCompanyProfile() {
        return (await this.prisma.tenant.count()) > 0;
    }
    async loginAdmin(email, passwordRaw) {
        const user = await this.prisma.user.findUnique({ where: { email }, include: { tenants: true } });
        const adminRole = user?.tenants?.find(t => ['SUPER_ADMIN', 'COORDINATOR'].includes(t.role));
        if (!user || !user.password || !adminRole)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!(await bcrypt.compare(passwordRaw, user.password)))
            throw new common_1.UnauthorizedException('Invalid credentials');
        const payload = { sub: user.id, email: user.email, role: adminRole.role, tenantId: adminRole.tenantId };
        return { accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }) };
    }
    async registerStudent(email, passwordRaw, name, phone, username, cohortId, sessionId, cohortPin) {
        const orConditions = [{ email }];
        if (phone)
            orConditions.push({ phone });
        if (username)
            orConditions.push({ username });
        const existing = await this.prisma.user.findFirst({ where: { OR: orConditions } });
        if (existing) {
            throw new common_1.BadRequestException('User with that email, phone, or username already exists');
        }
        if (passwordRaw.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        }
        let cohort = null;
        let session = null;
        if (!cohortId || !sessionId || !cohortPin) {
            throw new common_1.BadRequestException('Cohort, session, and cohort PIN are required');
        }
        {
            cohort = await this.prisma.cohort.findUnique({
                where: { id: cohortId },
                select: { id: true, tenantId: true, pin: true, isActive: true },
            });
            if (!cohort || !cohort.isActive)
                throw new common_1.BadRequestException('Cohort is not available');
            if (cohort.pin !== cohortPin)
                throw new common_1.BadRequestException('Invalid cohort PIN');
            session = await this.prisma.cohortSession.findUnique({
                where: { id: sessionId },
                select: { id: true, cohortId: true },
            });
            if (!session || session.cohortId !== cohortId) {
                throw new common_1.BadRequestException('Invalid session for the selected cohort');
            }
        }
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, name, phone, username, password: hashedPassword },
            });
            if (cohort && session) {
                await tx.userTenantRole.create({
                    data: { userId: user.id, tenantId: cohort.tenantId, role: 'STUDENT' },
                });
                await tx.cohortMembership.create({
                    data: { userId: user.id, cohortId: cohort.id, sessionId: session.id, status: 'ACTIVE' },
                });
            }
            return user;
        });
    }
    async loginStudent(identifier, passwordRaw) {
        const user = await this.prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] }, include: { tenants: true } });
        if (!user || !user.password)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!(await bcrypt.compare(passwordRaw, user.password)))
            throw new common_1.UnauthorizedException('Invalid credentials');
        let studentRole = user.tenants.find(t => t.role === 'STUDENT');
        if (!studentRole) {
            const tenantCount = await this.prisma.tenant.count();
            if (tenantCount === 1) {
                const tenant = await this.prisma.tenant.findFirst({ select: { id: true } });
                if (tenant) {
                    studentRole = await this.prisma.userTenantRole.upsert({
                        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
                        create: { userId: user.id, tenantId: tenant.id, role: 'STUDENT' },
                        update: {},
                    });
                }
            }
        }
        const payload = { sub: user.id, email: user.email, role: 'STUDENT', tenantId: studentRole?.tenantId };
        return { accessToken: this.jwtService.sign(payload, { expiresIn: '180d' }) };
    }
    async loginWithGoogle(idToken) {
        const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let payload;
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        }
        catch (e) {
            console.error('Google token verification failed:', e);
            throw new common_1.BadRequestException('Invalid Google token');
        }
        if (!payload?.email)
            throw new common_1.BadRequestException('Invalid Google payload');
        let user = await this.prisma.user.findFirst({ where: { OR: [{ oauthId: payload.sub }, { email: payload.email }] }, include: { tenants: true } });
        if (!user) {
            user = await this.prisma.user.create({ data: { email: payload.email, name: payload.name || 'Student', oauthId: payload.sub }, include: { tenants: true } });
        }
        else if (!user.oauthId) {
            user = await this.prisma.user.update({ where: { id: user.id }, data: { oauthId: payload.sub }, include: { tenants: true } });
        }
        const studentRole = user.tenants.find(t => t.role === 'STUDENT');
        const jwtPayload = { sub: user.id, email: user.email, role: 'STUDENT', tenantId: studentRole?.tenantId };
        return { accessToken: this.jwtService.sign(jwtPayload, { expiresIn: '180d' }) };
    }
    async forgotPassword(email, role) {
        const user = await this.prisma.user.findUnique({ where: { email }, include: { tenants: true } });
        if (!user) {
            return true;
        }
        const isAdmin = user.tenants.some(t => ['SUPER_ADMIN', 'COORDINATOR'].includes(t.role));
        if (role === 'ADMIN' && !isAdmin)
            return true;
        if (role === 'STUDENT' && isAdmin)
            return true;
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
            },
        });
        await this.mailService.sendPasswordResetEmail(user.email, resetToken, role);
        return true;
    }
    async resetPassword(token, passwordRaw) {
        if (passwordRaw.length < 6)
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired password reset token');
        }
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _b : Object, typeof (_c = typeof mail_service_1.MailService !== "undefined" && mail_service_1.MailService) === "function" ? _c : Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map