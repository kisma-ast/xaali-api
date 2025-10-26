import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus } from './payment.interface';
import { PAYTECH_CONFIG } from '../config';
import * as crypto from 'crypto';

@Injectable()
export class PayTechProvider implements PaymentProvider {
  private readonly logger = new Logger(PayTechProvider.name);
  public readonly name = 'paytech';

  private readonly PAYTECH_API_KEY = PAYTECH_CONFIG.API_KEY;
  private readonly PAYTECH_SECRET_KEY = PAYTECH_CONFIG.SECRET_KEY;
  private readonly PAYTECH_BASE_URL = PAYTECH_CONFIG.BASE_URL;

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`[PayTech] Initiation paiement: ${request.reference}`);

      const paytechData = {
        item_name: 'Consultation Xaali',
        item_price: Math.round(request.amount),
        currency: 'XOF',
        ref_command: request.reference,
        command_name: 'Consultation Xaali',
        env: 'test',
        ipn_url: request.callbackUrl,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl
      };

      const headers = {
        'API_KEY': this.PAYTECH_API_KEY,
        'API_SECRET': this.PAYTECH_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      const formData = new URLSearchParams(paytechData as any);
      const response = await fetch(this.PAYTECH_BASE_URL, {
        method: 'POST',
        body: formData,
        headers: headers
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const paytechResponse = JSON.parse(responseText);
        
        if (paytechResponse.success === 1 || paytechResponse.success === true) {
          return {
            success: true,
            redirectUrl: paytechResponse.redirect_url,
            token: paytechResponse.token,
            reference: paytechResponse.ref,
            transactionId: request.reference,
            message: 'Paiement PayTech créé avec succès',
            provider: this.name
          };
        }
      }

      return {
        success: false,
        message: 'Erreur PayTech',
        transactionId: request.reference,
        provider: this.name
      };
    } catch (error) {
      this.logger.error(`[PayTech] Erreur: ${error.message}`);
      return {
        success: false,
        message: `Erreur PayTech: ${error.message}`,
        transactionId: request.reference,
        provider: this.name
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    return {
      transactionId,
      status: 'pending',
      amount: 0,
      currency: 'XOF',
      timestamp: new Date().toISOString(),
      message: 'Vérification PayTech non implémentée',
      provider: this.name
    };
  }

  async processCallback(callbackData: any): Promise<PaymentStatus> {
    const refCommand = callbackData.ref_command;
    const typeEvent = callbackData.type_event;
    
    let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
    
    switch (typeEvent) {
      case 'sale_complete':
        status = 'success';
        break;
      case 'sale_canceled':
        status = 'cancelled';
        break;
      case 'sale_failed':
        status = 'failed';
        break;
    }

    return {
      transactionId: refCommand,
      status,
      amount: callbackData.amount || 0,
      currency: callbackData.currency || 'XOF',
      customerEmail: callbackData.customer_email,
      customerName: callbackData.customer_name,
      timestamp: new Date().toISOString(),
      message: `PayTech status: ${status}`,
      provider: this.name
    };
  }

  generateReference(prefix: string = 'PAYTECH'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}