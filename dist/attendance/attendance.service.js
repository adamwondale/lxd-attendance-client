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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const qr_service_1 = require("../qr/qr.service");
const client_1 = require("@prisma/client");
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const LOCKOUT_MS = 3 * 60 * 60 * 1000;
let AttendanceService = class AttendanceService {
    prisma;
    qrService;
    constructor(prisma, qrService) {
        this.prisma = prisma;
        this.qrService = qrService;
    }
    normalizeDays(days = []) {
        return days.map((day) => {
            const value = day.toUpperCase();
            return value === 'EVERYDAY' ? 'EVERYDAY' : value.slice(0, 3);
        });
    }
    dateInTimezone(date, timezone = 'Africa/Addis_Ababa') {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(date);
        const get = (type) => parts.find(p => p.type === type)?.value || '';
        return `${get('year')}-${get('month')}-${get('day')}`;
    }
    getExpectedTime(now, startTime, graceMinutes) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const expected = new Date(now);
        expected.setUTCHours(hours - 3, minutes + graceMinutes, 0, 0);
        return expected;
    }
    calculatePenalty(latenessMinutes, session) {
        if (latenessMinutes <= 0)
            return 0;
        const base = session.latePenaltyAmount ?? 25;
        const threshold = session.escalationThresholdMinutes ?? 15;
        const rate = session.escalationRate ?? 5;
        const interval = Math.max(1, session.escalationIntervalMinutes ?? 5);
        if (latenessMinutes <= threshold)
            return base;
        return base + Math.floor((latenessMinutes - threshold) / interval) * rate;
    }
    async assertDeviceAvailable(deviceSignature) {
        if (!deviceSignature)
            return;
        const lock = await this.prisma.deviceLock.findUnique({ where: { signature: deviceSignature } });
        if (lock && lock.lockedUntil.getTime() > Date.now()) {
            const remainingMinutes = Math.max(1, Math.ceil((lock.lockedUntil.getTime() - Date.now()) / 60000));
            throw new common_1.ForbiddenException(`Device locked. Try again in about ${remainingMinutes} minutes.`);
        }
    }
    async lockDevice(deviceSignature) {
        if (!deviceSignature)
            return;
        const now = new Date();
        const lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        const released = await this.prisma.deviceLock.updateMany({
            where: { signature: deviceSignature, lockedUntil: { lte: now } },
            data: { lockedUntil },
        });
        if (released.count)
            return;
        try {
            await this.prisma.deviceLock.create({ data: { signature: deviceSignature, lockedUntil } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ForbiddenException('Device was used by another check-in. Please wait 3 hours before scanning again.');
            }
            throw error;
        }
    }
    async logAttendance(userId, qrCode, deviceSignature) {
        const parts = qrCode.split('.');
        if (parts.length !== 3)
            throw new common_1.BadRequestException('Invalid QR code format');
        const cohortId = parts[0];
        this.qrService.verifyQr(qrCode, cohortId);
        const membership = await this.prisma.cohortMembership.findUnique({
            where: { cohortId_userId: { cohortId, userId } },
            include: { session: { include: { cohort: { include: { tenant: true } } } } }
        });
        if (!membership || !membership.session) {
            throw new common_1.BadRequestException('You are not enrolled in any session for this cohort');
        }
        await this.assertDeviceAvailable(deviceSignature);
        return this.processAttendance(userId, membership.sessionId, membership.session, deviceSignature, false);
    }
    async logAttendanceById(traineeId, qrCode, deviceSignature) {
        const parts = qrCode.split('.');
        if (parts.length !== 3)
            throw new common_1.BadRequestException('Invalid QR code format');
        const cohortId = parts[0];
        this.qrService.verifyQr(qrCode, cohortId);
        const user = await this.prisma.user.findUnique({ where: { id: traineeId } });
        if (!user)
            throw new common_1.BadRequestException('Invalid trainee identifier provided.');
        const membership = await this.prisma.cohortMembership.findUnique({
            where: { cohortId_userId: { cohortId, userId: traineeId } },
            include: { session: { include: { cohort: { include: { tenant: true } } } } }
        });
        if (!membership?.session)
            throw new common_1.BadRequestException('Trainee is not enrolled in this cohort.');
        await this.assertDeviceAvailable(deviceSignature);
        return this.processAttendance(traineeId, membership.sessionId, membership.session, deviceSignature, false);
    }
    async adminLogAttendance(studentId, sessionId) {
        return this.processAttendance(studentId, sessionId, undefined, undefined, true);
    }
    async adminScanStudentBadge(badgeCode) {
        const studentId = this.qrService.verifyStudentQr(badgeCode);
        const memberships = await this.prisma.cohortMembership.findMany({
            where: { userId: studentId, status: 'ACTIVE' },
            include: { session: { include: { cohort: { include: { tenant: true } } } } }
        });
        if (!memberships.length)
            throw new common_1.BadRequestException('Student is not enrolled in any active cohorts.');
        const now = new Date();
        const currentDay = DAY_NAMES[now.getDay()];
        const active = memberships.find(m => {
            const session = m.session;
            if (!session)
                return false;
            const days = this.normalizeDays(session.recurrenceDays);
            return !days.length || days.includes('EVERYDAY') || days.includes('ALL') || days.includes(currentDay);
        });
        const selected = active || memberships[0];
        if (!selected.session)
            throw new common_1.BadRequestException('Student membership has no assigned session.');
        return this.processAttendance(studentId, selected.sessionId, selected.session, undefined, true);
    }
    async processAttendance(userId, sessionId, preloadedSession, deviceSignature, isManualScan = false) {
        const now = new Date();
        const timezone = preloadedSession?.cohort?.tenant?.timezone || 'Africa/Addis_Ababa';
        const dateStr = this.dateInTimezone(now, timezone);
        const existingLog = await this.prisma.attendanceLog.findUnique({
            where: { sessionId_userId_date: { sessionId, userId, date: dateStr } },
            include: { user: { select: { id: true, name: true, email: true } }, penalty: true }
        });
        if (existingLog)
            return existingLog;
        const session = preloadedSession || await this.prisma.cohortSession.findUnique({
            where: { id: sessionId },
            include: { cohort: { include: { tenant: true } } },
        });
        if (!session)
            throw new common_1.BadRequestException('Session not found');
        const currentDay = DAY_NAMES[now.getDay()];
        const days = this.normalizeDays(session.recurrenceDays);
        if (days.length && !days.includes('EVERYDAY') && !days.includes('ALL') && !days.includes(currentDay)) {
            throw new common_1.BadRequestException(`This session does not run on ${currentDay}`);
        }
        const expectedTime = this.getExpectedTime(now, session.startTime, session.gracePeriodMinutes);
        const isLate = now.getTime() > expectedTime.getTime();
        const latenessMinutes = isLate ? Math.floor((now.getTime() - expectedTime.getTime()) / 60000) : 0;
        const calculatedPenalty = this.calculatePenalty(latenessMinutes, session);
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
            if (!isManualScan)
                await this.lockDevice(deviceSignature);
            return this.prisma.attendanceLog.findUnique({
                where: { id: log.id },
                include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return this.prisma.attendanceLog.findUnique({
                    where: { sessionId_userId_date: { sessionId, userId, date: dateStr } },
                    include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
                });
            }
            throw error;
        }
    }
    async getMyAttendanceSummary(userId) {
        const logs = await this.prisma.attendanceLog.findMany({
            where: { userId },
            include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
            orderBy: { scannedAt: 'desc' },
            take: 1000,
        });
        const lateLogs = logs.filter(log => log.isLate);
        return {
            presentDays: new Set(logs.map(log => log.date)).size,
            lateDays: new Set(lateLogs.map(log => log.date)).size,
            totalPenalty: logs.reduce((sum, log) => sum + (log.penalty?.amount || log.calculatedPenalty || 0), 0),
            lateLogs,
        };
    }
    async getAttendanceLogs(cohortId, sessionId, tenantId) {
        const where = {};
        if (tenantId)
            where.session = { cohort: { tenantId } };
        if (sessionId)
            where.sessionId = sessionId;
        else if (cohortId)
            where.session = tenantId ? { cohortId, cohort: { tenantId } } : { cohortId };
        return this.prisma.attendanceLog.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } }, penalty: true, session: true },
            orderBy: { scannedAt: 'desc' }, take: 500,
        });
    }
    async getDailyRosterStats(tenantId) {
        const now = new Date();
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        const date = this.dateInTimezone(now, tenant?.timezone || 'Africa/Addis_Ababa');
        const memberships = await this.prisma.cohortMembership.findMany({
            where: { status: 'ACTIVE', cohort: { tenantId, isActive: true } },
            include: { user: { select: { id: true } }, session: true },
        });
        const logs = await this.prisma.attendanceLog.findMany({
            where: { date, session: { cohort: { tenantId, isActive: true } } },
            select: { userId: true, isLate: true },
        });
        const presentIds = new Set(logs.map(l => l.userId));
        return {
            presentToday: presentIds.size,
            lateToday: new Set(logs.filter(l => l.isLate).map(l => l.userId)).size,
            absentToday: new Set(memberships.map(m => m.user.id).filter(id => !presentIds.has(id))).size,
        };
    }
    async getAttendanceReport(tenantId, startDate, endDate, cohortId, sessionId) {
        const memberships = await this.prisma.cohortMembership.findMany({
            where: {
                status: 'ACTIVE',
                cohort: { tenantId, isActive: true, ...(cohortId ? { id: cohortId } : {}) },
                ...(sessionId ? { sessionId } : {}),
            },
            include: { user: true, session: { include: { cohort: true } } },
        });
        const logs = await this.prisma.attendanceLog.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                session: { cohort: { tenantId, ...(cohortId ? { id: cohortId } : {}) }, ...(sessionId ? { id: sessionId } : {}) },
            },
            include: { penalty: true },
        });
        const logMap = new Map(logs.map(l => [`${l.sessionId}|${l.userId}|${l.date}`, l]));
        const rows = [];
        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);
        for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
            const date = cursor.toISOString().slice(0, 10);
            const day = DAY_NAMES[cursor.getUTCDay()];
            for (const membership of memberships) {
                if (!membership.session)
                    continue;
                const days = this.normalizeDays(membership.session.recurrenceDays);
                if (days.length && !days.includes('ALL') && !days.includes('EVE') && !days.includes(day))
                    continue;
                const log = logMap.get(`${membership.session.id}|${membership.userId}|${date}`);
                rows.push({
                    id: log?.id || `absent-${membership.session.id}-${membership.userId}-${date}`,
                    date,
                    status: log ? (log.isLate ? 'Late' : 'Present') : 'Absent',
                    traineeId: membership.userId,
                    traineeName: membership.user.name,
                    sessionName: membership.session.name,
                    cohortName: membership.session.cohort.name,
                    latenessMinutes: log?.latenessMinutes || 0,
                    penalty: log?.penalty?.amount || log?.calculatedPenalty || 0,
                });
            }
        }
        return rows;
    }
    async waivePenalty(penaltyId) {
        return this.prisma.penalty.update({ where: { id: penaltyId }, data: { status: 'WAIVED' } });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, qr_service_1.QrService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map