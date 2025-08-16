import { Citizen } from './citizen.entity';
import { Lawyer } from './lawyer.entity';
export declare class Case {
    id: number;
    title: string;
    description: string;
    status: string;
    citizenId: string;
    lawyerId: number;
    isPaid: boolean;
    paymentAmount: number;
    paymentId: string;
    lawyerNotified: boolean;
    assignedLawyerId: number;
    createdAt: Date;
    citizen: Citizen;
    lawyer: Lawyer;
}
