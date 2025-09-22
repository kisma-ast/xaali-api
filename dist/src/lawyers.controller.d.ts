import { LawyersService } from './lawyers.service';
import { Lawyer } from './lawyer.entity';
export declare class LawyersController {
    private readonly lawyersService;
    private readonly logger;
    constructor(lawyersService: LawyersService);
    findAll(): Promise<Lawyer[]>;
    findOne(id: string): Promise<Lawyer | null>;
    findLawyerCases(id: string): Promise<Lawyer | null>;
    findLawyerWithDetails(id: string): Promise<{
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
        cases: import("./case.entity").Case[];
    } | null>;
    create(lawyer: Partial<Lawyer>): Promise<Lawyer>;
    update(id: string, lawyer: Partial<Lawyer>): Promise<Lawyer | null>;
    remove(id: string): Promise<void>;
}
