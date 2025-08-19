import { BictorysService } from './bictorys.service';
export declare class BictorysController {
    private readonly bictorysService;
    private readonly logger;
    constructor(bictorysService: BictorysService);
    initiatePayment(body: {
        amount: number;
        phoneNumber: string;
        provider: string;
        description?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            transactionId: string;
            provider: string;
            phoneNumber: string;
            amount: number;
            status: string;
            reference: string;
            message: string;
        };
        message?: undefined;
    }>;
    getProviders(): {
        success: boolean;
        data: {
            id: string;
            name: string;
            prefixes: string[];
            logo: string;
            description: string;
        }[];
    };
    checkPaymentStatus(transactionId: string): Promise<{
        success: boolean;
        data: {
            transactionId: string;
            status: string;
            message: string;
        };
    }>;
    validatePhoneNumber(body: {
        phoneNumber: string;
    }): Promise<{
        success: boolean;
        data: {
            isValid: boolean;
            provider: string | null;
            formattedNumber: string;
            originalNumber: string;
        };
        message: string;
    }>;
}
