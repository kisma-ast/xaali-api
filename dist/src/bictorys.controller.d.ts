import { BictorysService } from './bictorys.service';
export declare class BictorysController {
    private readonly bictorysService;
    private readonly logger;
    constructor(bictorysService: BictorysService);
    private getPaymentType;
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
            checkoutUrl: string;
            provider: string;
            phoneNumber: string;
            amount: number;
            status: string;
            reference: string;
            description: string;
            message: string;
            isSimulated: boolean;
            bictorysData?: undefined;
        };
        message?: undefined;
    } | {
        success: boolean;
        data: {
            transactionId: any;
            checkoutUrl: any;
            provider: string;
            phoneNumber: string;
            amount: number;
            status: string;
            reference: string;
            description: string;
            message: string;
            bictorysData: any;
            isSimulated?: undefined;
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
            status: any;
            message: any;
        };
    }>;
    validatePhoneNumber(body: {
        phoneNumber: string;
    }): Promise<{
        success: boolean;
        data: {
            isValid: boolean;
            provider: string;
            formattedNumber: string;
            originalNumber: string;
        };
        message: string;
    }>;
    handleCallback(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
