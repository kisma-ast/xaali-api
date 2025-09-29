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
    // Force production URLs to avoid any localhost issues
    let backendUrl: string;
    let frontendUrl: string;
    
    if (process.env.NODE_ENV === 'production') {
      // Always use production URLs in production
      backendUrl = 'https://xaali-api.onrender.com';
      frontendUrl = 'https://xaali.onrender.com';
      this.logger.log('[PayTech] Using FORCED production URLs');
    } else {
      // Only use localhost in development
      backendUrl = 'http://localhost:3000';
      frontendUrl = 'http://localhost:5173';
      this.logger.log('[PayTech] Using localhost URLs for development');
    }
    
    this.PAYTECH_CALLBACK_URL = `${backendUrl}/paytech/callback`;
    this.PAYTECH_SUCCESS_URL = `${frontendUrl}/#/payment/success`;
    this.PAYTECH_CANCEL_URL = `${frontendUrl}/#/payment/cancel`;
    
    this.logger.log(`Configuration PayTech (${process.env.NODE_ENV || 'development'}):`);
    this.logger.log(`  - API Key: ${this.PAYTECH_API_KEY.substring(0, 10)}...`);
    this.logger.log(`  - Callback URL: ${this.PAYTECH_CALLBACK_URL}`);
    this.logger.log(`  - Success URL: ${this.PAYTECH_SUCCESS_URL}`);
    this.logger.log(`  - Cancel URL: ${this.PAYTECH_CANCEL_URL}`);
    this.logger.log(`  - Backend URL: ${backendUrl}`);
    this.logger.log(`  - Frontend URL: ${frontendUrl}`);
    
    // Vérifier que les URLs sont valides
    if (this.PAYTECH_SUCCESS_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.logger.error('🚫 ERREUR CRITIQUE: URLs localhost en production!');
      this.logger.error('Success URL:', this.PAYTECH_SUCCESS_URL);
      this.logger.error('Cancel URL:', this.PAYTECH_CANCEL_URL);
    } else {
      this.logger.log('✅ URLs PayTech valides pour la production');
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
        item_name: paymentRequest.description.substring(0, 100),
        item_price: Math.round(paymentRequest.amount),
        currency: 'XOF',
        ref_command: paymentRequest.reference,
        command_name: paymentRequest.description.substring(0, 100),
        env: 'test',
        ipn_url: this.PAYTECH_CALLBACK_URL,
        success_url: this.PAYTECH_SUCCESS_URL,
        cancel_url: this.PAYTECH_CANCEL_URL,
        with_mobile_money: '1'
      };
      
      // Vérifier que les URLs sont valides
      this.logger.log(`[PayTech] Validation des URLs:`);
      this.logger.log(`  - Success URL valide: ${this.isValidUrl(this.PAYTECH_SUCCESS_URL)}`);
      this.logger.log(`  - Cancel URL valide: ${this.isValidUrl(this.PAYTECH_CANCEL_URL)}`);
      this.logger.log(`  - IPN URL valide: ${this.isValidUrl(this.PAYTECH_CALLBACK_URL)}`);
      
      this.logger.log(`[PayTech] URLs utilisées:`);
      this.logger.log(`  - IPN: ${this.PAYTECH_CALLBACK_URL}`);
      this.logger.log(`  - Success: ${this.PAYTECH_SUCCESS_URL}`);
      this.logger.log(`  - Cancel: ${this.PAYTECH_CANCEL_URL}`);

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
   * Vérifie si une URL est valide
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
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
  generateReference(prefix: string = 'XAALI_PxAYTECH'): string {
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