import { BictorysService, BictorysPaymentRequest } from './bictorys.service';
export declare class BictorysController {
    private readonly bictorysService;
    private readonly logger;
    constructor(bictorysService: BictorysService);
    initiatePayment(paymentRequest: BictorysPaymentRequest): Promise<{
        success: boolean;
        data: {
            transactionId: string | undefined;
            paymentUrl: string | undefined;
            qrCode: string | undefined;
            reference: string;
            status: string;
        };
        message: string;
    }>;
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
    getProviders(): Promise<{
        success: boolean;
        data: {
            providers: {
                id: string;
                name: string;
                logo: string;
                description: string;
            }[];
        };
        message: string;
    }>;
    validatePhoneNumber(body: {
        phoneNumber: string;
        provider: string;
    }): Promise<{
        success: boolean;
        data: {
            isValid: boolean;
            phoneNumber: string;
            provider: string;
        };
        message: string;
    }>;
}
