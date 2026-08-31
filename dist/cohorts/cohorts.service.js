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
exports.CohortsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CohortsService = class CohortsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async joinCohort(userId, pin) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { pin },
        });
        if (!cohort) {
            throw new common_1.NotFoundException('Cohort not found');
        }
        try {
            return await this.prisma.cohortMembership.create({
                data: {
                    cohortId: cohort.id,
                    userId,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                const existing = await this.prisma.cohortMembership.findUnique({
                    where: {
                        cohortId_userId: {
                            cohortId: cohort.id,
                            userId,
                        },
                    },
                });
                if (existing)
                    return existing;
            }
            throw error;
        }
    }
};
exports.CohortsService = CohortsService;
exports.CohortsService = CohortsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CohortsService);
//# sourceMappingURL=cohorts.service.js.map