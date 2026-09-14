import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CohortService {
  constructor(private readonly prisma: PrismaService) {}

  async createCohort(
    userId: string,
    name: string,
    pin: string,
    startDate: Date,
    endDate: Date,
    durationMonths?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: true },
    });
    const tenantId = user?.tenants?.[0]?.tenantId;
    if (!tenantId) throw new BadRequestException('User has no active tenant');
    if (durationMonths !== undefined && ![3, 6].includes(durationMonths))
      throw new BadRequestException('Cohort duration must be 3 or 6 months');

    return this.prisma.cohort.create({
      data: {
        name,
        pin,
        startDate,
        endDate,
        durationMonths,
        tenantId,
      },
    });
  }

  async updateCohort(
    cohortId: string,
    name?: string,
    pin?: string,
    startDate?: Date,
    endDate?: Date,
    isActive?: boolean,
    durationMonths?: number,
    tenantId?: string,
  ) {
    if (durationMonths !== undefined && durationMonths !== 3 && durationMonths !== 6) {
      throw new BadRequestException('durationMonths must be either 3 or 6');
    }
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new BadRequestException('Cohort not found');
    if (tenantId && cohort.tenantId !== tenantId) throw new BadRequestException('Cohort does not belong to your tenant');

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

  async deleteCohort(cohortId: string, tenantId?: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new BadRequestException('Cohort not found');
    if (tenantId && cohort.tenantId !== tenantId) throw new BadRequestException('Cohort does not belong to your tenant');

    // Soft delete cohort
    await this.prisma.cohort.update({
      where: { id: cohortId },
      data: { isActive: false },
    });
    return true;
  }

  async createCohortSession(
    cohortId: string,
    name: string,
    startTime: string,
    gracePeriodMinutes: number,
    recurrenceDays: string[],
    latePenaltyAmount: number,
    escalationThresholdMinutes = 15,
    escalationRate = 5,
    escalationIntervalMinutes = 5,
    tenantId?: string,
  ) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new BadRequestException('Cohort not found');
    if (tenantId && cohort.tenantId !== tenantId) throw new BadRequestException('Cohort does not belong to your tenant');

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
        escalationIntervalMinutes
      },
    });
  }

  async updateCohortSession(
    sessionId: string,
    name?: string,
    startTime?: string,
    gracePeriodMinutes?: number,
    recurrenceDays?: string[],
    latePenaltyAmount?: number,
    escalationThresholdMinutes?: number,
    escalationRate?: number,
    escalationIntervalMinutes?: number,
    tenantId?: string,
  ) {
    const session = await this.prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: true },
    });
    if (!session) throw new BadRequestException('Session not found');
    if (tenantId && session.cohort.tenantId !== tenantId) throw new BadRequestException('Session does not belong to your tenant');

    return this.prisma.cohortSession.update({
      where: { id: sessionId },
      data: {
        ...(name !== undefined && { name }),
        ...(startTime !== undefined && { startTime }),
        ...(gracePeriodMinutes !== undefined && { gracePeriodMinutes }),
        ...(recurrenceDays !== undefined && { recurrenceDays }),
        ...(latePenaltyAmount !== undefined && { latePenaltyAmount }),
        ...(escalationThresholdMinutes !== undefined && { escalationThresholdMinutes }),
        ...(escalationRate !== undefined && { escalationRate }),
        ...(escalationIntervalMinutes !== undefined && { escalationIntervalMinutes }),
      },
    });
  }

  async deleteCohortSession(sessionId: string, tenantId?: string) {
    const session = await this.prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: true }
    });
    if (!session) throw new BadRequestException('Session not found');
    if (tenantId && session.cohort.tenantId !== tenantId) throw new BadRequestException('Session does not belong to your tenant');

    await this.prisma.cohortSession.delete({ where: { id: sessionId } });
    return true;
  }

  async listCohorts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: true },
    });
    const tenantId = user?.tenants?.[0]?.tenantId;
    if (!tenantId) return [];

    return this.prisma.cohort.findMany({
      where: { tenantId, isActive: true },
      include: { sessions: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async getCohortDetails(id: string) {
    return this.prisma.cohort.findUnique({
      where: { id },
      include: {
        sessions: true,
        memberships: {
          include: { user: true, session: true },
        },
      },
    });
  }

  async getDashboardMetrics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: true },
    });
    const tenantId = user?.tenants?.[0]?.tenantId;
    if (!tenantId) return { totalCohorts: 0, totalStudents: 0, activeSessions: 0 };

    const cohorts = await this.prisma.cohort.count({ where: { tenantId, isActive: true } });
    const students = await this.prisma.userTenantRole.count({ where: { tenantId, role: 'STUDENT' } });
    const sessions = await this.prisma.cohortSession.count({ where: { cohort: { tenantId, isActive: true } } });

    return {
      totalCohorts: cohorts,
      totalStudents: students,
      activeSessions: sessions,
    };
  }

  async publicActiveCohorts() {
    const cohorts = await this.prisma.cohort.findMany({
      where: { isActive: true, endDate: { gte: new Date() } },
      include: { sessions: true },
      orderBy: { startDate: 'desc' },
    });
    // Remove the sensitive pin field manually to comply with the modified DTO.
    return cohorts.map((c: any) => {
      const { pin, ...publicData } = c;
      return publicData;
    });
  }

  async availableCohorts(userId: string) {
    // Return all active cohorts that the user is NOT already a member of
    const cohorts = await this.prisma.cohort.findMany({
      where: {
        isActive: true,
        memberships: {
          none: { userId },
        },
      },
      include: { sessions: true },
      orderBy: { startDate: 'desc' },
    });
    // Remove the sensitive pin field manually to comply with the modified DTO.
    return cohorts.map((c: any) => {
      const { pin, ...publicData } = c;
      return publicData;
    });
  }

  async myCohorts(userId: string) {
    return this.prisma.cohort.findMany({
      where: {
        isActive: true,
        memberships: {
          some: { userId },
        },
      },
      include: { sessions: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async getJoinedSession(userId: string, cohortId: string) {
    const membership = await this.prisma.cohortMembership.findUnique({
      where: {
        cohortId_userId: { cohortId, userId }
      },
      include: { session: true }
    });
    return membership?.session || null;
  }

  async joinCohort(userId: string, cohortId: string, sessionId: string, pin: string) {
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort || cohort.pin !== pin) {
      throw new BadRequestException('Invalid Cohort PIN');
    }

    const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
    if (!session || session.cohortId !== cohortId) {
      throw new BadRequestException('Invalid Session');
    }

    await this.prisma.cohortMembership.create({
      data: {
        userId,
        cohortId,
        sessionId,
        status: 'ACTIVE',
      },
    });

    // Also add them to the tenant if not already
    const existingRole = await this.prisma.userTenantRole.findFirst({
      where: { userId, tenantId: cohort.tenantId }
    });
    if (!existingRole) {
      await this.prisma.userTenantRole.create({
        data: { userId, tenantId: cohort.tenantId, role: 'STUDENT' }
      });
    }

    return true;
  }

  async getCompanyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: { include: { tenant: true } } },
    });
    const tenant = user?.tenants?.[0]?.tenant;
    if (!tenant) throw new BadRequestException('Tenant not found');

    return {
      companyName: tenant.name,
      companyEmail: tenant.email,
      companyPhone: tenant.phone,
      adminName: user.name,
      username: user.username,
    };
  }

  async updateCompanyProfile(
    userId: string,
    companyName?: string,
    companyEmail?: string,
    companyPhone?: string,
    adminName?: string,
    username?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: { include: { tenant: true } } },
    });
    const tenant = user?.tenants?.[0]?.tenant;
    if (!tenant) throw new BadRequestException('Tenant not found');

    if (companyName || companyEmail || companyPhone) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          ...(companyName && { name: companyName }),
          ...(companyEmail && { email: companyEmail }),
          ...(companyPhone && { phone: companyPhone }),
        }
      });
    }

    let updatedUser = user;
    if (adminName || username) {
      updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(adminName && { name: adminName }),
          ...(username && { username }),
        },
        include: { tenants: { include: { tenant: true } } },
      });
    }

    return {
      companyName: companyName || tenant.name,
      companyEmail: companyEmail || tenant.email,
      companyPhone: companyPhone || tenant.phone,
      adminName: updatedUser.name,
      username: updatedUser.username,
    };
  }
}
