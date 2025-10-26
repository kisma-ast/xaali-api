import { ObjectId } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
export declare class LawyerNotification {
    _id: ObjectId;
    get id(): string;
    lawyerId: string;
    caseId: string;
    type: string;
    isRead: boolean;
    isAccepted: boolean;
    createdAt: Date;
    lawyer: Lawyer;
    case: Case;
}
