import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { LawyerNotification } from './lawyer-notification.entity';
export declare class CasesService {
    private casesRepository;
    private lawyersRepository;
    private notificationsRepository;
    constructor(casesRepository: Repository<Case>, lawyersRepository: Repository<Lawyer>, notificationsRepository: Repository<LawyerNotification>);
    findAll(): Promise<Case[]>;
    findOne(id: number): Promise<Case | null>;
    create(caseData: Partial<Case>): Promise<Case>;
    update(id: number, caseData: Partial<Case>): Promise<Case | null>;
    remove(id: number): Promise<void>;
    getPendingCases(): Promise<Case[]>;
    getCasesByLawyer(lawyerId: number): Promise<Case[]>;
    assignLawyer(caseId: number, lawyerId: number): Promise<Case>;
    private notifyAllLawyers;
    getLawyerNotifications(lawyerId: number): Promise<LawyerNotification[]>;
    markNotificationAsRead(notificationId: number): Promise<void>;
    acceptCase(notificationId: number, lawyerId: number): Promise<Case>;
}
