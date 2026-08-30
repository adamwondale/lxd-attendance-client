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
exports.AuthResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const auth_service_1 = require("./auth.service");
const auth_response_dto_1 = require("./dto/auth-response.dto");
let AuthResolver = class AuthResolver {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async registerAdmin(email, passwordRaw, name, tenantName, companyPhone, username, companyEmail) {
        const user = await this.authService.registerAdmin(email, passwordRaw, name, tenantName, companyPhone, username, companyEmail);
        return user.id;
    }
    async loginAdmin(email, passwordRaw) {
        return this.authService.loginAdmin(email, passwordRaw);
    }
    async loginWithGoogle(idToken) {
        return this.authService.loginWithGoogle(idToken);
    }
    async registerStudent(email, passwordRaw, name, phone, username, cohortId, sessionId, cohortPin) {
        const user = await this.authService.registerStudent(email, passwordRaw, name, phone, username, cohortId, sessionId, cohortPin);
        return user.id;
    }
    async loginStudent(identifier, passwordRaw) {
        return this.authService.loginStudent(identifier, passwordRaw);
    }
};
exports.AuthResolver = AuthResolver;
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __param(2, (0, graphql_1.Args)('name')),
    __param(3, (0, graphql_1.Args)('tenantName')),
    __param(4, (0, graphql_1.Args)('companyPhone', { nullable: true })),
    __param(5, (0, graphql_1.Args)('username', { nullable: true })),
    __param(6, (0, graphql_1.Args)('companyEmail', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "registerAdmin", null);
__decorate([
    (0, graphql_1.Mutation)(() => auth_response_dto_1.AuthResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "loginAdmin", null);
__decorate([
    (0, graphql_1.Mutation)(() => auth_response_dto_1.AuthResponse),
    __param(0, (0, graphql_1.Args)('idToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "loginWithGoogle", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __param(2, (0, graphql_1.Args)('name')),
    __param(3, (0, graphql_1.Args)('phone')),
    __param(4, (0, graphql_1.Args)('username')),
    __param(5, (0, graphql_1.Args)('cohortId', { nullable: true })),
    __param(6, (0, graphql_1.Args)('sessionId', { nullable: true })),
    __param(7, (0, graphql_1.Args)('cohortPin', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "registerStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => auth_response_dto_1.AuthResponse),
    __param(0, (0, graphql_1.Args)('identifier')),
    __param(1, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "loginStudent", null);
exports.AuthResolver = AuthResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthResolver);
//# sourceMappingURL=auth.resolver.js.map