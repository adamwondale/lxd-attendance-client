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
exports.CohortService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CohortService = class CohortService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCohort(userId, name, pin, startDate, endDate, durationMonths) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenants: true },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('User has no active tenant');
        if (durationMonths !== undefined && ![3, 6].includes(durationMonths))
            throw new common_1.BadRequestException('Cohort duration must be 3 or 6 months');
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
                durationMonths: durationMonths ?? undefined,
            },
        });
    }
    async updateCohort(cohortId, name, pin, startDate, endDate, isActive, durationMonths) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });
        if (!cohort)
            throw new common_1.BadRequestException('Cohort not found');
        return this.prisma.cohort.update({
            where: { id: cohortId },
            data: {
                ...(name !== undefined && { name }),
                ...(pin !== undefined && { pin }),
                ...(startDate !== undefined && { startDate }),
                ...(endDate !== undefined && { endDate }),
                ...(isActive !== undefined && { isActive }),
                ...(durationMonths !== undefined && { durationMonths }),
            },
        });
    }
    async deleteCohort(cohortId) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });
        if (!cohort)
            throw new common_1.BadRequestException('Cohort not found');
        await this.prisma.cohort.update({
            where: { id: cohortId },
            data: { isActive: false },
        });
        return true;
    }
    async createCohortSession(cohortId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes = 15, escalationRate = 5, escalationIntervalMinutes = 5) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
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
    async updateCohortSession(sessionId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes) {
        const session = await this.prisma.cohortSession.findUnique({
            where: { id: sessionId },
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
    async deleteCohortSession(sessionId) {
        const session = await this.prisma.cohortSession.findUnique({
            where: { id: sessionId },
        });
        if (!session)
            throw new common_1.BadRequestException('Session not found');
        await this.prisma.cohortSession.delete({ where: { id: sessionId } });
        return true;
    }
    async listCohorts(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenants: true },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('User has no active tenant');
        return this.prisma.cohort.findMany({
            where: { tenantId, isActive: true },
            orderBy: { startDate: 'desc' },
            include: { sessions: true },
        });
    }
    async getDashboardMetrics(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenants: true },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('User has no active tenant');
        const activeCohorts = await this.prisma.cohort.count({
            where: { tenantId, isActive: true },
        });
        const totalStudents = await this.prisma.user.count({
            where: { tenants: { some: { tenantId, role: 'STUDENT' } } },
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
            include: { tenants: true },
        });
        const tenantId = user?.tenants?.[0]?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('User has no active tenant');
        if (username && username !== user?.username) {
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
    async getCohortDetails(cohortId) {
        return this.prisma.cohort.findUnique({
            where: { id: cohortId },
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
            include: { sessions: true },
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
            include: { sessions: true },
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CohortService);
//# sourceMappingURL=cohort.service.js.map