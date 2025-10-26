import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus } from './payment.interface';

@Injectable()
export class OrangeMoneyProvider implements PaymentProvider {
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  public readonly name = 'orange-money';

  private readonly ORANGE_API_KEY = process.env.ORANGE_API_KEY;
  private readonly ORANGE_SECRET_KEY = process.env.ORANGE_SECRET_KEY;
  private readonly ORANGE_BASE_URL = 'https://api.orange.com/orange-money-webpay/dev/v1';

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`[Orange Money] Initiation paiement: ${request.reference}`);

      // Structure spécifique à Orange Money
      const orangeData = {
        merchant_key: this.ORANGE_API_KEY,
        currency: request.currency,
        order_id: request.reference,
        amount: request.amount,
        return_url: request.successUrl,
        cancel_url: request.cancelUrl,
        notif_url: request.callbackUrl,
        lang: 'fr',
        reference: request.description
      };

      const response = await fetch(`${this.ORANGE_BASE_URL}/webpayment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ORANGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orangeData)
      });

      const orangeResponse = await response.json();

      if (response.ok && orangeResponse.status === 'SUCCESS') {
        return {
          success: true,
          redirectUrl: orangeResponse.payment_url,
          token: orangeResponse.pay_token,
          reference: orangeResponse.txnid,
          transactionId: request.reference,
          message: 'Paiement Orange Money créé avec succès',
          provider: this.name
        };
      }

      return {
        success: false,
        message: orangeResponse.message || 'Erreur Orange Money',
        transactionId: request.reference,
        provider: this.name
      };
    } catch (error) {
      this.logger.error(`[Orange Money] Erreur: ${error.message}`);
      return {
        success: false,
        message: `Erreur Orange Money: ${error.message}`,
        transactionId: request.reference,
        provider: this.name
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.ORANGE_BASE_URL}/transactionstatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ORANGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: transactionId,
          amount: 0, // À récupérer depuis la base
          pay_token: '' // À récupérer depuis la base
        })
      });

      const statusResponse = await response.json();
      
      let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
      
      switch (statusResponse.status) {
        case 'SUCCESS':
          status = 'success';
          break;
        case 'FAILED':
          status = 'failed';
          break;
        case 'EXPIRED':
          status = 'cancelled';
          break;
      }

      return {
        transactionId,
        status,
        amount: statusResponse.amount || 0,
        currency: 'XOF',
        timestamp: new Date().toISOString(),
        message: `Orange Money status: ${status}`,
        provider: this.name
      };
    } catch (error) {
      return {
        transactionId,
        status: 'pending',
        amount: 0,
        currency: 'XOF',
        timestamp: new Date().toISOString(),
        message: `Erreur vérification Orange Money: ${error.message}`,
        provider: this.name
      };
    }
  }

  async processCallback(callbackData: any): Promise<PaymentStatus> {
    const orderId = callbackData.order_id;
    const status = callbackData.status;
    
    let paymentStatus: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
    
    switch (status) {
      case 'SUCCESS':
        paymentStatus = 'success';
        break;
      case 'FAILED':
        paymentStatus = 'failed';
        break;
      case 'EXPIRED':
        paymentStatus = 'cancelled';
        break;
    }

    return {
      transactionId: orderId,
      status: paymentStatus,
      amount: callbackData.amount || 0,
      currency: callbackData.currency || 'XOF',
      timestamp: new Date().toISOString(),
      message: `Orange Money callback: ${paymentStatus}`,
      provider: this.name
    };
  }

  generateReference(prefix: string = 'ORANGE'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}