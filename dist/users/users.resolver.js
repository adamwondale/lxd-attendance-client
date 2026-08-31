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
exports.UsersResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const cohort_type_1 = require("../cohort/dto/cohort.type");
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
const users_service_1 = require("./users.service");
const user_type_1 = require("./dto/user.type");
let UsersResolver = class UsersResolver {
    usersService;
    pubSub;
    constructor(usersService, pubSub) {
        this.usersService = usersService;
        this.pubSub = pubSub;
    }
    me(user) {
        return this.usersService.me(user.userId);
    }
    updateProfile(user, name, username) {
        return this.usersService.updateProfile(user.userId, name, username);
    }
    listStudents(user) {
        return this.usersService.listStudents(user.tenantId);
    }
    async adminCreateStudent(name, email, phone, username, password, cohortId, sessionId) {
        const created = await this.usersService.adminCreateStudent(name, email, phone, username, password, cohortId, sessionId);
        this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        return created;
    }
    async adminUpdateStudent(id, name, email) {
        const updated = await this.usersService.adminUpdateStudent(id, name, email);
        this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        return updated;
    }
    async adminDeleteStudent(id) {
        const deleted = await this.usersService.adminDeleteStudent(id);
        if (deleted) {
            this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        }
        return deleted;
    }
    async adminEnrollStudent(userId, cohortId, sessionId) {
        await this.usersService.adminEnrollStudent(userId, cohortId, sessionId);
        this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        return true;
    }
    async adminUpdateStudentMembership(userId, cohortId, sessionId) {
        await this.usersService.adminUpdateStudentMembership(userId, cohortId, sessionId);
        this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        return true;
    }
    async adminRemoveStudentFromCohort(userId, cohortId) {
        await this.usersService.adminRemoveStudentFromCohort(userId, cohortId);
        this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
        return true;
    }
    onStudentsUpdated() {
        return this.pubSub.asyncIterableIterator('studentsUpdated');
    }
    async memberships(user) {
        return this.usersService.getMemberships(user.id);
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Query)(() => user_type_1.User),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "me", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_type_1.User),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('name', { nullable: true })),
    __param(2, (0, graphql_1.Args)('username', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "updateProfile", null);
__decorate([
    (0, graphql_1.Query)(() => [user_type_1.User]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "listStudents", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_type_1.User),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('name')),
    __param(1, (0, graphql_1.Args)('email')),
    __param(2, (0, graphql_1.Args)('phone')),
    __param(3, (0, graphql_1.Args)('username')),
    __param(4, (0, graphql_1.Args)('password')),
    __param(5, (0, graphql_1.Args)('cohortId', { nullable: true })),
    __param(6, (0, graphql_1.Args)('sessionId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminCreateStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_type_1.User),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, graphql_1.Args)('name', { nullable: true })),
    __param(2, (0, graphql_1.Args)('email', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminUpdateStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminDeleteStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __param(2, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminEnrollStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __param(2, (0, graphql_1.Args)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminUpdateStudentMembership", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COORDINATOR', 'SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, graphql_1.Args)('cohortId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "adminRemoveStudentFromCohort", null);
__decorate([
    (0, graphql_1.Subscription)(() => Boolean),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "onStudentsUpdated", null);
__decorate([
    (0, graphql_1.ResolveField)('memberships', () => [cohort_type_1.CohortMembership], { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_type_1.User]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "memberships", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_type_1.User),
    __param(1, (0, common_1.Inject)('PUB_SUB')),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        graphql_subscriptions_1.PubSub])
], UsersResolver);
//# sourceMappingURL=users.resolver.js.map