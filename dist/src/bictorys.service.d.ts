export interface BictorysPaymentRequest {
    amount: number;
    currency: string;
    phoneNumber: string;
    provider: string;
    description: string;
    reference: string;
    callbackUrl?: string;
}
export interface BictorysPaymentResponse {
    success: boolean;
    transactionId?: string;
    status: string;
    message: string;
    paymentUrl?: string;
    qrCode?: string;
}
export interface BictorysPaymentStatus {
    transactionId: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    phoneNumber: string;
    provider: string;
    timestamp: string;
    message?: string;
}
export declare class BictorysService {
    private readonly logger;
    private readonly config;
    constructor();
    initiatePayment(paymentRequest: BictorysPaymentRequest): Promise<BictorysPaymentResponse>;
    checkPaymentStatus(transactionId: string): Promise<BictorysPaymentStatus>;
    processCallback(callbackData: any): Promise<BictorysPaymentStatus>;
    cancelPayment(transactionId: string): Promise<boolean>;
    private mapBictorysStatus;
    private verifyCallbackSignature;
    generateReference(prefix?: string): string;
    detectProvider(phoneNumber: string): string | null;
    validatePhoneNumber(phoneNumber: string): {
        isValid: boolean;
        provider: string | null;
        formattedNumber: string;
    };
}
