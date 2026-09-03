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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohortResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const cohort_type_1 = require("./dto/cohort.type");
const dashboard_type_1 = require("./dto/dashboard.type");
const cohort_service_1 = require("./cohort.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
let CohortResolver = class CohortResolver {
    cohortService;
    pubSub;
    constructor(cohortService, pubSub) {
        this.cohortService = cohortService;
        this.pubSub = pubSub;
    }
    async createCohort(user, name, pin, startDate, endDate) {
        const cohort = await this.cohortService.createCohort(user.tenantId, name, pin, new Date(startDate), new Date(endDate));
        this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        return cohort.id;
    }
    async updateCohort(user, cohortId, name, pin, startDate, endDate, isActive) {
        const cohort = await this.cohortService.updateCohort(user.tenantId, cohortId, name, pin, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, isActive);
        this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        return cohort.id;
    }
    async deleteCohort(user, cohortId) {
        const deleted = await this.cohortService.deleteCohort(user.tenantId, cohortId);
        if (deleted) {
            this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        }
        return deleted;
    }
    async createCohortSession(user, cohortId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes) {
        const session = await this.cohortService.createCohortSession(user.tenantId, cohortId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes);
        this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        return session.id;
    }
    async updateCohortSession(user, sessionId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes) {
        const session = await this.cohortService.updateCohortSession(user.tenantId, sessionId, name, startTime, gracePeriodMinutes, recurrenceDays, latePenaltyAmount, escalationThresholdMinutes, escalationRate, escalationIntervalMinutes);
        this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        return session.id;
    }
    async deleteCohortSession(user, sessionId) {
        const deleted = await this.cohortService.deleteCohortSession(user.tenantId, sessionId);
        if (deleted) {
            this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
        }
        return deleted;
    }
    async listCohorts(user) {
        return this.cohortService.listCohorts(user.userId);
    }
    async cohortDetails(user, id) {
        return this.cohortService.getCohortDetails(user.tenantId, id);
    }
    async dashboardMetrics(user) {
        return this.cohortService.getDashboardMetrics(user.userId);
    }
    async publicActiveCohorts() {
        return this.cohortService.publicActiveCohorts();
    }
    async availableCohorts(user) {
        return this.cohortService.availableCohorts(user.userId);
    }
    async myCohorts(user) {
        return this.cohortService.myCohorts(user.userId);
    }
    async joinCohort(user, cohortId, sessionId, pin) {
        const joined = await this.cohortService.joinCohort(user.userId, cohortId, sessionId, pin);
        if (joined) {
            this.pubSub.publish('cohortsUpdated', { onCohortsUpdated: true });
            this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        }
        return joined;
    }
    async companyProfile(user) {
        return this.cohortService.getCompanyProfile(user.userId);
    }
    async updateCompanyProfile(user, companyName, companyEmail, companyPhone, adminName, username) {
        return this.cohortService.updateCompanyProfile(user.userId, companyName, companyEmail, companyPhone, adminName, username);
    }
    onCohortsUpdated() {
        return this.pubSub.asyncIterableIterator('cohortsUpdated');
    }
    async joinedSession(cohort, user) {
        if (!user)
            return null;
        return this.cohortService.getJoinedSession(user.userId, cohort.id);
    }
};
exports.CohortResolver = CohortResolver;
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('name')),
    __param(2, (0, graphql_1.Args)('pin')),
    __param(3, (0, graphql_1.Args)('startDate')),
    __param(4, (0, graphql_1.Args)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "createCohort", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __param(2, (0, graphql_1.Args)('name', { nullable: true })),
    __param(3, (0, graphql_1.Args)('pin', { nullable: true })),
    __param(4, (0, graphql_1.Args)('startDate', { nullable: true })),
    __param(5, (0, graphql_1.Args)('endDate', { nullable: true })),
    __param(6, (0, graphql_1.Args)('isActive', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "updateCohort", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "deleteCohort", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __param(2, (0, graphql_1.Args)('name')),
    __param(3, (0, graphql_1.Args)('startTime')),
    __param(4, (0, graphql_1.Args)('gracePeriodMinutes', { type: () => graphql_1.Int })),
    __param(5, (0, graphql_1.Args)('recurrenceDays', { type: () => [String] })),
    __param(6, (0, graphql_1.Args)('latePenaltyAmount', { type: () => graphql_1.Int })),
    __param(7, (0, graphql_1.Args)('escalationThresholdMinutes', { type: () => graphql_1.Int, nullable: true })),
    __param(8, (0, graphql_1.Args)('escalationRate', { type: () => graphql_1.Int, nullable: true })),
    __param(9, (0, graphql_1.Args)('escalationIntervalMinutes', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Array, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "createCohortSession", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('sessionId')),
    __param(2, (0, graphql_1.Args)('name', { nullable: true })),
    __param(3, (0, graphql_1.Args)('startTime', { nullable: true })),
    __param(4, (0, graphql_1.Args)('gracePeriodMinutes', { type: () => graphql_1.Int, nullable: true })),
    __param(5, (0, graphql_1.Args)('recurrenceDays', { type: () => [String], nullable: true })),
    __param(6, (0, graphql_1.Args)('latePenaltyAmount', { type: () => graphql_1.Int, nullable: true })),
    __param(7, (0, graphql_1.Args)('escalationThresholdMinutes', { type: () => graphql_1.Int, nullable: true })),
    __param(8, (0, graphql_1.Args)('escalationRate', { type: () => graphql_1.Int, nullable: true })),
    __param(9, (0, graphql_1.Args)('escalationIntervalMinutes', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Array, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "updateCohortSession", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "deleteCohortSession", null);
__decorate([
    (0, graphql_1.Query)(() => [cohort_type_1.Cohort]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "listCohorts", null);
__decorate([
    (0, graphql_1.Query)(() => cohort_type_1.Cohort, { nullable: true }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "cohortDetails", null);
__decorate([
    (0, graphql_1.Query)(() => dashboard_type_1.DashboardMetrics),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "dashboardMetrics", null);
__decorate([
    (0, graphql_1.Query)(() => [cohort_type_1.PublicCohort]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "publicActiveCohorts", null);
__decorate([
    (0, graphql_1.Query)(() => [cohort_type_1.PublicCohort]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "availableCohorts", null);
__decorate([
    (0, graphql_1.Query)(() => [cohort_type_1.Cohort]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "myCohorts", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __param(2, (0, graphql_1.Args)('sessionId')),
    __param(3, (0, graphql_1.Args)('pin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "joinCohort", null);
__decorate([
    (0, graphql_1.Query)(() => dashboard_type_1.CompanyProfile),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "companyProfile", null);
__decorate([
    (0, graphql_1.Mutation)(() => dashboard_type_1.CompanyProfile),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('companyName', { nullable: true })),
    __param(2, (0, graphql_1.Args)('companyEmail', { nullable: true })),
    __param(3, (0, graphql_1.Args)('companyPhone', { nullable: true })),
    __param(4, (0, graphql_1.Args)('adminName', { nullable: true })),
    __param(5, (0, graphql_1.Args)('username', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "updateCompanyProfile", null);
__decorate([
    (0, graphql_1.Subscription)(() => Boolean),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CohortResolver.prototype, "onCohortsUpdated", null);
__decorate([
    (0, graphql_1.ResolveField)(() => cohort_type_1.CohortSession, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof cohort_type_1.Cohort !== "undefined" && cohort_type_1.Cohort) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], CohortResolver.prototype, "joinedSession", null);
exports.CohortResolver = CohortResolver = __decorate([
    (0, graphql_1.Resolver)(() => cohort_type_1.Cohort),
    __param(1, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [typeof (_a = typeof cohort_service_1.CohortService !== "undefined" && cohort_service_1.CohortService) === "function" ? _a : Object, Object])
], CohortResolver);
//# sourceMappingURL=cohort.resolver.js.map