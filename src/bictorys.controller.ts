import { Controller, Post, Get, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BictorysService } from './bictorys.service';
import { BICTORYS_CONFIG } from './config';
import axios from 'axios';

@Controller('bictorys')
export class BictorysController {
  private readonly logger = new Logger(BictorysController.name);

  constructor(private readonly bictorysService: BictorysService) {}

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
        this.logger.warn('⚠️ Clés Bictorys non configurées - Mode simulation');
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
            message: 'Mode démo - Contactez Bictorys pour activer vos clés API',
            isSimulated: true
          }
        };
      }

      try {
        // Essayer plusieurs formats selon la documentation Bictorys
        const endpoints = [
          `${config.API_URL}/payment/initialize`,
          `${config.API_URL}/payments/initiate`,
          'https://api.bictorys.com/v1/payment/initialize'
        ];

        const paymentData = {
          merchant_id: config.MERCHANT_ID,
          amount,
          currency: 'XOF',
          customer_phone: formattedPhone,
          payment_method: 'mobile_money',
          provider,
          reference,
          description: description || 'Paiement Xaali',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=cancelled`,
          webhook_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/bictorys/callback`
        };

        let bictorysResponse = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            this.logger.log(`🔄 Tentative: ${endpoint}`);
            bictorysResponse = await axios.post(endpoint, paymentData, {
              headers: {
                'Authorization': `Bearer ${config.API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': config.API_KEY,
                'X-Merchant-Id': config.MERCHANT_ID
              },
              timeout: 15000
            });
            this.logger.log(`✅ Succès avec: ${endpoint}`);
            break;
          } catch (endpointError) {
            lastError = endpointError;
            this.logger.warn(`❌ Échec ${endpoint}: ${endpointError.response?.status}`);
          }
        }

        if (!bictorysResponse) {
          throw lastError;
        }

        const responseData = bictorysResponse.data;
        const paymentUrl = responseData.data?.payment_url || responseData.payment_url || responseData.checkout_url;
        const txId = responseData.data?.transaction_id || responseData.transaction_id || transactionId;

        this.logger.log(`✅ Paiement Bictorys initié: ${paymentUrl}`);

        return {
          success: true,
          data: {
            transactionId: txId,
            checkoutUrl: paymentUrl,
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
        this.logger.error('❌ Erreur API Bictorys:', bictorysError.response?.data || bictorysError.message);
        
        this.logger.error('❌ API Bictorys inaccessible:', {
          status: bictorysError.response?.status,
          message: bictorysError.message,
          merchant: config.MERCHANT_ID
        });
        
        // Mode démo avec interface locale
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
            message: 'Mode démo - API Bictorys inaccessible (403 Forbidden)',
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
      this.logger.log('🔔 Callback Bictorys reçu:', JSON.stringify(body, null, 2));
      
      // Traiter le callback de Bictorys
      const { transaction_id, status, amount, phone_number } = body;
      
      this.logger.log(`💰 Transaction ${transaction_id}: ${status}`);
      
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