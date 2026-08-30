export declare class QrService {
    private readonly secret;
    generateQr(cohortId: string): string;
    verifyQr(code: string, cohortId: string): boolean;
    generateStudentQr(studentId: string): string;
    verifyStudentQr(code: string): string;
}
