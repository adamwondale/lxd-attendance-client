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
exports.StudentAttendanceSummary = exports.AttendanceReportRow = exports.AttendanceEvent = exports.AttendanceLog = exports.Penalty = exports.UserReference = void 0;
const graphql_1 = require("@nestjs/graphql");
let UserReference = class UserReference {
    id;
    name;
    email;
};
exports.UserReference = UserReference;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], UserReference.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UserReference.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserReference.prototype, "email", void 0);
exports.UserReference = UserReference = __decorate([
    (0, graphql_1.ObjectType)()
], UserReference);
let Penalty = class Penalty {
    id;
    amount;
    status;
};
exports.Penalty = Penalty;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Penalty.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], Penalty.prototype, "amount", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Penalty.prototype, "status", void 0);
exports.Penalty = Penalty = __decorate([
    (0, graphql_1.ObjectType)()
], Penalty);
let AttendanceLog = class AttendanceLog {
    id;
    date;
    scannedAt;
    isLate;
    latenessMinutes;
    calculatedPenalty;
    isManualScan;
    user;
    penalty;
};
exports.AttendanceLog = AttendanceLog;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AttendanceLog.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceLog.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], AttendanceLog.prototype, "scannedAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AttendanceLog.prototype, "isLate", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceLog.prototype, "latenessMinutes", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceLog.prototype, "calculatedPenalty", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AttendanceLog.prototype, "isManualScan", void 0);
__decorate([
    (0, graphql_1.Field)(() => UserReference),
    __metadata("design:type", UserReference)
], AttendanceLog.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(() => Penalty, { nullable: true }),
    __metadata("design:type", Penalty)
], AttendanceLog.prototype, "penalty", void 0);
exports.AttendanceLog = AttendanceLog = __decorate([
    (0, graphql_1.ObjectType)()
], AttendanceLog);
let AttendanceEvent = class AttendanceEvent {
    id;
    cohortId;
    sessionId;
    date;
    scannedAt;
    user;
    isLate;
    latenessMinutes;
    calculatedPenalty;
};
exports.AttendanceEvent = AttendanceEvent;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "cohortId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "sessionId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "scannedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => UserReference),
    __metadata("design:type", UserReference)
], AttendanceEvent.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AttendanceEvent.prototype, "isLate", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceEvent.prototype, "latenessMinutes", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceEvent.prototype, "calculatedPenalty", void 0);
exports.AttendanceEvent = AttendanceEvent = __decorate([
    (0, graphql_1.ObjectType)()
], AttendanceEvent);
let AttendanceReportRow = class AttendanceReportRow {
    id;
    date;
    status;
    traineeId;
    traineeName;
    sessionName;
    cohortName;
    latenessMinutes;
    penalty;
};
exports.AttendanceReportRow = AttendanceReportRow;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "date", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "traineeId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "traineeName", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "sessionName", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AttendanceReportRow.prototype, "cohortName", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceReportRow.prototype, "latenessMinutes", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttendanceReportRow.prototype, "penalty", void 0);
exports.AttendanceReportRow = AttendanceReportRow = __decorate([
    (0, graphql_1.ObjectType)()
], AttendanceReportRow);
let StudentAttendanceSummary = class StudentAttendanceSummary {
    presentDays;
    lateDays;
    totalPenalty;
    lateLogs;
};
exports.StudentAttendanceSummary = StudentAttendanceSummary;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StudentAttendanceSummary.prototype, "presentDays", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StudentAttendanceSummary.prototype, "lateDays", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StudentAttendanceSummary.prototype, "totalPenalty", void 0);
__decorate([
    (0, graphql_1.Field)(() => [AttendanceLog]),
    __metadata("design:type", Array)
], StudentAttendanceSummary.prototype, "lateLogs", void 0);
exports.StudentAttendanceSummary = StudentAttendanceSummary = __decorate([
    (0, graphql_1.ObjectType)()
], StudentAttendanceSummary);
//# sourceMappingURL=attendance.type.js.map