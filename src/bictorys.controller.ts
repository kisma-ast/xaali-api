import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BictorysService, BictorysPaymentRequest } from './bictorys.service';
import { BICTORYS_CONFIG } from './config';

@Controller('payments/bictorys')
export class BictorysController {
  private readonly logger = new Logger(BictorysController.name);

  constructor(private readonly bictorysService: BictorysService) {}

  /**
   * Initie un paiement mobile money
   */
  @Post('initiate')
  async initiatePayment(@Body() paymentRequest: BictorysPaymentRequest) {
    try {
      this.logger.log(`Payment initiation request: ${JSON.stringify(paymentRequest)}`);

      // Validation des données
      if (!paymentRequest.amount || paymentRequest.amount <= 0) {
        throw new HttpException('Montant invalide', HttpStatus.BAD_REQUEST);
      }

      if (!paymentRequest.phoneNumber) {
        throw new HttpException('Numéro de téléphone requis', HttpStatus.BAD_REQUEST);
      }

      if (!paymentRequest.provider) {
        throw new HttpException('Provider mobile money requis', HttpStatus.BAD_REQUEST);
      }

      // Validation du numéro de téléphone
      if (!this.bictorysService.validatePhoneNumber(paymentRequest.phoneNumber, paymentRequest.provider)) {
        throw new HttpException('Numéro de téléphone invalide pour ce provider', HttpStatus.BAD_REQUEST);
      }

      // Génération d'une référence si non fournie
      if (!paymentRequest.reference) {
        paymentRequest.reference = this.bictorysService.generateReference();
      }

      // Initiation du paiement
      const result = await this.bictorysService.initiatePayment(paymentRequest);

      if (result.success) {
        return {
          success: true,
          data: {
            transactionId: result.transactionId,
            paymentUrl: result.paymentUrl,
            qrCode: result.qrCode,
            reference: paymentRequest.reference,
            status: result.status
          },
          message: result.message
        };
      } else {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error('Error in payment initiation:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de l\'initiation du paiement', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
   * Récupère la liste des providers mobile money disponibles
   */
  @Get('providers')
  async getProviders() {
    try {
      return {
        success: true,
        data: {
          providers: [
            {
              id: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY,
              name: 'Orange Money',
              logo: '/images/orange-money.png',
              description: 'Paiement via Orange Money'
            },
            {
              id: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY,
              name: 'MTN Mobile Money',
              logo: '/images/mtn-money.png',
              description: 'Paiement via MTN Mobile Money'
            },
            {
              id: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY,
              name: 'Moov Money',
              logo: '/images/moov-money.png',
              description: 'Paiement via Moov Money'
            },
            {
              id: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE,
              name: 'Wave',
              logo: '/images/wave.png',
              description: 'Paiement via Wave'
            },
            {
              id: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.FREE_MONEY,
              name: 'Free Money',
              logo: '/images/free-money.png',
              description: 'Paiement via Free Money'
            }
          ]
        },
        message: 'Providers mobile money récupérés avec succès'
      };
    } catch (error) {
      this.logger.error('Error getting providers:', error);
      throw new HttpException('Erreur lors de la récupération des providers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Valide un numéro de téléphone pour un provider donné
   */
  @Post('validate-phone')
  async validatePhoneNumber(@Body() body: { phoneNumber: string; provider: string }) {
    try {
      const { phoneNumber, provider } = body;

      if (!phoneNumber || !provider) {
        throw new HttpException('Numéro de téléphone et provider requis', HttpStatus.BAD_REQUEST);
      }

      const isValid = this.bictorysService.validatePhoneNumber(phoneNumber, provider);

      return {
        success: true,
        data: {
          isValid,
          phoneNumber,
          provider
        },
        message: isValid ? 'Numéro de téléphone valide' : 'Numéro de téléphone invalide'
      };
    } catch (error) {
      this.logger.error('Error validating phone number:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la validation du numéro', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
