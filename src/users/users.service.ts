import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            cohort: true,
            session: true,
          }
        },
      },
    });
  }

  async updateProfile(userId: string, name?: string, username?: string) {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async adminCreateStudent(name: string, email: string, phone: string, username: string, password: string, cohortId?: string, sessionId?: string, tenantId?: string) {
    const existing = await this.prisma.user.findFirst({ where: { OR: [{ email }, { username }, ...(phone ? [{ phone }] : [])] } });
    if (existing) throw new Error('A student with that email, username, or phone already exists');

    let validCohort = null;
    if (cohortId && sessionId) {
      validCohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
      const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
      if (!validCohort || !validCohort.isActive || !session || session.cohortId !== cohortId) throw new Error('Invalid cohort or session');
      if (tenantId && validCohort.tenantId !== tenantId) throw new ForbiddenException('Cohort does not belong to your tenant');
    }

    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, phone, username, password: hashed } });

      if (validCohort && cohortId && sessionId) {
        await tx.cohortMembership.create({ data: { userId: user.id, cohortId, sessionId, status: 'ACTIVE' } });
        await tx.userTenantRole.create({ data: { userId: user.id, tenantId: validCohort.tenantId, role: 'STUDENT' } });
      } else if (tenantId) {
        await tx.userTenantRole.create({ data: { userId: user.id, tenantId, role: 'STUDENT' } });
      }
      return user;
    });
  }

  async adminUpdateStudent(id: string, name?: string, email?: string, tenantId?: string) {
    if (tenantId) {
        const userInTenant = await this.prisma.userTenantRole.findFirst({ where: { userId: id, tenantId } });
        if (!userInTenant) throw new ForbiddenException('Student not found in your tenant');
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async adminDeleteStudent(id: string, tenantId?: string) {
    if (tenantId) {
        const userInTenant = await this.prisma.userTenantRole.findFirst({ where: { userId: id, tenantId } });
        if (!userInTenant) throw new ForbiddenException('Student not found in your tenant');
    }

    // Soft-delete or hard-delete. For demo, we just remove the UserTenantRole so they don't show up in the tenant.
    await this.prisma.userTenantRole.deleteMany({
      where: { userId: id, role: 'STUDENT', ...(tenantId ? { tenantId } : {}) },
    });

    // Optionally we could delete the user if they have no other roles, but keeping it safe for the demo.
    return true;
  }

  async adminEnrollStudent(userId: string, cohortId: string, sessionId: string, tenantId?: string) {
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new BadRequestException('Cohort not found');
    if (tenantId && cohort.tenantId !== tenantId) throw new ForbiddenException('Cohort does not belong to your tenant');

    const userInTenant = await this.prisma.userTenantRole.findFirst({ where: { userId, tenantId: cohort.tenantId } });
    if (!userInTenant) throw new ForbiddenException('Student not found in the target tenant');

    const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
    if (!session || session.cohortId !== cohortId) throw new BadRequestException('Invalid session');

    return this.prisma.cohortMembership.create({
      data: {
        userId,
        cohortId,
        sessionId,
        status: 'ACTIVE',
      },
    });
  }

  async adminUpdateStudentMembership(userId: string, cohortId: string, sessionId: string, tenantId?: string) {
    const membership = await this.prisma.cohortMembership.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      include: { cohort: true }
    });
    if (!membership) throw new BadRequestException('Membership not found');
    if (tenantId && membership.cohort.tenantId !== tenantId) throw new ForbiddenException('Membership does not belong to your tenant');

    const session = await this.prisma.cohortSession.findUnique({ where: { id: sessionId } });
    if (!session || session.cohortId !== cohortId) throw new BadRequestException('Invalid session');

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

  async adminRemoveStudentFromCohort(userId: string, cohortId: string, tenantId?: string) {
    const membership = await this.prisma.cohortMembership.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      include: { cohort: true }
    });
    if (!membership) throw new BadRequestException('Membership not found');
    if (tenantId && membership.cohort.tenantId !== tenantId) throw new ForbiddenException('Membership does not belong to your tenant');

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

  async listStudents(tenantId: string) {
    const userRoles = await this.prisma.userTenantRole.findMany({
      where: { tenantId, role: 'STUDENT' },
      include: { user: true },
    });

    const userIds = userRoles.map((ur) => ur.userId);

    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        memberships: {
          where: { cohort: { tenantId } },
          include: { session: true, cohort: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}
