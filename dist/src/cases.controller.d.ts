import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { EmailService } from './email.service';
export declare class CasesController {
    private readonly casesService;
    private readonly emailService;
    constructor(casesService: CasesService, emailService: EmailService);
    findAll(): Promise<Case[]>;
    getPendingCases(): Promise<Case[]>;
    testCases(): Promise<{
        total: number;
        cases: Case[];
        error?: undefined;
    } | {
        error: any;
        total?: undefined;
        cases?: undefined;
    }>;
    findOne(id: string): Promise<Case | null>;
    create(caseData: Partial<Case>): Promise<Case>;
    update(id: string, caseData: Partial<Case>): Promise<Case | null>;
    remove(id: string): Promise<void>;
    getCasesByLawyer(lawyerId: string): Promise<Case[]>;
    acceptCase(id: string, body: {
        lawyerId: string;
    }): Promise<{
        success: boolean;
        case: Case;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        case?: undefined;
    }>;
    createCaseBeforePayment(body: {
        citizenId?: string;
        citizenName?: string;
        citizenPhone?: string;
        citizenEmail?: string;
        question: string;
        aiResponse?: string;
        category: string;
        urgency?: string;
        estimatedTime?: number;
    }): Promise<{
        success: boolean;
        case: Case;
        caseId: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        case?: undefined;
        caseId?: undefined;
    }>;
    updateCasePayment(id: string, body: {
        paymentId: string;
        paymentAmount: number;
        isPaid: boolean;
    }): Promise<{
        success: boolean;
        case: Case | null;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        case?: undefined;
    }>;
    saveClientInfo(clientData: {
        customerPhone: string;
        customerEmail?: string;
        customerName: string;
        question: string;
        aiResponse: string;
        category: string;
        amount: number;
    }): Promise<{
        success: boolean;
        clientId: string;
        message: string;
    } | {
        success: boolean;
        message: string;
        clientId?: undefined;
    }>;
    private generateCaseTitle;
}
