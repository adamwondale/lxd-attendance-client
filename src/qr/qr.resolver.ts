import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { QrService } from './qr.service';
import { GqlAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Resolver()
export class QrResolver {
  constructor(
    private readonly qrService: QrService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => String)
  @UseGuards(GqlAuthGuard)
  myQrBadge(@CurrentUser() user: { userId: string, tenantId: string }) {
    return this.qrService.generateStudentQr(user.userId);
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async studentQrBadge(
    @CurrentUser() user: { userId: string, tenantId: string },
    @Args('studentId') studentId: string
  ) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { tenants: true }
    });
    const hasTenantAccess = student?.tenants.some(t => t.tenantId === user.tenantId);
    if (!hasTenantAccess) {
      throw new ForbiddenException('Student does not belong to your authorized tenant');
    }
    return this.qrService.generateStudentQr(studentId);
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async generateCohortQr(
    @CurrentUser() user: { userId: string, tenantId: string },
    @Args('cohortId') cohortId: string
  ) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (cohort?.tenantId !== user.tenantId) {
      throw new ForbiddenException('Cohort does not belong to your authorized tenant');
    }
    return this.qrService.generateQr(cohortId);
  }
}
