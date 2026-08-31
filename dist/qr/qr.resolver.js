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
exports.QrResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const qr_service_1 = require("./qr.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let QrResolver = class QrResolver {
    qrService;
    constructor(qrService) {
        this.qrService = qrService;
    }
    myQrBadge(user) {
        return this.qrService.generateStudentQr(user.userId);
    }
    studentQrBadge(studentId) {
        return this.qrService.generateStudentQr(studentId);
    }
    generateCohortQr(cohortId) {
        return this.qrService.generateQr(cohortId);
    }
};
exports.QrResolver = QrResolver;
__decorate([
    (0, graphql_1.Query)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QrResolver.prototype, "myQrBadge", null);
__decorate([
    (0, graphql_1.Query)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, graphql_1.Args)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QrResolver.prototype, "studentQrBadge", null);
__decorate([
    (0, graphql_1.Query)(() => String),
    (0, common_1.UseGuards)(jwt_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, graphql_1.Args)('cohortId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QrResolver.prototype, "generateCohortQr", null);
exports.QrResolver = QrResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [qr_service_1.QrService])
], QrResolver);
//# sourceMappingURL=qr.resolver.js.map