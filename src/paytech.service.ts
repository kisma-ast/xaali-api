import { Injectable, Logger } from '@nestjs/common';
import { BICTORYS_CONFIG, PAYTECH_CONFIG } from './config';
import * as crypto from 'crypto';

export interface PayTechPaymentRequest {
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  description: string;
  reference: string;
  callbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  commandeId?: number;
}

export interface PayTechPaymentResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  reference?: string;
  message: string;
  transactionId?: string;
  developmentMode?: boolean;
}

export interface PayTechPaymentStatus {
  transactionId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  timestamp: string;
  message?: string;
}

@Injectable()
export class PayTechService {
  private readonly logger = new Logger(PayTechService.name);
  
  // PayTech Configuration (Official API)
  private readonly PAYTECH_API_KEY = PAYTECH_CONFIG.API_KEY;
  private readonly PAYTECH_SECRET_KEY = PAYTECH_CONFIG.SECRET_KEY;
  private readonly PAYTECH_BASE_URL = PAYTECH_CONFIG.BASE_URL;
  
  // Development mode flag
  private readonly DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production' || process.env.PAYTECH_MOCK_MODE === 'true';
  
  // PayTech URLs - Dynamic based on mode
  private readonly PAYTECH_CALLBACK_URL: string;
  private readonly PAYTECH_SUCCESS_URL: string;
  private readonly PAYTECH_CANCEL_URL: string;

  constructor() {
    // Set URLs based on environment - Always use environment variables
    const backendUrl = process.env.BACKEND_URL || 'https://xaali-api.onrender.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://xaali.onrender.com';
    
    // Auto-detect Cloudoor URLs if needed
    const detectedFrontendUrl = process.env.FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://xaali-q6q6bc.live.cloudoor.com' : frontendUrl);
    
    this.PAYTECH_CALLBACK_URL = `${backendUrl}/api/paytech/callback`;
    this.PAYTECH_SUCCESS_URL = `${detectedFrontendUrl}/payment/success`;
    this.PAYTECH_CANCEL_URL = `${detectedFrontendUrl}/payment/cancel`;
    
    this.logger.log(`Configuration PayTech (${process.env.NODE_ENV || 'development'}):`);
    this.logger.log(`  - API Key: ${this.PAYTECH_API_KEY.substring(0, 10)}...`);
    this.logger.log(`  - Callback URL: ${this.PAYTECH_CALLBACK_URL}`);
    this.logger.log(`  - Success URL: ${this.PAYTECH_SUCCESS_URL}`);
    this.logger.log(`  - Cancel URL: ${this.PAYTECH_CANCEL_URL}`);
    
    // Vérifier que les URLs sont valides
    if (this.PAYTECH_SUCCESS_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.logger.warn('⚠️ URLs localhost détectées en production - Vérifiez FRONTEND_URL');
    }
  }

  /**
   * Initie un paiement PayTech
   */
  async initiatePayment(paymentRequest: PayTechPaymentRequest): Promise<PayTechPaymentResponse> {
    try {
      this.logger.log(`Initiating PayTech payment: ${paymentRequest.reference} - ${paymentRequest.amount} ${paymentRequest.currency}`);

      // REAL PAYTECH API CALL
      this.logger.log("[PayTech] Making real API call to PayTech");

      // PayTech official API request structure selon la documentation
      const paytechData = {
        item_name: paymentRequest.description,
        item_price: Math.round(paymentRequest.amount),
        currency: 'XOF',
        ref_command: paymentRequest.reference,
        command_name: paymentRequest.description,
        env: 'test', // Mode sandbox obligatoire
        ipn_url: this.PAYTECH_CALLBACK_URL,
        success_url: this.PAYTECH_SUCCESS_URL, 
        cancel_url: this.PAYTECH_CANCEL_URL
      };

      this.logger.log(`[PayTech] Sending data to PayTech: ${JSON.stringify(paytechData)}`);

      // Official PayTech headers structure
      const headers = {
        'API_KEY': this.PAYTECH_API_KEY,
        'API_SECRET': this.PAYTECH_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // Make request to official PayTech API
      const response = await fetch(this.PAYTECH_BASE_URL, {
        method: 'POST',
        // @ts-ignore
        body: new URLSearchParams(paytechData),
        headers: headers
      });

      this.logger.log(`[PayTech] Response status: ${response.status}`);

      if (response.ok) {
        const paytechResponse = await response.json();
        this.logger.log(`[PayTech] Parsed response: ${JSON.stringify(paytechResponse)}`);

        // Check success based on official documentation
        if (paytechResponse.success === 1 || paytechResponse.success === true) {
          return {
            success: true,
            redirectUrl: paytechResponse.redirect_url,
            token: paytechResponse.token,
            reference: paytechResponse.ref,
            transactionId: paymentRequest.reference,
            message: 'Paiement PayTech créé avec succès'
          };
        } else {
          const errorMsg = paytechResponse.message || 'Erreur PayTech inconnue';
          this.logger.error(`[PayTech] Payment failed: ${errorMsg}`);
          return {
            success: false,
            message: errorMsg,
            transactionId: paymentRequest.reference
          };
        }
      } else {
        const errorText = await response.text();
        this.logger.error(`[PayTech] HTTP Error: ${response.status} - ${errorText}`);
        
        return {
          success: false,
          message: `Erreur de connexion PayTech: ${response.status}`,
          transactionId: paymentRequest.reference
        };
      }
    } catch (error) {
      this.logger.error(`[PayTech] Exception: ${error.message}`);
      return {
        success: false,
        message: `Erreur serveur: ${error.message}`,
        transactionId: paymentRequest.reference
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async checkPaymentStatus(transactionId: string): Promise<PayTechPaymentStatus> {
    try {
      this.logger.log(`Checking PayTech payment status: ${transactionId}`);

      // In a real implementation, you would call PayTech's verify API
      // For now, return a default status
      return {
        transactionId,
        status: 'pending',
        amount: 0,
        currency: 'XOF',
        timestamp: new Date().toISOString(),
        message: 'Statut de paiement non implémenté'
      };
    } catch (error) {
      this.logger.error(`Error checking PayTech payment status for ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Traite le callback de PayTech
   */
  async processCallback(callbackData: any): Promise<PayTechPaymentStatus> {
    try {
      this.logger.log(`Processing PayTech callback: ${JSON.stringify(callbackData)}`);

      // Verify webhook signature for security (bypassed in development mode)
      if (!this.verifyPayTechWebhook(callbackData, callbackData.signature)) {
        this.logger.warn("[PayTech] Webhook signature verification failed");
        throw new Error('Invalid signature');
      }

      // Extract data from callback
      const refCommand = callbackData.ref_command;
      const typeEvent = callbackData.type_event;
      
      this.logger.log(`[PayTech] Processing event ${typeEvent} for reference: ${refCommand}`);

      // Map PayTech event types to our status
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
        default:
          status = 'pending';
      }

      return {
        transactionId: refCommand,
        status,
        amount: callbackData.amount || 0,
        currency: callbackData.currency || 'XOF',
        customerEmail: callbackData.customer_email,
        customerName: callbackData.customer_name,
        timestamp: new Date().toISOString(),
        message: `Payment status updated to ${status}`
      };
    } catch (error) {
      this.logger.error('[PayTech] Error processing callback:', error);
      throw error;
    }
  }

  /**
   * Génère une référence unique pour les paiements
   */
  generateReference(prefix: string = 'XAALI_PAYTECH'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Vérifie la signature du webhook PayTech pour la sécurité
   */
  private verifyPayTechWebhook(data: any, receivedSignature?: string): boolean {
    // In development mode, bypass verification
    if (this.DEVELOPMENT_MODE) {
      this.logger.log("[PayTech] Development mode - bypassing webhook signature verification");
      return true;
    }

    if (!receivedSignature) {
      this.logger.warn("[PayTech] No signature provided in webhook");
      return false;
    }

    try {
      // Create the expected signature
      const message = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.PAYTECH_SECRET_KEY)
        .update(message)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );

      if (!isValid) {
        this.logger.warn(`[PayTech] Webhook signature verification failed`);
        this.logger.warn(`[PayTech] Expected: ${expectedSignature}`);
        this.logger.warn(`[PayTech] Received: ${receivedSignature}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`[PayTech] Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }
}