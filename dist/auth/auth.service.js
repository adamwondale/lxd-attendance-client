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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
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
        const existing = await this.prisma.user.findFirst({ where: { OR: [{ email }, { phone }, { username }] } });
        if (existing)
            throw new common_1.BadRequestException('User with that email, phone, or username already exists');
        let selectedCohort = null;
        if (cohortId || sessionId) {
            if (!cohortId || !sessionId || !cohortPin)
                throw new common_1.BadRequestException('Cohort, session and cohort PIN are required for assignment');
            selectedCohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
            const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
            if (!selectedCohort || !selectedCohort.isActive || selectedCohort.pin !== cohortPin || !session || session.cohortId !== cohortId)
                throw new common_1.BadRequestException('Invalid cohort, session or PIN');
        }
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);
        const user = await this.prisma.user.create({ data: { email, name, phone, username, password: hashedPassword } });
        if (selectedCohort) {
            await this.prisma.cohortMembership.create({ data: { userId: user.id, cohortId: selectedCohort.id, sessionId, status: 'ACTIVE' } });
            await this.prisma.userTenantRole.create({ data: { userId: user.id, tenantId: selectedCohort.tenantId, role: 'STUDENT' } });
        }
        return user;
    }
    async loginStudent(identifier, passwordRaw) {
        const user = await this.prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] }, include: { tenants: true } });
        if (!user || !user.password)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!(await bcrypt.compare(passwordRaw, user.password)))
            throw new common_1.UnauthorizedException('Invalid credentials');
        const studentRole = user.tenants.find(t => t.role === 'STUDENT');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map