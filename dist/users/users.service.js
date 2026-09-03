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
var _a;
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
    async repairLegacyPortalStudents(tenantId) {
        const tenantCount = await this.prisma.tenant.count();
        if (tenantCount !== 1)
            return;
        const orphanUsers = await this.prisma.user.findMany({
            where: {
                password: { not: null },
                phone: { not: null },
                tenants: { none: {} },
            },
            select: { id: true },
        });
        if (!orphanUsers.length)
            return;
        await Promise.all(orphanUsers.map((user) => this.prisma.userTenantRole.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId } },
            create: { userId: user.id, tenantId, role: 'STUDENT' },
            update: {},
        })));
    }
    async listStudents(tenantId) {
        await this.repairLegacyPortalStudents(tenantId);
        return this.prisma.user.findMany({
            where: {
                OR: [
                    {
                        tenants: {
                            some: {
                                tenantId,
                                role: 'STUDENT',
                            },
                        },
                    },
                    {
                        cohorts: {
                            some: {
                                cohort: { tenantId },
                            },
                        },
                    },
                ],
            },
            orderBy: { name: 'asc' },
        });
    }
    async adminCreateStudent(tenantId, name, email, phone, username, password, cohortId, sessionId) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { username }, ...(phone ? [{ phone }] : [])] },
        });
        if (existing)
            throw new Error('A student with that email, username, or phone already exists');
        let cohort = null;
        let session = null;
        if (cohortId || sessionId) {
            if (!cohortId || !sessionId)
                throw new Error('Cohort and session are required together');
            cohort = await this.prisma.cohort.findFirst({
                where: { id: cohortId, tenantId },
                select: { id: true, tenantId: true, isActive: true },
            });
            session = await this.prisma.cohortSession.findFirst({
                where: { id: sessionId, cohort: { tenantId } },
                select: { id: true, cohortId: true },
            });
            if (!cohort || !cohort.isActive || !session || session.cohortId !== cohortId) {
                throw new Error('Invalid cohort or session');
            }
        }
        const bcrypt = await import('bcrypt');
        const hashed = await bcrypt.hash(password, 10);
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { name, email, phone, username, password: hashed },
            });
            await tx.userTenantRole.create({
                data: { userId: user.id, tenantId, role: 'STUDENT' },
            });
            if (cohort && session) {
                await tx.cohortMembership.create({
                    data: { userId: user.id, cohortId: cohort.id, sessionId: session.id, status: 'ACTIVE' },
                });
            }
            return user;
        });
    }
    async adminUpdateStudent(tenantId, id, name, email, username) {
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (email !== undefined)
            data.email = email;
        if (username !== undefined)
            data.username = username;
        const result = await this.prisma.user.updateMany({
            where: {
                id,
                OR: [
                    { tenants: { some: { tenantId, role: 'STUDENT' } } },
                    { cohorts: { some: { cohort: { tenantId } } } },
                ],
            },
            data,
        });
        if (!result.count)
            throw new Error('Student not found in this tenant');
        return this.prisma.user.findUnique({ where: { id } });
    }
    async adminDeleteStudent(tenantId, id) {
        const tenantRole = await this.prisma.userTenantRole.findFirst({
            where: { userId: id, tenantId, role: 'STUDENT' },
            select: { id: true },
        });
        const memberships = await this.prisma.cohortMembership.findMany({
            where: { userId: id, cohort: { tenantId } },
            select: { id: true },
        });
        if (!tenantRole && !memberships.length)
            throw new Error('Student not found in this tenant');
        const tenantLogs = await this.prisma.attendanceLog.findMany({
            where: { userId: id, session: { cohort: { tenantId } } },
            select: { id: true },
        });
        await this.prisma.$transaction(async (tx) => {
            if (tenantLogs.length) {
                const logIds = tenantLogs.map((log) => log.id);
                await tx.penalty.deleteMany({ where: { attendanceLogId: { in: logIds } } });
                await tx.attendanceLog.deleteMany({ where: { id: { in: logIds } } });
            }
            if (memberships.length) {
                await tx.cohortMembership.deleteMany({ where: { id: { in: memberships.map((m) => m.id) } } });
            }
            if (tenantRole)
                await tx.userTenantRole.delete({ where: { id: tenantRole.id } });
        });
        return true;
    }
    async adminEnrollStudent(tenantId, userId, cohortId, sessionId) {
        const [student, legacyMembership, cohort, session] = await Promise.all([
            this.prisma.userTenantRole.findFirst({ where: { userId, tenantId, role: 'STUDENT' } }),
            this.prisma.cohortMembership.findFirst({ where: { userId, cohort: { tenantId } }, select: { id: true } }),
            this.prisma.cohort.findFirst({ where: { id: cohortId, tenantId }, select: { id: true, isActive: true } }),
            this.prisma.cohortSession.findFirst({ where: { id: sessionId, cohort: { tenantId } }, select: { id: true, cohortId: true } }),
        ]);
        if ((!student && !legacyMembership) || !cohort || !cohort.isActive || !session || session.cohortId !== cohortId) {
            throw new Error('User, cohort, or session is not valid for this tenant');
        }
        if (!student) {
            await this.prisma.userTenantRole.create({
                data: { userId, tenantId, role: 'STUDENT' },
            });
        }
        return this.prisma.cohortMembership.create({
            data: { userId, cohortId, sessionId, status: 'ACTIVE' },
        });
    }
    async adminUpdateStudentMembership(tenantId, userId, cohortId, sessionId) {
        const [student, cohort, session] = await Promise.all([
            this.prisma.userTenantRole.findFirst({ where: { userId, tenantId, role: 'STUDENT' } }),
            this.prisma.cohort.findFirst({ where: { id: cohortId, tenantId }, select: { id: true } }),
            this.prisma.cohortSession.findFirst({ where: { id: sessionId, cohort: { tenantId } }, select: { id: true, cohortId: true } }),
        ]);
        if (!student || !cohort || !session || session.cohortId !== cohortId) {
            throw new Error('User, cohort, or session is not valid for this tenant');
        }
        const result = await this.prisma.cohortMembership.updateMany({
            where: { cohortId, userId, cohort: { tenantId } },
            data: { sessionId },
        });
        if (!result.count)
            throw new Error('Student membership not found in this tenant');
        return true;
    }
    async adminRemoveStudentFromCohort(tenantId, userId, cohortId) {
        const [student, cohort] = await Promise.all([
            this.prisma.userTenantRole.findFirst({ where: { userId, tenantId, role: 'STUDENT' } }),
            this.prisma.cohort.findFirst({ where: { id: cohortId, tenantId }, select: { id: true } }),
        ]);
        if (!student || !cohort)
            throw new Error('User or cohort is not valid for this tenant');
        const result = await this.prisma.cohortMembership.deleteMany({
            where: { cohortId, userId, cohort: { tenantId } },
        });
        if (!result.count)
            throw new Error('Student membership not found in this tenant');
        return true;
    }
    async getMemberships(userId, tenantId) {
        return this.prisma.cohortMembership.findMany({
            where: { userId, ...(tenantId ? { cohort: { tenantId } } : {}) },
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
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UsersService);
//# sourceMappingURL=users.service.js.map