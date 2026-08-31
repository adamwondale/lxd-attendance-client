import { QrService } from './qr.service';
export declare class QrResolver {
    private readonly qrService;
    constructor(qrService: QrService);
    myQrBadge(user: any): string;
    studentQrBadge(studentId: string): string;
    generateCohortQr(cohortId: string): string;
}
