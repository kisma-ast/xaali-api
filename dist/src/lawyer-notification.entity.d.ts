import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
export declare class LawyerNotification {
    id: number;
    lawyerId: number;
    caseId: number;
    type: string;
    isRead: boolean;
    isAccepted: boolean;
    createdAt: Date;
    lawyer: Lawyer;
    case: Case;
}
