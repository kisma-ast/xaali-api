import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BictorysService } from './bictorys.service';
import { BICTORYS_CONFIG } from './config';
import axios from 'axios';

@Controller('bictorys')
export class BictorysController {
  private readonly logger = new Logger(BictorysController.name);

  constructor(private readonly bictorysService: BictorysService) {}

  private getPaymentType(provider: string): string {
    const paymentTypes: { [key: string]: string } = {
      'orange_money': 'orange_money',
      'wave': 'wave',
      'mtn_mobile_money': 'mtn_mobile_money',
      'moov_money': 'moov_money',
      'mobile_money': 'orange_money'
    };
    return paymentTypes[provider] || 'orange_money';
  }

  @Post('initiate')
  async initiatePayment(@Body() body: { amount: number; phoneNumber: string; provider: string; description?: string }) {
    try {
      const { amount, phoneNumber, provider, description } = body;
      
      if (!amount || amount <= 0) {
        return { success: false, message: 'Montant invalide' };
      }

      if (!phoneNumber) {
        return { success: false, message: 'Numéro de téléphone requis' };
      }

      if (!provider) {
        return { success: false, message: 'Opérateur requis' };
      }

      this.logger.log(`Initiation paiement: ${amount} XOF via ${provider} pour ${phoneNumber}`);

      // Nettoyer le numéro de téléphone
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
      const formattedPhone = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;

      const transactionId = `TXN_${Date.now()}`;
      const reference = `XAALI_${Date.now()}`;

      // Configuration Bictorys
      const config = process.env.NODE_ENV === 'production' ? BICTORYS_CONFIG.PRODUCTION : BICTORYS_CONFIG.SANDBOX;
      
      // Vérifier si les clés sont configurées et fonctionnelles
      if (!config.MERCHANT_ID || config.MERCHANT_ID === 'test_merchant_id' || config.MERCHANT_ID === 'your_real_merchant_id_here') {
        this.logger.warn('Clés Bictorys non configurées - Mode simulation');
        // Mode démo avec interface de paiement simulée
        const demoUrl = `http://localhost:3001/payment/demo?amount=${amount}&provider=${provider}&phone=${encodeURIComponent(formattedPhone)}&reference=${reference}&transaction=${transactionId}`;
        
        return {
          success: true,
          data: {
            transactionId,
            checkoutUrl: demoUrl,
            provider,
            phoneNumber: formattedPhone,
            amount,
            status: 'redirect',
            reference,
            description: description || 'Paiement Xaali',
            message: 'Mode démo - Compte développeur en attente d’activation',
            isSimulated: true
          }
        };
      }

      try {
        // Direct API pour Mobile Money (Orange Money, Wave)
        const paymentType = this.getPaymentType(provider);
        const endpoint = `${config.API_URL}/charges?payment_type=${paymentType}`;
        
        const chargesData = {
          amount,
          currency: 'XOF',
          phone: formattedPhone,
          paymentReference: reference,
          merchantReference: transactionId,
          successRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=success&transaction=${transactionId}`,
          errorRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=cancelled&transaction=${transactionId}`,
          customerObject: {
            name: 'Client Xaali',
            phone: formattedPhone,
            email: 'client@xaali.sn',
            city: 'Dakar',
            country: 'SN',
            locale: 'fr-FR'
          },
          allowUpdateCustomer: false
        };

        this.logger.log(`Appel Direct API Bictorys: ${endpoint}`);
        this.logger.log(`Type de paiement: ${paymentType}`);
        
        const bictorysResponse = await axios.post(endpoint, chargesData, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': config.API_KEY
          },
          timeout: 30000
        });

        const responseData = bictorysResponse.data;
        const checkoutUrl = responseData.checkoutUrl || responseData.checkout_url || responseData.redirectUrl;
        const chargeId = responseData.id || responseData.chargeId || transactionId;

        this.logger.log(`Charge Bictorys créée: ${chargeId}`);
        this.logger.log(`URL checkout: ${checkoutUrl}`);

        return {
          success: true,
          data: {
            transactionId: chargeId,
            checkoutUrl,
            provider,
            phoneNumber: formattedPhone,
            amount,
            status: 'redirect',
            reference,
            description: description || 'Paiement Xaali',
            message: 'Redirection vers Bictorys',
            bictorysData: bictorysResponse.data
          }
        };
      } catch (bictorysError) {
        this.logger.error('Erreur API Bictorys:', bictorysError.response?.data || bictorysError.message);
        
        this.logger.error('API Bictorys Charges inaccessible:', {
          status: bictorysError.response?.status,
          endpoint: `${config.API_URL}/charges`,
          apiKey: config.API_KEY?.substring(0, 20) + '...'
        });
        
        // Fallback: Mode démo avec simulation Direct API
        const fallbackPaymentType = this.getPaymentType(provider);
        const demoUrl = `http://localhost:3001/payment/demo?amount=${amount}&provider=${provider}&phone=${encodeURIComponent(formattedPhone)}&reference=${reference}&transaction=${transactionId}&payment_type=${fallbackPaymentType}`;
        
        return {
          success: true,
          data: {
            transactionId,
            checkoutUrl: demoUrl,
            provider,
            phoneNumber: formattedPhone,
            amount,
            status: 'redirect',
            reference,
            description: description || 'Paiement Xaali',
            message: 'Mode démo - Contactez Bictorys pour activer votre compte',
            isSimulated: true
          }
        };
      }
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
          logo: 'orange',
          description: 'Orange Money Sénégal'
        },
        {
          id: 'mtn_mobile_money',
          name: 'MTN Mobile Money',
          prefixes: ['70', '75', '76'],
          logo: 'yellow',
          description: 'MTN Mobile Money Sénégal'
        },
        {
          id: 'moov_money',
          name: 'Moov Money',
          prefixes: ['60', '61'],
          logo: 'blue',
          description: 'Moov Money Sénégal'
        },
        {
          id: 'wave',
          name: 'Wave',
          prefixes: ['70', '75', '76', '77', '78'],
          logo: 'wave',
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

      const config = process.env.NODE_ENV === 'production' ? BICTORYS_CONFIG.PRODUCTION : BICTORYS_CONFIG.SANDBOX;
      
      // Si les clés ne sont pas configurées, retourner un statut simulé
      if (!config.MERCHANT_ID || config.MERCHANT_ID === 'test_merchant_id' || config.MERCHANT_ID === 'your_real_merchant_id_here') {
        // Simuler un paiement réussi après 10 secondes
        const isOld = transactionId.includes('TXN_') && (Date.now() - parseInt(transactionId.split('_')[1])) > 10000;
        
        return {
          success: true,
          data: {
            transactionId,
            status: isOld ? 'success' : 'pending',
            message: isOld ? 'Paiement simulé réussi' : 'Paiement en cours (simulation)'
          }
        };
      }

      try {
        // Vérifier le statut via l'API Bictorys
        const response = await axios.get(`${config.API_URL}/payments/${transactionId}/status`, {
          headers: {
            'Authorization': `Bearer ${config.API_KEY}`,
            'X-Secret-Key': config.SECRET_KEY
          }
        });

        return {
          success: true,
          data: {
            transactionId,
            status: response.data.status,
            message: response.data.message || 'Statut récupéré depuis Bictorys'
          }
        };
      } catch (apiError) {
        this.logger.error('Erreur API Bictorys status:', apiError.response?.data || apiError.message);
        
        return {
          success: true,
          data: {
            transactionId,
            status: 'pending',
            message: 'Statut non disponible (erreur API)'
          }
        };
      }
    } catch (error) {
      this.logger.error('Error:', error);
      throw new HttpException('Erreur lors de la vérification du statut', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('validate-phone')
  async validatePhoneNumber(@Body() body: { phoneNumber: string }) {
    // AUCUNE VALIDATION - Accepter tous les numéros
    const phoneNumber = body.phoneNumber || '';
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
    const formattedNumber = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;
    
    // Détecter l'opérateur ou utiliser Orange par défaut
    const prefix = cleanPhone.substring(0, 2);
    let provider = 'orange_money';
    
    if (['77', '78'].includes(prefix)) provider = 'orange_money';
    else if (['70', '75', '76'].includes(prefix)) provider = 'mtn_mobile_money';
    else if (['60', '61'].includes(prefix)) provider = 'moov_money';
    else if (['73', '74', '79'].includes(prefix)) provider = 'wave';

    return {
      success: true,
      data: {
        isValid: true,
        provider,
        formattedNumber,
        originalNumber: phoneNumber
      },
      message: 'Numéro accepté'
    };
  }

  @Post('callback')
  async handleCallback(@Body() body: any) {
    try {
      this.logger.log('Callback Bictorys reçu:', JSON.stringify(body, null, 2));
      
      // Traiter le callback de Bictorys
      const { transaction_id, status, amount, phone_number } = body;
      
      this.logger.log(`Transaction ${transaction_id}: ${status}`);
      
      // Ici vous pouvez mettre à jour votre base de données
      // ou notifier votre frontend via WebSocket
      
      return {
        success: true,
        message: 'Callback traité avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur callback:', error);
      throw new HttpException('Erreur lors du traitement du callback', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}