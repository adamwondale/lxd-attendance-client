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
exports.CohortService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CohortService = class CohortService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateDurationMonths(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
            throw new common_1.BadRequestException('End date must be on or after the start date');
        }
        const monthDifference = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
            (end.getUTCMonth() - start.getUTCMonth());
        const completedMonths = monthDifference - (end.getUTCDate() < start.getUTCDate() ? 1 : 0);
        return Math.max(1, completedMonths);
    }
    async getTenantId(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenants: true },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('User has no active tenant');
        return tenantId;
    }
    async createCohort(tenantId, name, pin, startDate, endDate) {
        const durationMonths = this.calculateDurationMonths(startDate, endDate);
        const existing = await this.prisma.cohort.findUnique({ where: { pin } });
        if (existing) {
            throw new common_1.BadRequestException('A cohort with this PIN already exists');
        }
        return await this.prisma.cohort.create({
            data: {
                tenantId,
                name,
                pin,
                startDate,
                endDate,
                isActive: true,
                durationMonths,
            },
        });
    }
    async updateCohort(tenantId, cohortId, name, pin, startDate, endDate, isActive) {
        const cohort = await this.prisma.cohort.findFirst({
            where: { id: cohortId, tenantId },
        });
        if (!cohort)
            throw new common_1.BadRequestException('Cohort not found');
        const nextStartDate = startDate ?? cohort.startDate;
        const nextEndDate = endDate ?? cohort.endDate;
        const durationMonths = this.calculateDurationMonths(nextStartDate, nextEndDate);
        const result = await this.prisma.cohort.updateMany({
            where: { id: cohortId, tenantId },
            data: {
                ...(name !== undefined && { name }),
                ...(pin !== undefined && { pin }),
                ...(startDate !== undefined && { startDate }),
                ...(endDate !== undefined && { endDate }),
                ...(isActive !== undefined && { isActive }),
                durationMonths,
            },
        });
        if (!result.count)
            throw new common_1.BadRequestException('Cohort not found');
        return this.prisma.cohort.findUniqueOrThrow({ where: { id: cohortId } });
    }
    async deleteCohort(tenantId, cohortId) {
        const result = await this.prisma.cohort.updateMany({
            where: { id: cohortId, tenantId },
            data: { isActive: false },
        });
        if (!result.count)
            throw new common_1.BadRequestException('Cohort not found');
        return true;
    }
    async createCohortSession(tenantId, cohortId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes = 15, escalationRate = 5, escalationIntervalMinutes = 5) {
        const cohort = await this.prisma.cohort.findFirst({
            where: { id: cohortId, tenantId },
        });
        if (!cohort)
            throw new common_1.BadRequestException('Cohort not found');
        return this.prisma.cohortSession.create({
            data: {
                cohortId,
                name,
                startTime,
                gracePeriodMinutes,
                recurrenceDays,
                latePenaltyAmount,
                escalationThresholdMinutes,
                escalationRate,
                escalationIntervalMinutes,
            },
        });
    }
    async updateCohortSession(tenantId, sessionId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes) {
        const session = await this.prisma.cohortSession.findFirst({
            where: { id: sessionId, cohort: { tenantId } },
        });
        if (!session)
            throw new common_1.BadRequestException('Session not found');
        return this.prisma.cohortSession.update({
            where: { id: sessionId },
            data: {
                ...(name !== undefined && { name }),
                ...(startTime !== undefined && { startTime }),
                ...(gracePeriodMinutes !== undefined && { gracePeriodMinutes }),
                ...(recurrenceDays !== undefined && { recurrenceDays }),
                ...(latePenaltyAmount !== undefined && { latePenaltyAmount }),
                ...(escalationThresholdMinutes !== undefined && {
                    escalationThresholdMinutes,
                }),
                ...(escalationRate !== undefined && { escalationRate }),
                ...(escalationIntervalMinutes !== undefined && {
                    escalationIntervalMinutes,
                }),
            },
        });
    }
    async deleteCohortSession(tenantId, sessionId) {
        const result = await this.prisma.cohortSession.deleteMany({
            where: { id: sessionId, cohort: { tenantId } },
        });
        if (!result.count)
            throw new common_1.BadRequestException('Session not found');
        return true;
    }
    async listCohorts(userId) {
        const tenantId = await this.getTenantId(userId);
        const cohorts = await this.prisma.cohort.findMany({
            where: { tenantId, isActive: true },
            orderBy: { startDate: 'desc' },
            include: { sessions: true },
        });
        await Promise.all(cohorts
            .filter((cohort) => cohort.durationMonths == null)
            .map((cohort) => this.prisma.cohort.update({
            where: { id: cohort.id },
            data: { durationMonths: this.calculateDurationMonths(cohort.startDate, cohort.endDate) },
        })));
        return cohorts.map((cohort) => ({
            ...cohort,
            durationMonths: cohort.durationMonths ?? this.calculateDurationMonths(cohort.startDate, cohort.endDate),
        }));
    }
    async getDashboardMetrics(userId) {
        const tenantId = await this.getTenantId(userId);
        const tenantCount = await this.prisma.tenant.count();
        if (tenantCount === 1) {
            const orphanStudents = await this.prisma.user.findMany({
                where: { password: { not: null }, phone: { not: null }, tenants: { none: {} } },
                select: { id: true },
            });
            if (orphanStudents.length) {
                await Promise.all(orphanStudents.map((student) => this.prisma.userTenantRole.upsert({
                    where: { userId_tenantId: { userId: student.id, tenantId } },
                    create: { userId: student.id, tenantId, role: 'STUDENT' },
                    update: {},
                })));
            }
        }
        const activeCohorts = await this.prisma.cohort.count({
            where: { tenantId, isActive: true },
        });
        const totalStudents = await this.prisma.user.count({
            where: {
                OR: [
                    { tenants: { some: { tenantId, role: 'STUDENT' } } },
                    { cohorts: { some: { cohort: { tenantId } } } },
                ],
            },
        });
        const today = new Date();
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: tenant?.timezone || 'Africa/Addis_Ababa',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(today);
        const get = (type) => parts.find((p) => p.type === type)?.value || '';
        const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
        const activeMemberships = await this.prisma.cohortMembership.findMany({
            where: { status: 'ACTIVE', cohort: { tenantId, isActive: true } },
            select: { userId: true },
        });
        const logs = await this.prisma.attendanceLog.findMany({
            where: {
                date: dateStr,
                session: { cohort: { tenantId, isActive: true } },
            },
            select: { userId: true, isLate: true, calculatedPenalty: true },
        });
        const presentIds = new Set(logs.map((l) => l.userId));
        const lateIds = new Set(logs.filter((l) => l.isLate).map((l) => l.userId));
        const todayRevenue = logs.reduce((sum, l) => sum + (l.calculatedPenalty || 0), 0);
        return {
            activeCohorts,
            totalStudents,
            presentToday: presentIds.size,
            absentToday: new Set(activeMemberships
                .map((m) => m.userId)
                .filter((id) => !presentIds.has(id))).size,
            lateToday: lateIds.size,
            todayRevenue,
        };
    }
    async getCompanyProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenants: {
                    include: { tenant: true },
                },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const role = user.tenants?.find((t) => ['SUPER_ADMIN', 'COORDINATOR'].includes(t.role));
        if (!role) {
            throw new common_1.BadRequestException('User has no active company profile');
        }
        const tenant = role.tenant;
        return {
            id: tenant.id,
            companyName: tenant.name,
            companyEmail: tenant.companyEmail || user.email,
            companyPhone: tenant.companyPhone || user.phone,
            adminName: tenant.adminName || user.name,
            username: user.username,
            timezone: tenant.timezone,
        };
    }
    async updateCompanyProfile(userId, companyName, companyEmail, companyPhone, adminName, username) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                tenants: {
                    where: { role: { in: ['ADMIN', 'COORDINATOR', 'SUPER_ADMIN'] } },
                    include: { tenant: true },
                    take: 1,
                },
            },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!user || !tenantId) {
            throw new common_1.BadRequestException('User has no active company profile');
        }
        if (username && username !== user.username) {
            const duplicate = await this.prisma.user.findFirst({
                where: { username, NOT: { id: userId } },
            });
            if (duplicate)
                throw new common_1.BadRequestException('Username is already in use');
        }
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(companyName !== undefined && { name: companyName }),
                ...(companyEmail !== undefined && { companyEmail }),
                ...(companyPhone !== undefined && { companyPhone }),
                ...(adminName !== undefined && { adminName }),
            },
        });
        if (adminName !== undefined ||
            username !== undefined ||
            companyPhone !== undefined ||
            companyEmail !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(adminName !== undefined && { name: adminName }),
                    ...(username !== undefined && { username }),
                    ...(companyPhone !== undefined && { phone: companyPhone }),
                    ...(companyEmail !== undefined && { email: companyEmail }),
                },
            });
        }
        return this.getCompanyProfile(userId);
    }
    async getCohortDetails(tenantId, cohortId) {
        return this.prisma.cohort.findFirst({
            where: { id: cohortId, tenantId },
            include: {
                sessions: true,
                memberships: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    async publicActiveCohorts() {
        return this.prisma.cohort.findMany({
            where: { isActive: true, endDate: { gte: new Date() } },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                isActive: true,
                durationMonths: true,
                sessions: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async availableCohorts(userId) {
        return this.prisma.cohort.findMany({
            where: {
                isActive: true,
                memberships: {
                    none: { userId },
                },
            },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                isActive: true,
                durationMonths: true,
                sessions: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async myCohorts(userId) {
        const memberships = await this.prisma.cohortMembership.findMany({
            where: { userId, status: 'ACTIVE' },
            include: {
                cohort: {
                    include: { sessions: true },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
        return memberships.map((m) => m.cohort);
    }
    async joinCohort(userId, cohortId, sessionId, pin) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });
        if (!cohort)
            throw new common_1.BadRequestException('Cohort not found');
        if (cohort.pin !== pin)
            throw new common_1.BadRequestException('Invalid PIN');
        if (!cohort.isActive)
            throw new common_1.BadRequestException('Cohort is no longer active');
        const session = await this.prisma.cohortSession.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.cohortId !== cohortId) {
            throw new common_1.BadRequestException('Invalid Session ID');
        }
        const existingMembership = await this.prisma.cohortMembership.findUnique({
            where: { cohortId_userId: { cohortId, userId } },
        });
        if (existingMembership) {
            throw new common_1.BadRequestException('You are already enrolled in this cohort');
        }
        await this.prisma.cohortMembership.create({
            data: {
                cohortId,
                userId,
                sessionId,
                status: 'ACTIVE',
            },
        });
        const existingTenantRole = await this.prisma.userTenantRole.findUnique({
            where: { userId_tenantId: { userId, tenantId: cohort.tenantId } },
        });
        if (!existingTenantRole) {
            await this.prisma.userTenantRole.create({
                data: {
                    userId,
                    tenantId: cohort.tenantId,
                    role: 'STUDENT',
                },
            });
        }
        return true;
    }
    async getJoinedSession(userId, cohortId) {
        const membership = await this.prisma.cohortMembership.findUnique({
            where: { cohortId_userId: { cohortId, userId } },
            include: { session: true },
        });
        return membership?.session || null;
    }
};
exports.CohortService = CohortService;
exports.CohortService = CohortService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], CohortService);
//# sourceMappingURL=cohort.service.js.map