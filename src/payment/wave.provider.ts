import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus } from './payment.interface';

@Injectable()
export class WaveProvider implements PaymentProvider {
  private readonly logger = new Logger(WaveProvider.name);
  public readonly name = 'wave';

  private readonly WAVE_API_KEY = process.env.WAVE_API_KEY;
  private readonly WAVE_SECRET_KEY = process.env.WAVE_SECRET_KEY;
  private readonly WAVE_BASE_URL = 'https://api.wave.com/v1';

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`[Wave] Initiation paiement: ${request.reference}`);

      // Structure spécifique à Wave
      const waveData = {
        amount: request.amount,
        currency: request.currency,
        error_url: request.cancelUrl,
        success_url: request.successUrl,
        webhook_url: request.callbackUrl,
        checkout_intent: {
          id: request.reference,
          client_reference: request.reference,
          amount: request.amount,
          currency: request.currency,
          error_url: request.cancelUrl,
          success_url: request.successUrl
        }
      };

      const response = await fetch(`${this.WAVE_BASE_URL}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.WAVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waveData)
      });

      const waveResponse = await response.json();

      if (response.ok && waveResponse.id) {
        return {
          success: true,
          redirectUrl: waveResponse.wave_launch_url,
          token: waveResponse.id,
          reference: waveResponse.client_reference,
          transactionId: request.reference,
          message: 'Paiement Wave créé avec succès',
          provider: this.name
        };
      }

      return {
        success: false,
        message: waveResponse.message || 'Erreur Wave',
        transactionId: request.reference,
        provider: this.name
      };
    } catch (error) {
      this.logger.error(`[Wave] Erreur: ${error.message}`);
      return {
        success: false,
        message: `Erreur Wave: ${error.message}`,
        transactionId: request.reference,
        provider: this.name
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.WAVE_BASE_URL}/checkout/sessions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.WAVE_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const statusResponse = await response.json();
      
      let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
      
      switch (statusResponse.status) {
        case 'complete':
          status = 'success';
          break;
        case 'cancelled':
          status = 'cancelled';
          break;
        case 'expired':
          status = 'failed';
          break;
      }

      return {
        transactionId,
        status,
        amount: statusResponse.checkout_intent?.amount || 0,
        currency: statusResponse.checkout_intent?.currency || 'XOF',
        timestamp: new Date().toISOString(),
        message: `Wave status: ${status}`,
        provider: this.name
      };
    } catch (error) {
      return {
        transactionId,
        status: 'pending',
        amount: 0,
        currency: 'XOF',
        timestamp: new Date().toISOString(),
        message: `Erreur vérification Wave: ${error.message}`,
        provider: this.name
      };
    }
  }

  async processCallback(callbackData: any): Promise<PaymentStatus> {
    const sessionId = callbackData.id;
    const status = callbackData.status;
    
    let paymentStatus: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
    
    switch (status) {
      case 'complete':
        paymentStatus = 'success';
        break;
      case 'cancelled':
        paymentStatus = 'cancelled';
        break;
      case 'expired':
        paymentStatus = 'failed';
        break;
    }

    return {
      transactionId: callbackData.checkout_intent?.client_reference || sessionId,
      status: paymentStatus,
      amount: callbackData.checkout_intent?.amount || 0,
      currency: callbackData.checkout_intent?.currency || 'XOF',
      timestamp: new Date().toISOString(),
      message: `Wave callback: ${paymentStatus}`,
      provider: this.name
    };
  }

  generateReference(prefix: string = 'WAVE'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}