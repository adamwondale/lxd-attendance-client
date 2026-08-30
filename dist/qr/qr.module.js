"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrModule = void 0;
const common_1 = require("@nestjs/common");
const qr_resolver_1 = require("./qr.resolver");
const qr_service_1 = require("./qr.service");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
let QrModule = class QrModule {
};
exports.QrModule = QrModule;
exports.QrModule = QrModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        providers: [qr_resolver_1.QrResolver, qr_service_1.QrService],
        exports: [qr_service_1.QrService],
    })
], QrModule);
//# sourceMappingURL=qr.module.js.map