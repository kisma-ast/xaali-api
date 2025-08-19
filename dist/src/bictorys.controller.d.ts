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
        data: import("./bictorys.service").BictorysPaymentStatus;
        message: string;
    }>;
    handleCallback(callbackData: any): Promise<{
        success: boolean;
        message: string;
    }>;
    cancelPayment(transactionId: string): Promise<{
        success: boolean;
        message: string;
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
    debug(): Promise<{
        success: boolean;
        test: {
            isValid: boolean;
            provider: string | null;
            formattedNumber: string;
        };
        message: string;
    }>;
    testValidation(body: {
        phoneNumber: string;
    }): Promise<{
        success: boolean;
        input: string;
        validation: {
            isValid: boolean;
            provider: string | null;
            formattedNumber: string;
        };
        message: string;
    }>;
    private getProviderName;
}
