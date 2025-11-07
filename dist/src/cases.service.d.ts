import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
export declare class CasesService {
    private casesRepository;
    private lawyersRepository;
    constructor(casesRepository: Repository<Case>, lawyersRepository: Repository<Lawyer>);
    findAll(): Promise<Case[]>;
    findOne(id: string): Promise<Case | null>;
    create(caseData: Partial<Case>): Promise<Case>;
    update(id: string, caseData: Partial<Case>): Promise<Case | null>;
    remove(id: string): Promise<void>;
    getPendingCases(): Promise<Case[]>;
    getCasesByLawyer(lawyerId: string): Promise<Case[]>;
    assignLawyer(caseId: string, lawyerId: string): Promise<Case>;
    createBeforePayment(caseData: Partial<Case>): Promise<Case>;
    updatePaymentStatus(caseId: string, paymentData: {
        paymentId: string;
        paymentAmount: number;
        isPaid: boolean;
    }): Promise<Case | null>;
    private notifyAllLawyers;
    findByTrackingCode(trackingCode: string): Promise<Case | null>;
}
