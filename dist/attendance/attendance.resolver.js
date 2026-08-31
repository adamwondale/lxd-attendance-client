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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const attendance_type_1 = require("./dto/attendance.type");
let AttendanceResolver = class AttendanceResolver {
    attendanceService;
    pubSub;
    constructor(attendanceService, pubSub) {
        this.attendanceService = attendanceService;
        this.pubSub = pubSub;
    }
    async myAttendanceSummary(user) {
        return this.attendanceService.getMyAttendanceSummary(user.userId);
    }
    async getAttendanceLogs(user, cohortId, sessionId) {
        return this.attendanceService.getAttendanceLogs(cohortId, sessionId, user.tenantId);
    }
    async attendanceReport(user, startDate, endDate, cohortId, sessionId) {
        return this.attendanceService.getAttendanceReport(user.tenantId, startDate, endDate, cohortId, sessionId);
    }
    async waivePenalty(penaltyId) {
        const penalty = await this.attendanceService.waivePenalty(penaltyId);
        this.pubSub.publish('attendanceUpdated', { onAttendanceUpdated: true });
        return penalty;
    }
    async logAttendance(user, qrCode, deviceSignature) {
        const parts = qrCode.split('.');
        const cohortId = parts[0] || '';
        const log = await this.attendanceService.logAttendance(user.userId, qrCode, deviceSignature);
        if (log)
            this.publishAttendance(log, cohortId);
        return log.id;
    }
    async logAttendanceById(traineeId, qrCode, deviceSignature) {
        const parts = qrCode.split('.');
        const cohortId = parts[0] || '';
        const log = await this.attendanceService.logAttendanceById(traineeId, qrCode, deviceSignature);
        if (log)
            this.publishAttendance(log, cohortId);
        return log.id;
    }
    async adminLogAttendance(studentId, sessionId) {
        const log = await this.attendanceService.adminLogAttendance(studentId, sessionId);
        if (log)
            this.publishAttendance(log, log.session?.cohortId || '');
        return log.id;
    }
    async adminScanStudentBadge(badgeCode) {
        const log = await this.attendanceService.adminScanStudentBadge(badgeCode);
        if (log)
            this.publishAttendance(log, log.session?.cohortId || '');
        return log.id;
    }
    publishAttendance(log, cohortId) {
        const event = {
            id: log.id,
            cohortId,
            sessionId: log.sessionId,
            date: log.date,
            scannedAt: log.scannedAt,
            user: log.user,
            isLate: log.isLate,
            latenessMinutes: log.latenessMinutes || 0,
            calculatedPenalty: log.penalty?.amount || log.calculatedPenalty || 0,
        };
        this.pubSub.publish('attendanceLogged', { attendanceLogged: event });
        this.pubSub.publish('attendanceUpdated', { onAttendanceUpdated: true });
    }
    attendanceLogged(sessionId) {
        return this.pubSub.asyncIterableIterator('attendanceLogged');
    }
    onAttendanceUpdated() {
        return this.pubSub.asyncIterableIterator('attendanceUpdated');
    }
};
exports.AttendanceResolver = AttendanceResolver;
__decorate([
    (0, graphql_1.Query)(() => attendance_type_1.StudentAttendanceSummary),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "myAttendanceSummary", null);
__decorate([
    (0, graphql_1.Query)(() => [attendance_type_1.AttendanceLog]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('cohortId', { nullable: true })),
    __param(2, (0, graphql_1.Args)('sessionId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "getAttendanceLogs", null);
__decorate([
    (0, graphql_1.Query)(() => [attendance_type_1.AttendanceReportRow]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('startDate')),
    __param(2, (0, graphql_1.Args)('endDate')),
    __param(3, (0, graphql_1.Args)('cohortId', { nullable: true })),
    __param(4, (0, graphql_1.Args)('sessionId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "attendanceReport", null);
__decorate([
    (0, graphql_1.Mutation)(() => attendance_type_1.Penalty),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('penaltyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "waivePenalty", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('qrCode')),
    __param(2, (0, graphql_1.Args)('deviceSignature', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "logAttendance", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('traineeId')),
    __param(1, (0, graphql_1.Args)('qrCode')),
    __param(2, (0, graphql_1.Args)('deviceSignature', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "logAttendanceById", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "adminLogAttendance", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('badgeCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceResolver.prototype, "adminScanStudentBadge", null);
__decorate([
    (0, graphql_1.Subscription)(() => attendance_type_1.AttendanceEvent, {
        filter: (payload, variables) => payload.attendanceLogged.sessionId === variables.sessionId,
        resolve: (payload) => payload.attendanceLogged,
    }),
    __param(0, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "attendanceLogged", null);
__decorate([
    (0, graphql_1.Subscription)(() => Boolean),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendanceResolver.prototype, "onAttendanceUpdated", null);
exports.AttendanceResolver = AttendanceResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __param(1, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService,
        graphql_subscriptions_1.PubSub])
], AttendanceResolver);
//# sourceMappingURL=attendance.resolver.js.map