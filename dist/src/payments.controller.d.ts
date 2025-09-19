import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { PayTechService } from './paytech.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly payTechService;
    constructor(paymentsService: PaymentsService, payTechService: PayTechService);
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
    initiatePayTechPayment(body: {
        amount: number;
        currency?: string;
        customerEmail?: string;
        customerName?: string;
        description: string;
        commandeId?: number;
    }): Promise<import("./paytech.service").PayTechPaymentResponse | {
        success: boolean;
        data: {
            paymentId: number;
            success: boolean;
            token?: string;
            redirectUrl?: string;
            reference?: string;
            message: string;
            transactionId?: string;
            developmentMode?: boolean;
        };
    }>;
    getPayTechProviders(): {
        success: boolean;
        data: {
            id: string;
            name: string;
            logo: string;
            description: string;
        }[];
    };
}
