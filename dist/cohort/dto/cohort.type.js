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
exports.Cohort = exports.CohortSession = exports.CohortMembership = void 0;
const graphql_1 = require("@nestjs/graphql");
let CohortMembership = class CohortMembership {
    id;
    userId;
    cohortId;
    sessionId;
    status;
    cohort;
    session;
};
exports.CohortMembership = CohortMembership;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], CohortMembership.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortMembership.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortMembership.prototype, "cohortId", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], CohortMembership.prototype, "sessionId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortMembership.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => Cohort, { nullable: true }),
    __metadata("design:type", Object)
], CohortMembership.prototype, "cohort", void 0);
__decorate([
    (0, graphql_1.Field)(() => CohortSession, { nullable: true }),
    __metadata("design:type", Object)
], CohortMembership.prototype, "session", void 0);
exports.CohortMembership = CohortMembership = __decorate([
    (0, graphql_1.ObjectType)()
], CohortMembership);
let CohortSession = class CohortSession {
    id;
    cohortId;
    name;
    startTime;
    gracePeriodMinutes;
    recurrenceDays;
    latePenaltyAmount;
    escalationThresholdMinutes;
    escalationRate;
    escalationIntervalMinutes;
};
exports.CohortSession = CohortSession;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], CohortSession.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortSession.prototype, "cohortId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortSession.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CohortSession.prototype, "startTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], CohortSession.prototype, "gracePeriodMinutes", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], CohortSession.prototype, "recurrenceDays", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], CohortSession.prototype, "latePenaltyAmount", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], CohortSession.prototype, "escalationThresholdMinutes", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], CohortSession.prototype, "escalationRate", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], CohortSession.prototype, "escalationIntervalMinutes", void 0);
exports.CohortSession = CohortSession = __decorate([
    (0, graphql_1.ObjectType)()
], CohortSession);
let Cohort = class Cohort {
    id;
    tenantId;
    name;
    startDate;
    pin;
    endDate;
    isActive;
    durationMonths;
    sessions;
    joinedSession;
};
exports.Cohort = Cohort;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Cohort.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Cohort.prototype, "tenantId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Cohort.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Cohort.prototype, "startDate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Cohort.prototype, "pin", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], Cohort.prototype, "endDate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], Cohort.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], Cohort.prototype, "durationMonths", void 0);
__decorate([
    (0, graphql_1.Field)(() => [CohortSession], { nullable: true }),
    __metadata("design:type", Array)
], Cohort.prototype, "sessions", void 0);
__decorate([
    (0, graphql_1.Field)(() => CohortSession, { nullable: true }),
    __metadata("design:type", CohortSession)
], Cohort.prototype, "joinedSession", void 0);
exports.Cohort = Cohort = __decorate([
    (0, graphql_1.ObjectType)()
], Cohort);
//# sourceMappingURL=cohort.type.js.map