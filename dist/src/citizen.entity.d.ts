import { Case } from './case.entity';
export declare class Citizen {
    id: string;
    name: string;
    email: string;
    questionsAsked: number;
    hasPaid: boolean;
    paymentId: string;
    createdAt: Date;
    cases: Case[];
}
