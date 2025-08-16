import { Case } from './case.entity';
export declare class Lawyer {
    id: number;
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
