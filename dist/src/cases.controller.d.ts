import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { LawyerNotification } from './lawyer-notification.entity';
export declare class CasesController {
    private readonly casesService;
    constructor(casesService: CasesService);
    findAll(): Promise<Case[]>;
    getPendingCases(): Promise<Case[]>;
    findOne(id: string): Promise<Case | null>;
    create(caseData: Partial<Case>): Promise<Case>;
    update(id: string, caseData: Partial<Case>): Promise<Case | null>;
    remove(id: string): Promise<void>;
    getCasesByLawyer(lawyerId: string): Promise<Case[]>;
    getLawyerNotifications(lawyerId: string): Promise<LawyerNotification[]>;
    markNotificationAsRead(notificationId: string): Promise<void>;
    acceptCase(notificationId: string, body: {
        lawyerId: number;
    }): Promise<Case>;
}
