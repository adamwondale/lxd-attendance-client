"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let QrService = class QrService {
    secret = process.env.SECRET || 'QtNDNr4Ii0x1Zaqw8geuV1ZE1wxhSqOSMCH9URZIXwS';
    generateQr(cohortId) {
        const timestamp = Date.now();
        const data = `${cohortId}.${timestamp}`;
        const signature = crypto
            .createHmac('sha256', this.secret)
            .update(data)
            .digest('hex');
        return `${data}.${signature}`;
    }
    verifyQr(code, cohortId) {
        const parts = code.split('.');
        if (parts.length !== 3) {
            throw new common_1.BadRequestException('Invalid QR code format');
        }
        const [extractedCohortId, timestampStr, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);
        if (extractedCohortId !== cohortId) {
            throw new common_1.BadRequestException('Cohort ID mismatch');
        }
        const data = `${extractedCohortId}.${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', this.secret)
            .update(data)
            .digest('hex');
        if (signature !== expectedSignature) {
            throw new common_1.BadRequestException('Invalid QR signature');
        }
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 0 || diff > 15000) {
            throw new common_1.BadRequestException('QR code expired');
        }
        return true;
    }
    generateStudentQr(studentId) {
        const signature = crypto
            .createHmac('sha256', this.secret)
            .update(studentId)
            .digest('hex');
        return `${studentId}.${signature}`;
    }
    verifyStudentQr(code) {
        const parts = code.split('.');
        if (parts.length !== 2) {
            throw new common_1.BadRequestException('Invalid Student Badge format');
        }
        const [studentId, signature] = parts;
        const expectedSignature = crypto
            .createHmac('sha256', this.secret)
            .update(studentId)
            .digest('hex');
        if (signature !== expectedSignature) {
            throw new common_1.BadRequestException('Invalid Student Badge signature');
        }
        return studentId;
    }
};
exports.QrService = QrService;
exports.QrService = QrService = __decorate([
    (0, common_1.Injectable)()
], QrService);
//# sourceMappingURL=qr.service.js.map