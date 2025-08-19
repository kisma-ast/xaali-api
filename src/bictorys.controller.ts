import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BictorysService } from './bictorys.service';
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

  @Get('status/:transactionId')
  async checkPaymentStatus(@Param('transactionId') transactionId: string) {
    try {
      if (!transactionId) {
        throw new HttpException('Transaction ID requis', HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        data: {
          transactionId,
          status: 'pending',
          message: 'Statut simulé'
        }
      };
    } catch (error) {
      this.logger.error('Error:', error);
      throw new HttpException('Erreur lors de la vérification du statut', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('validate-phone')
  async validatePhoneNumber(@Body() body: { phoneNumber: string }) {
    try {
      const { phoneNumber } = body;

      if (!phoneNumber) {
        throw new HttpException('Numéro de téléphone requis', HttpStatus.BAD_REQUEST);
      }

      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const isValid = /^[67][0-9]{8}$/.test(cleanPhone);
      
      let provider = null;
      if (isValid) {
        const prefix = cleanPhone.substring(0, 2);
        if (['77', '78'].includes(prefix)) provider = 'orange_money';
        else if (['70', '75', '76'].includes(prefix)) provider = 'mtn_mobile_money';
        else if (['60', '61'].includes(prefix)) provider = 'moov_money';
        else provider = 'wave';
      }

      return {
        success: true,
        data: {
          isValid,
          provider,
          formattedNumber: isValid ? `+221${cleanPhone}` : phoneNumber,
          originalNumber: phoneNumber
        },
        message: isValid ? 'Numéro valide' : 'Numéro invalide'
      };
    } catch (error) {
      this.logger.error('Error:', error);
      throw new HttpException('Erreur lors de la validation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}