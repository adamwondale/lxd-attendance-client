"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async me(userId) {
        return this.prisma.user.findUnique({ where: { id: userId } });
    }
    async updateProfile(userId, name, username) {
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (username !== undefined)
            data.username = username;
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }
    async listStudents(tenantId) {
        return this.prisma.user.findMany({
            where: {
                tenants: {
                    some: {
                        tenantId,
                        role: 'STUDENT',
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async adminCreateStudent(name, email, phone, username, password, cohortId, sessionId) {
        const existing = await this.prisma.user.findFirst({ where: { OR: [{ email }, { username }, ...(phone ? [{ phone }] : [])] } });
        if (existing)
            throw new Error('A student with that email, username, or phone already exists');
        const bcrypt = await import('bcrypt');
        const hashed = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({ data: { name, email, phone, username, password: hashed } });
        if (cohortId && sessionId) {
            const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
            const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
            if (!cohort || !cohort.isActive || !session || session.cohortId !== cohortId)
                throw new Error('Invalid cohort or session');
            await this.prisma.cohortMembership.create({ data: { userId: user.id, cohortId, sessionId, status: 'ACTIVE' } });
            await this.prisma.userTenantRole.create({ data: { userId: user.id, tenantId: cohort.tenantId, role: 'STUDENT' } });
        }
        return user;
    }
    async adminUpdateStudent(id, name, email) {
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (email !== undefined)
            data.email = email;
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async adminDeleteStudent(id) {
        await this.prisma.userTenantRole.deleteMany({
            where: { userId: id, role: 'STUDENT' },
        });
        return true;
    }
    async adminEnrollStudent(userId, cohortId, sessionId) {
        return this.prisma.cohortMembership.create({
            data: {
                userId,
                cohortId,
                sessionId,
                status: 'ACTIVE',
            },
        });
    }
    async adminUpdateStudentMembership(userId, cohortId, sessionId) {
        return this.prisma.cohortMembership.update({
            where: {
                cohortId_userId: {
                    cohortId,
                    userId,
                },
            },
            data: {
                sessionId,
            },
        });
    }
    async adminRemoveStudentFromCohort(userId, cohortId) {
        await this.prisma.cohortMembership.delete({
            where: {
                cohortId_userId: {
                    cohortId,
                    userId,
                },
            },
        });
        return true;
    }
    async getMemberships(userId) {
        return this.prisma.cohortMembership.findMany({
            where: { userId },
            include: {
                cohort: true,
                session: true,
            }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map