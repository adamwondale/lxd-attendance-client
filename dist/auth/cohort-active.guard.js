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
exports.CohortActiveGuard = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const prisma_service_1 = require("../prisma/prisma.service");
let CohortActiveGuard = class CohortActiveGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const ctx = graphql_1.GqlExecutionContext.create(context);
        const args = ctx.getArgs();
        const cohortId = args.cohortId;
        if (!cohortId) {
            return true;
        }
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });
        if (!cohort) {
            throw new common_1.ForbiddenException('Cohort not found');
        }
        if (!cohort.isActive) {
            throw new common_1.ForbiddenException('COHORT_CYCLE_COMPLETED');
        }
        if (new Date() > cohort.endDate) {
            throw new common_1.ForbiddenException('COHORT_CYCLE_COMPLETED');
        }
        return true;
    }
};
exports.CohortActiveGuard = CohortActiveGuard;
exports.CohortActiveGuard = CohortActiveGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CohortActiveGuard);
//# sourceMappingURL=cohort-active.guard.js.map