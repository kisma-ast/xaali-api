import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(): Promise<Payment[]>;
    findOne(id: string): Promise<Payment | null>;
    create(payment: Partial<Payment>): Promise<Payment>;
    update(id: string, payment: Partial<Payment>): Promise<Payment | null>;
    remove(id: string): Promise<void>;
    initiateBictorysPayment(body: {
        amount: number;
        phoneNumber: string;
        provider: string;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            transactionId: string;
            phoneNumber: string;
            provider: string;
            amount: number;
            status: string;
            reference: string;
            message: string;
        };
        message?: undefined;
    }>;
    getBictorysProviders(): {
        success: boolean;
        data: {
            id: string;
            name: string;
            prefixes: string[];
            logo: string;
            description: string;
        }[];
    };
}
