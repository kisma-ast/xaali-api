import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BictorysService, BictorysPaymentRequest } from './bictorys.service';
import { BICTORYS_CONFIG } from './config';

@Controller('bictorys')
export class BictorysController {
  private readonly logger = new Logger(BictorysController.name);

  constructor(private readonly bictorysService: BictorysService) {}

  @Post('initiate')
  async initiatePayment(@Body() body: { amount: number; phoneNumber: string; provider: string; description?: string }) {
    try {
      const { amount, phoneNumber, provider } = body;
      
      if (!amount || amount <= 0) {
        return { success: false, message: 'Montant invalide' };
      }

      if (!phoneNumber) {
        return { success: false, message: 'Numéro de téléphone requis' };
      }

      if (!provider) {
        return { success: false, message: 'Opérateur requis' };
      }

      // Validation simple du numéro
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[67][0-9]{8}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        return { success: false, message: 'Format invalide. Ex: 771234567' };
      }

      const formattedPhone = `+221${cleanPhone}`;

      return {
        success: true,
        data: {
          transactionId: `TXN_${Date.now()}`,
          provider,
          phoneNumber: formattedPhone,
          amount,
          status: 'pending',
          reference: `XAALI_${Date.now()}`,
          message: 'Paiement initié avec succès'
        }
      };
    } catch (error) {
      this.logger.error('Error:', error);
      return { success: false, message: 'Erreur lors du paiement' };
    }
  }

  @Get('providers')
  getProviders() {
    return {
      success: true,
      data: [
        {
          id: 'orange_money',
          name: 'Orange Money',
          prefixes: ['77', '78'],
          logo: '🟠',
          description: 'Orange Money Sénégal'
        },
        {
          id: 'mtn_mobile_money',
          name: 'MTN Mobile Money',
          prefixes: ['70', '75', '76'],
          logo: '🟡',
          description: 'MTN Mobile Money Sénégal'
        },
        {
          id: 'moov_money',
          name: 'Moov Money',
          prefixes: ['60', '61'],
          logo: '🔵',
          description: 'Moov Money Sénégal'
        },
        {
          id: 'wave',
          name: 'Wave',
          prefixes: ['70', '75', '76', '77', '78'],
          logo: '🌊',
          description: 'Wave Sénégal'
        }
      ]
    };
  }

  /**
   * Vérifie le statut d'un paiement
   */
  @Get('status/:transactionId')
  async checkPaymentStatus(@Param('transactionId') transactionId: string) {
    try {
      this.logger.log(`Checking payment status for: ${transactionId}`);

      if (!transactionId) {
        throw new HttpException('Transaction ID requis', HttpStatus.BAD_REQUEST);
      }

      const status = await this.bictorysService.checkPaymentStatus(transactionId);

      return {
        success: true,
        data: status,
        message: 'Statut du paiement récupéré avec succès'
      };
    } catch (error) {
      this.logger.error(`Error checking payment status for ${transactionId}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la vérification du statut', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Callback de Bictorys pour les notifications de paiement
   */
  @Post('callback')
  async handleCallback(@Body() callbackData: any) {
    try {
      this.logger.log(`Received Bictorys callback: ${JSON.stringify(callbackData)}`);

      const paymentStatus = await this.bictorysService.processCallback(callbackData);

      // Ici vous pouvez ajouter la logique pour mettre à jour votre base de données
      // et notifier le frontend du changement de statut

      return {
        success: true,
        message: 'Callback traité avec succès'
      };
    } catch (error) {
      this.logger.error('Error processing callback:', error);
      throw new HttpException('Erreur lors du traitement du callback', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Annule un paiement
   */
  @Post('cancel/:transactionId')
  async cancelPayment(@Param('transactionId') transactionId: string) {
    try {
      this.logger.log(`Cancelling payment: ${transactionId}`);

      if (!transactionId) {
        throw new HttpException('Transaction ID requis', HttpStatus.BAD_REQUEST);
      }

      const success = await this.bictorysService.cancelPayment(transactionId);

      if (success) {
        return {
          success: true,
          message: 'Paiement annulé avec succès'
        };
      } else {
        throw new HttpException('Échec de l\'annulation du paiement', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Error cancelling payment ${transactionId}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de l\'annulation du paiement', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  /**
   * Valide un numéro de téléphone et détecte automatiquement l'opérateur
   */
  @Post('validate-phone')
  async validatePhoneNumber(@Body() body: { phoneNumber: string }) {
    try {
      const { phoneNumber } = body;

      if (!phoneNumber) {
        throw new HttpException('Numéro de téléphone requis', HttpStatus.BAD_REQUEST);
      }

      const validation = this.bictorysService.validatePhoneNumber(phoneNumber);

      return {
        success: true,
        data: {
          isValid: validation.isValid,
          provider: validation.provider,
          formattedNumber: validation.formattedNumber,
          originalNumber: phoneNumber
        },
        message: validation.isValid ? 
          `Numéro valide - Opérateur détecté: ${this.getProviderName(validation.provider)}` : 
          'Numéro de téléphone invalide ou opérateur non supporté'
      };
    } catch (error) {
      this.logger.error('Error validating phone number:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la validation du numéro', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Debug simple
   */
  @Get('debug')
  async debug() {
    const testResult = this.bictorysService.validatePhoneNumber('771234567');
    return {
      success: true,
      test: testResult,
      message: 'Debug validation'
    };
  }

  /**
   * Endpoint de test pour la validation
   */
  @Post('test-validation')
  async testValidation(@Body() body: { phoneNumber: string }) {
    try {
      const { phoneNumber } = body;
      
      this.logger.log(`Testing validation for: ${phoneNumber}`);
      
      const validation = this.bictorysService.validatePhoneNumber(phoneNumber);
      
      return {
        success: true,
        input: phoneNumber,
        validation: validation,
        message: validation.isValid ? 
          `✅ Numéro valide - Opérateur: ${this.getProviderName(validation.provider)}` : 
          '❌ Numéro invalide ou opérateur non supporté'
      };
    } catch (error) {
      this.logger.error('Error in test validation:', error);
      throw new HttpException('Erreur lors du test de validation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtient le nom lisible d'un provider
   */
  private getProviderName(provider: string | null): string {
    if (!provider) return 'Inconnu';
    
    const providerNames = {
      [BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY]: 'Orange Money',
      [BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY]: 'MTN Mobile Money',
      [BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY]: 'Moov Money',
      [BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE]: 'Wave',
      [BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.FREE_MONEY]: 'Free Money'
    };
    
    return providerNames[provider] || provider;
  }
}
