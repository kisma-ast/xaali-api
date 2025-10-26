import { ObjectId } from 'typeorm';
import { Case } from './case.entity';
export declare class Citizen {
    _id: ObjectId;
    get id(): string;
    name: string;
    email: string;
    password: string;
    phone: string;
    questionsAsked: number;
    hasPaid: boolean;
    paymentId: string;
    isActive: boolean;
    createdAt: Date;
    cases: Case[];
}
