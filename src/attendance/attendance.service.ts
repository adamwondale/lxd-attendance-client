import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { Prisma } from '@prisma/client';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const LOCKOUT_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService, private readonly qrService: QrService) {}

  async getMyAttendanceSummary(userId: string) {
    const logs = await this.prisma.attendanceLog.findMany({ where: { userId }, include: { session: true } });
    const penalties = await this.prisma.penalty.findMany({ where: { userId, status: 'ACTIVE' } });
    const totalPenaltiesUnpaid = penalties.reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      totalAttended: logs.length,
      totalLate: logs.filter((l: any) => l.isLate).length,
      totalPenaltiesUnpaid,
    };
  }

  private dateInTimezone(date: Date, timezone = 'Africa/Addis_Ababa') {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  private getExpectedTime(now: Date, startTime: string, graceMinutes: number, timezone: string = 'Africa/Addis_Ababa') {
    const [hours, minutes] = startTime.split(':').map(Number);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    // Create an ISO string in the target timezone then let the JS date parse it
    const expectedTimeStr = `${y}-${m}-${d}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Calculate expected date time taking the offset into account
    const expectedLocal = new Date(expectedTimeStr);

    // Get the UTC offset for the given timezone at this local time
    const localTimeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const tzStr = localTimeFormatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value; // e.g. "GMT+03:00"

    let offsetHours = 0;
    let offsetMinutes = 0;

    if (tzStr && tzStr.startsWith('GMT')) {
      const match = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '-' ? -1 : 1;
        offsetHours = parseInt(match[2], 10) * sign;
        offsetMinutes = parseInt(match[3], 10) * sign;
      }
    }

    // Construct actual Date object by converting local time to UTC explicitly
    const expected = new Date(Date.UTC(
       expectedLocal.getFullYear(),
       expectedLocal.getMonth(),
       expectedLocal.getDate(),
       hours - offsetHours,
       minutes + graceMinutes - offsetMinutes,
       0
    ));

    return expected;
  }

  private calculatePenalty(latenessMinutes: number, session: any) {
    if (latenessMinutes <= 0) return 0;
    const base = session.cohort?.latePenaltyAmount !== undefined ? session.cohort.latePenaltyAmount : (session.latePenaltyAmount ?? 25);
    if (base === 0) return 0;
    const threshold = session.escalationThresholdMinutes ?? 15;
    const rate = session.escalationRate ?? 5;
    const interval = Math.max(1, session.escalationIntervalMinutes ?? 5);
    if (latenessMinutes <= threshold) return base;
    return base + Math.floor((latenessMinutes - threshold) / interval) * rate;
  }

  private async assertDeviceAvailable(deviceSignature?: string) {
    if (!deviceSignature) return;
    const lock = await this.prisma.deviceLock.findUnique({ where: { signature: deviceSignature } });
    if (lock && lock.lockedUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.max(1, Math.ceil((lock.lockedUntil.getTime() - Date.now()) / 60000));
      throw new ForbiddenException(`Device locked. Try again in about ${remainingMinutes} minutes.`);
    }
  }

  private async lockDevice(deviceSignature?: string) {
    if (!deviceSignature) return;
    const now = new Date();
    const lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    const released = await this.prisma.deviceLock.updateMany({
      where: { signature: deviceSignature, lockedUntil: { lte: now } },
      data: { lockedUntil },
    });
    if (released.count) return;
    try {
      await this.prisma.deviceLock.create({ data: { signature: deviceSignature, lockedUntil } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Device was used by another check-in. Please wait 3 hours before scanning again.');
      }
      throw error;
    }
  }

  async checkSessionAccess(sessionId: string, tenantId: string): Promise<boolean> {
    const session = await this.prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: true }
    });
    return session?.cohort?.tenantId === tenantId;
  }

  async logAttendance(userId: string, qrCode: string, deviceSignature?: string, tenantId?: string) {
    const parts = qrCode.split('.');
    if (parts.length !== 3) throw new BadRequestException('Invalid QR code format');
    const cohortId = parts[0];
    this.qrService.verifyQr(qrCode, cohortId);

    const membership = await this.prisma.cohortMembership.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      include: { session: { include: { cohort: { include: { tenant: true } } } } }
    });
    if (!membership || !membership.session) {
      throw new BadRequestException('You are not enrolled in any session for this cohort');
    }

    if (tenantId && membership.session.cohort.tenantId !== tenantId) {
       throw new ForbiddenException('You do not belong to the tenant associated with this session');
    }

    await this.assertDeviceAvailable(deviceSignature);
    return this.processAttendance(userId, membership.sessionId!, membership.session, deviceSignature, false);
  }

  async logAttendanceById(traineeId: string, qrCode: string, deviceSignature?: string, tenantId?: string) {
    const parts = qrCode.split('.');
    if (parts.length !== 3) throw new BadRequestException('Invalid QR code format');
    const cohortId = parts[0];
    this.qrService.verifyQr(qrCode, cohortId);
    const user = await this.prisma.user.findUnique({ where: { id: traineeId } });
    if (!user) throw new BadRequestException('Invalid trainee identifier provided.');
    const membership = await this.prisma.cohortMembership.findUnique({
      where: { cohortId_userId: { cohortId, userId: traineeId } },
      include: { session: { include: { cohort: { include: { tenant: true } } } } }
    });
    if (!membership?.session) throw new BadRequestException('Trainee is not enrolled in this cohort.');
    if (tenantId && membership.session.cohort.tenantId !== tenantId) {
      throw new ForbiddenException('Trainee does not belong to the authorized tenant for this session');
    }
    await this.assertDeviceAvailable(deviceSignature);
    return this.processAttendance(traineeId, membership.sessionId!, membership.session, deviceSignature, false);
  }

  async adminLogAttendance(studentId: string, sessionId: string, tenantId?: string) {
    const session = await this.prisma.cohortSession.findUnique({
        where: { id: sessionId },
        include: { cohort: true }
    });
    if (!session) throw new BadRequestException('Session not found');
    if (tenantId && session.cohort.tenantId !== tenantId) {
        throw new ForbiddenException('Session does not belong to your authorized tenant');
    }
    return this.processAttendance(studentId, sessionId, undefined, undefined, true);
  }

  async adminScanStudentBadge(badgeCode: string, tenantId?: string) {
    const studentId = this.qrService.verifyStudentQr(badgeCode);
    const memberships = await this.prisma.cohortMembership.findMany({
      where: { userId: studentId, status: 'ACTIVE' },
      include: { session: { include: { cohort: { include: { tenant: true } } } } }
    });
    if (!memberships.length) throw new BadRequestException('Student is not enrolled in any active cohorts.');

    // Filter memberships to only allow those belonging to the admin's tenant
    const allowedMemberships = tenantId
       ? memberships.filter(m => m.session?.cohort?.tenantId === tenantId)
       : memberships;

    if (!allowedMemberships.length) throw new ForbiddenException('Student has no active enrollments in your authorized tenant.');

    const now = new Date();
    const selected = allowedMemberships[0];
    if (!selected.session) throw new BadRequestException('Student membership has no assigned session.');
    const timezone = selected.session.cohort?.tenant?.timezone || 'Africa/Addis_Ababa';

    // We use Intl.DateTimeFormat to get the weekday in the target timezone
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
    const currentDay = weekdayFormatter.format(now).toUpperCase();

    const active = allowedMemberships.find(m => {
      const session = m.session;
      if (!session) return false;
      const days = this.normalizeDays(session.recurrenceDays);
      return !days.length || days.includes('EVERYDAY') || days.includes('ALL') || days.includes(currentDay);
    });
    const finalSelected = active || allowedMemberships[0];
    if (!finalSelected.session) throw new BadRequestException('Student membership has no assigned session.');
    return this.processAttendance(studentId, finalSelected.sessionId!, finalSelected.session, undefined, true);
  }

  private async processAttendance(userId: string, sessionId: string, preloadedSession?: any, deviceSignature?: string, isManualScan = false) {
    const session = preloadedSession || await this.prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: { include: { tenant: true } } },
    });
    if (!session) throw new BadRequestException('Session not found');

    const now = new Date();
    const timezone = session.cohort?.tenant?.timezone || 'Africa/Addis_Ababa';
    const dateStr = this.dateInTimezone(now, timezone);

    const existingLog = await this.prisma.attendanceLog.findUnique({
      where: { sessionId_userId_date: { sessionId, userId, date: dateStr } },
      include: { user: { select: { id: true, name: true, email: true } }, penalty: true }
    });
    if (existingLog) return existingLog;

    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
    const currentDay = weekdayFormatter.format(now).toUpperCase();

    const days = this.normalizeDays(session.recurrenceDays);
    if (days.length && !days.includes('EVERYDAY') && !days.includes('ALL') && !days.includes(currentDay)) {
      throw new BadRequestException(`This session does not run on ${currentDay}`);
    }

    // Get expected time in the tenant timezone
    const expectedTime = this.getExpectedTime(now, session.startTime, session.gracePeriodMinutes, timezone);
    const isLate = now.getTime() > expectedTime.getTime();
    const latenessMinutes = isLate ? Math.floor((now.getTime() - expectedTime.getTime()) / 60000) : 0;
    const calculatedPenalty = this.calculatePenalty(latenessMinutes, session);

    if (!isManualScan) {
      // Coordinate lockDevice before creating attendance to distinguish P2002
      await this.lockDevice(deviceSignature);
    }

    try {
      const log = await this.prisma.attendanceLog.create({
        data: {
          sessionId, userId, date: dateStr, isLate, latenessMinutes,
          calculatedPenalty, deviceSignature: deviceSignature || null, isManualScan,
        },
        include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
      });

      if (calculatedPenalty > 0) {
        await this.prisma.penalty.create({
          data: { attendanceLogId: log.id, userId, amount: calculatedPenalty },
        });
      }
      return this.prisma.attendanceLog.findUnique({
        where: { id: log.id },
        include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.attendanceLog.findUnique({
          where: { sessionId_userId_date: { sessionId, userId, date: dateStr } },
          include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  private normalizeDays(days: string[] = []) {
    return days.map((day) => {
      const value = day.toUpperCase();
      return value === 'EVERYDAY' ? 'EVERYDAY' : value.slice(0, 3);
    });
  }

  async getAttendanceLogs(cohortId?: string, sessionId?: string, tenantId?: string) {
    const where: any = {};
    if (sessionId) {
      where.sessionId = sessionId;
    } else if (cohortId) {
      where.session = { cohortId };
    }
    if (tenantId) {
      where.session = where.session || {};
      where.session.cohort = { tenantId };
    }

    return this.prisma.attendanceLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        penalty: true,
        session: { include: { cohort: true } },
      },
      orderBy: { scannedAt: 'desc' },
    });
  }

  async getAttendanceReport(tenantId: string, startDate: string, endDate: string, cohortId?: string, sessionId?: string) {
    // Basic array implementation of the report
    const sFilter = sessionId ? { id: sessionId } : cohortId ? { cohortId } : {};

    const memberships = await this.prisma.cohortMembership.findMany({
      where: {
        session: { ...sFilter, cohort: { tenantId } }
      },
      include: {
        user: true,
        session: { include: { cohort: true } },
      }
    });

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        session: { ...sFilter, cohort: { tenantId } },
      },
      include: { penalty: true }
    });

    const logMap = new Map();
    for (const log of logs) {
      logMap.set(`${log.sessionId}|${log.userId}|${log.date}`, log);
    }

    const rows: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const date = this.dateInTimezone(d, 'UTC'); // Just string manipulation
      const day = DAY_NAMES[d.getDay()];

      for (const membership of memberships) {
        if (!membership.session) continue;
        const days = this.normalizeDays(membership.session.recurrenceDays);
        if (days.length && !days.includes('ALL') && !days.includes('EVERYDAY') && !days.includes(day)) continue;
        const log = logMap.get(`${membership.session.id}|${membership.userId}|${date}`);
        rows.push({
          id: log?.id || `absent-${membership.session.id}-${membership.userId}-${date}`,
          date,
          status: log ? (log.isLate ? 'Late' : 'Present') : 'Absent',
          traineeId: membership.userId,
          traineeName: membership.user.name,
          sessionName: membership.session.name,
          cohortName: membership.session.cohort.name,
          latenessMinutes: log?.latenessMinutes || null,
          penaltyAmount: log?.penalty?.amount || null,
          penaltyWaived: log?.penalty?.status === 'WAIVED',
        });
      }
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date) || a.traineeName.localeCompare(b.traineeName));
  }

  async waivePenalty(penaltyId: string) {
    return this.prisma.penalty.update({
      where: { id: penaltyId },
      data: { status: 'WAIVED' }
    });
  }
}
