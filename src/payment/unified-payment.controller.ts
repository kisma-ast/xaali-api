import { Controller, Post, Get, Body, Param, Query, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRequest } from './payment.interface';
import { Request, Response } from 'express';

@Controller('payment')
export class UnifiedPaymentController {
  private readonly logger = new Logger(UnifiedPaymentController.name);

  constructor(private readonly paymentService: PaymentService) { }

  @Get('providers')
  getAvailableProviders() {
    return {
      success: true,
      providers: this.paymentService.getAvailableProviders(),
      message: 'Providers de paiement disponibles'
    };
  }

  @Post('create/:provider')
  async createPayment(
    @Param('provider') provider: string,
    @Body() body: {
      amount: number;
      currency?: string;
      customerEmail?: string;
      customerName?: string;
      description: string;
      // Données du cas juridique
      caseTitle?: string;
      caseDescription?: string;
      caseCategory?: string;
      citizenPhone?: string;
    }
  ) {
    try {
      if (!body.amount || body.amount <= 0) {
        return { success: false, message: 'Montant invalide' };
      }

      if (!body.description) {
        return { success: false, message: 'Description requise' };
      }

      this.logger.log(`Création paiement ${provider}: ${body.amount} ${body.currency || 'XOF'}`);

      // Générer une référence unique pour ce provider
      const reference = this.paymentService.generateReference(provider, 'XAALI');

      // URLs de callback dynamiques
      const backendUrl = process.env.BACKEND_URL || 'https://xaali-api.onrender.com';
      const frontendUrl = 'https://xaali.net';

      const paymentRequest: PaymentRequest = {
        amount: body.amount,
        currency: body.currency || 'XOF',
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        description: body.description,
        reference: reference,
        callbackUrl: `${backendUrl}/payment/callback/${provider}`,
        successUrl: `${frontendUrl}/#/payment/success`,
        cancelUrl: `${frontendUrl}/#/payment/cancel`,
        caseData: body.caseTitle ? {
          title: body.caseTitle,
          description: body.caseDescription || body.description,
          category: body.caseCategory || 'consultation-generale',
          citizenPhone: body.citizenPhone || '+221 77 000 00 00'
        } : undefined
      };

      const result = await this.paymentService.initiatePayment(provider, paymentRequest);
      return result;
    } catch (error) {
      this.logger.error(`Erreur création paiement ${provider}:`, error);
      return {
        success: false,
        message: `Erreur ${provider}: ${error.message}`,
        provider: provider
      };
    }
  }

  @Post('callback/:provider')
  async handleCallback(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`[${provider}] Callback reçu`);
      this.logger.log(`[${provider}] Headers: ${JSON.stringify(req.headers)}`);
      this.logger.log(`[${provider}] Body: ${JSON.stringify(req.body)}`);

      const result = await this.paymentService.processCallback(provider, req.body);

      this.logger.log(`[${provider}] Callback traité: ${result.transactionId} - ${result.status}`);

      return res.status(HttpStatus.OK).json({
        status: 'success',
        message: 'Callback traité avec succès',
        transactionId: result.transactionId,
        newStatus: result.status,
        provider: provider
      });
    } catch (error) {
      this.logger.error(`[${provider}] Erreur callback: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: `Erreur callback ${provider}: ${error.message}`
      });
    }
  }

  @Get('verify/:provider/:transactionId')
  async verifyPayment(
    @Param('provider') provider: string,
    @Param('transactionId') transactionId: string
  ) {
    try {
      this.logger.log(`Vérification paiement ${provider}: ${transactionId}`);

      const result = await this.paymentService.checkPaymentStatus(provider, transactionId);

      return {
        success: true,
        payment: result,
        verified: true,
        provider: provider
      };
    } catch (error) {
      this.logger.error(`Erreur vérification ${provider}:`, error);
      return {
        success: false,
        message: `Erreur vérification ${provider}: ${error.message}`,
        provider: provider
      };
    }
  }

  @Get('health')
  async health() {
    return {
      status: 'healthy',
      service: 'unified-payment-service',
      providers: this.paymentService.getAvailableProviders(),
      timestamp: new Date().toISOString()
    };
  }

  // Endpoints de redirection pour chaque provider
  @Get('success/:provider')
  async paymentSuccessRedirect(
    @Param('provider') provider: string,
    @Query('transaction_id') transactionId: string,
    @Res() res: Response
  ) {
    try {
      const frontendUrl = `${'https://xaali.net'}/payment/success?provider=${provider}&transaction_id=${transactionId || ''}`;
      return res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error(`Erreur redirection succès ${provider}: ${error.message}`);
      return res.redirect(`${'https://xaali.net'}/payment/error`);
    }
  }

  @Get('cancel/:provider')
  async paymentCancelRedirect(
    @Param('provider') provider: string,
    @Query('transaction_id') transactionId: string,
    @Res() res: Response
  ) {
    try {
      const frontendUrl = `${'https://xaali.net'}/payment/cancel?provider=${provider}&transaction_id=${transactionId || ''}`;
      return res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error(`Erreur redirection annulation ${provider}: ${error.message}`);
      return res.redirect(`${'https://xaali.net'}/payment/error`);
    }
  }
}