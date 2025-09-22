export declare class Payment {
    id: number;
    amount: number;
    currency: string;
    userId: number;
    caseId: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    transactionId: string;
    reference: string;
    phoneNumber: string;
    provider: string;
    description: string;
    paymentUrl: string;
    qrCode: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    metadata: any;
    paytechToken?: string;
    paytechReference?: string;
    paymentMethod: 'bictorys' | 'paytech';
    citizenId?: string;
}
