import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
export declare class LawyersService {
    private lawyersRepository;
    private readonly logger;
    constructor(lawyersRepository: MongoRepository<Lawyer>);
    findAll(): Promise<Lawyer[]>;
    findOne(id: string): Promise<Lawyer | null>;
    create(lawyer: Partial<Lawyer>): Promise<Lawyer>;
    findByEmail(email: string): Promise<Lawyer | null>;
    update(id: string, lawyer: Partial<Lawyer>): Promise<Lawyer | null>;
    remove(id: string): Promise<void>;
    findLawyerCases(lawyerId: string): Promise<Lawyer | null>;
    findLawyerWithDetails(lawyerId: string): Promise<{
        stats: {
            totalCases: number;
            pendingCases: number;
            completedCases: number;
            totalRevenue: number;
        };
        _id: import("typeorm").ObjectId;
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
    } | null>;
}
