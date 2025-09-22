import { ObjectId } from 'typeorm';
import { Case } from './case.entity';
export declare class Lawyer {
    _id: ObjectId;
    get id(): string;
    name: string;
    email: string;
    password: string;
    specialty: string;
    phone: string;
    experience: string;
    lawFirm: string;
    barNumber: string;
    description: string;
    mobileMoneyAccount: string;
    pricing: any;
    paymentMethod: string;
    paymentAmount: string;
    cases: Case[];
}
