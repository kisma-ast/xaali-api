export interface PaymentRequest {
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  description: string;
  reference: string;
  callbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  // Données pour créer le cas automatiquement
  caseData?: {
    title: string;
    description: string;
    category: string;
    citizenPhone: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  reference?: string;
  message: string;
  transactionId?: string;
  provider: string; // 'paytech', 'orange-money', 'wave', etc.
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  timestamp: string;
  message?: string;
  provider: string;
}

export interface PaymentProvider {
  name: string;
  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  checkPaymentStatus(transactionId: string): Promise<PaymentStatus>;
  processCallback(callbackData: any): Promise<PaymentStatus>;
  generateReference(prefix?: string): string;
}