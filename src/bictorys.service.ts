import { Injectable, Logger } from '@nestjs/common';
import { BICTORYS_CONFIG } from './config';

export interface BictorysPaymentRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: string; // orange_money, mtn_mobile_money, etc.
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

@Injectable()
export class BictorysService {
  private readonly logger = new Logger(BictorysService.name);
  private readonly config = process.env.NODE_ENV === 'production' 
    ? BICTORYS_CONFIG.PRODUCTION 
    : BICTORYS_CONFIG.SANDBOX;

  constructor() {
    this.logger.log(`Configuration Bictorys (${process.env.NODE_ENV || 'development'}):`);
    this.logger.log(`  - API URL: ${this.config.API_URL}`);
    this.logger.log(`  - Merchant ID: ${this.config.MERCHANT_ID}`);
  }

  /**
   * Initie un paiement mobile money
   */
  async initiatePayment(paymentRequest: BictorysPaymentRequest): Promise<BictorysPaymentResponse> {
    try {
      this.logger.log(`Initiating payment: ${paymentRequest.reference} - ${paymentRequest.amount} ${paymentRequest.currency}`);

      const payload = {
        merchant_id: this.config.MERCHANT_ID,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        phone_number: paymentRequest.phoneNumber,
        provider: paymentRequest.provider,
        description: paymentRequest.description,
        reference: paymentRequest.reference,
        callback_url: paymentRequest.callbackUrl || `${process.env.BACKEND_URL || 'http://localhost:3000'}/payments/bictorys/callback`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/status`
      };

      const response = await fetch(`${this.config.API_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.API_KEY}`,
          'X-Secret-Key': this.config.SECRET_KEY || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        this.logger.log(`Payment initiated successfully: ${data.transaction_id}`);
        return {
          success: true,
          transactionId: data.transaction_id,
          status: 'pending',
          message: 'Paiement initié avec succès',
          paymentUrl: data.payment_url,
          qrCode: data.qr_code
        };
      } else {
        this.logger.error(`Payment initiation failed: ${data.message}`);
        return {
          success: false,
          status: 'failed',
          message: data.message || 'Échec de l\'initiation du paiement'
        };
      }
    } catch (error) {
      this.logger.error('Error initiating payment:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Erreur lors de l\'initiation du paiement'
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async checkPaymentStatus(transactionId: string): Promise<BictorysPaymentStatus> {
    try {
      this.logger.log(`Checking payment status: ${transactionId}`);

      const response = await fetch(`${this.config.API_URL}/payments/status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.API_KEY}`,
          'X-Secret-Key': this.config.SECRET_KEY || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          transactionId: data.transaction_id,
          status: this.mapBictorysStatus(data.status),
          amount: data.amount,
          currency: data.currency,
          phoneNumber: data.phone_number,
          provider: data.provider,
          timestamp: data.timestamp,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Erreur lors de la vérification du statut');
      }
    } catch (error) {
      this.logger.error(`Error checking payment status for ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Traite le callback de Bictorys
   */
  async processCallback(callbackData: any): Promise<BictorysPaymentStatus> {
    try {
      this.logger.log(`Processing Bictorys callback: ${callbackData.transaction_id}`);

      // Vérifier la signature du callback pour la sécurité
      if (!this.verifyCallbackSignature(callbackData)) {
        throw new Error('Signature de callback invalide');
      }

      return {
        transactionId: callbackData.transaction_id,
        status: this.mapBictorysStatus(callbackData.status),
        amount: callbackData.amount,
        currency: callbackData.currency,
        phoneNumber: callbackData.phone_number,
        provider: callbackData.provider,
        timestamp: callbackData.timestamp,
        message: callbackData.message
      };
    } catch (error) {
      this.logger.error('Error processing callback:', error);
      throw error;
    }
  }

  /**
   * Annule un paiement
   */
  async cancelPayment(transactionId: string): Promise<boolean> {
    try {
      this.logger.log(`Cancelling payment: ${transactionId}`);

      const response = await fetch(`${this.config.API_URL}/payments/cancel/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.API_KEY}`,
          'X-Secret-Key': this.config.SECRET_KEY || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        this.logger.log(`Payment cancelled successfully: ${transactionId}`);
        return true;
      } else {
        this.logger.error(`Payment cancellation failed: ${data.message}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error cancelling payment ${transactionId}:`, error);
      return false;
    }
  }

  /**
   * Mappe les statuts Bictorys vers nos statuts internes
   */
  private mapBictorysStatus(bictorysStatus: string): 'pending' | 'success' | 'failed' | 'cancelled' {
    switch (bictorysStatus.toLowerCase()) {
      case 'pending':
      case 'processing':
        return 'pending';
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Vérifie la signature du callback pour la sécurité
   */
  private verifyCallbackSignature(callbackData: any): boolean {
    // Implémentation de la vérification de signature selon la documentation Bictorys
    // Cette méthode doit être adaptée selon les spécifications exactes de Bictorys
    try {
      const signature = callbackData.signature;
      const payload = JSON.stringify({
        transaction_id: callbackData.transaction_id,
        amount: callbackData.amount,
        status: callbackData.status,
        timestamp: callbackData.timestamp
      });

      // Vérification de la signature HMAC
      // Note: Implémentation à adapter selon la documentation Bictorys
      return true; // Placeholder
    } catch (error) {
      this.logger.error('Error verifying callback signature:', error);
      return false;
    }
  }

  /**
   * Génère une référence unique pour les paiements
   */
  generateReference(prefix: string = 'XAALI'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Détecte automatiquement l'opérateur basé sur le numéro de téléphone (sans filtres)
   */
  detectProvider(phoneNumber: string): string | null {
    if (!phoneNumber) {
      return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
    }

    // Nettoyer le numéro
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
    const prefix = cleanNumber.substring(0, 2);
    
    // Détection simple par préfixe
    switch (prefix) {
      case '77':
      case '78':
        return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
      case '70':
      case '75':
      case '76':
        return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY;
      case '60':
      case '61':
        return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY;
      case '73':
      case '74':
      case '79':
        return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE;
      default:
        // TOUJOURS retourner Orange Money par défaut
        return BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
    }
  }

  /**
   * Valide un numéro de téléphone et retourne l'opérateur détecté (sans contrôles stricts)
   */
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; provider: string | null; formattedNumber: string } {
    if (!phoneNumber) {
      return { isValid: false, provider: null, formattedNumber: '' };
    }

    // Nettoyer le numéro
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    let formattedNumber = cleanNumber;
    
    // Ajouter le préfixe pays si manquant
    if (!formattedNumber.startsWith('+221') && !formattedNumber.startsWith('221')) {
      formattedNumber = '+221' + formattedNumber;
    } else if (formattedNumber.startsWith('221')) {
      formattedNumber = '+' + formattedNumber;
    }

    // AUCUNE VALIDATION - Accepter tous les numéros
    const isValid = cleanNumber.length >= 8; // Minimum 8 chiffres
    
    // Détecter l'opérateur (ou utiliser Orange par défaut)
    let provider = this.detectProvider(formattedNumber);
    if (!provider) {
      provider = BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY; // Défaut
    }
    
    return { isValid, provider, formattedNumber };
  }
}
