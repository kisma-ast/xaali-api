import { Controller, Post, Get, Body, Param, Query, Req, Res, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { PayTechService } from './paytech.service';
import { Request, Response } from 'express';

@Controller('paytech')
export class PayTechController {
  private readonly logger = new Logger(PayTechController.name);

  constructor(private readonly payTechService: PayTechService) {}

  @Post('create-payment')
  async createPayment(@Body() body: { 
    amount: number; 
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    description: string;
    commandeId?: number;
    testRealApi?: boolean 
  }) {
    try {
      const { amount, currency, customerEmail, customerName, description, commandeId, testRealApi } = body;
      
      if (!amount || amount <= 0) {
        return { success: false, message: 'Montant invalide' };
      }

      if (!description) {
        return { success: false, message: 'Description requise' };
      }

      this.logger.log(`Creating PayTech payment: ${amount} ${currency || 'XOF'} for ${description}`);

      // Generate a unique reference
      const reference = this.payTechService.generateReference('XAALI');
      
      // For production, always use real API
      // In development, you can set testRealApi to true to test real API calls
      if (testRealApi || process.env.NODE_ENV === 'production') {
        process.env.TEST_REAL_PAYTECH = 'true';
      }

      // Create payment request
      const paymentRequest = {
        amount,
        currency: currency || 'XOF',
        customerEmail,
        customerName,
        description,
        reference,
        commandeId,
        callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/paytech/callback`,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`
      };

      // Initiate payment with PayTech
      const result = await this.payTechService.initiatePayment(paymentRequest);
      
      // Reset test flag
      if (testRealApi && process.env.NODE_ENV !== 'production') {
        delete process.env.TEST_REAL_PAYTECH;
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error creating PayTech payment:', error);
      return { success: false, message: 'Erreur lors de la création du paiement' };
    }
  }

  @Post('callback')
  async handleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('[PayTech] Received callback request');
      this.logger.log(`[PayTech] Content-Type: ${req.headers['content-type']}`);
      this.logger.log(`[PayTech] Headers: ${JSON.stringify(req.headers)}`);

      // PayTech may send form data or JSON - handle both
      let data: any;
      if (req.headers['content-type'] === 'application/json') {
        data = req.body;
        this.logger.log(`[PayTech] Received JSON data: ${JSON.stringify(data)}`);
      } else {
        // PayTech often sends form data
        data = req.body;
        this.logger.log(`[PayTech] Received form data: ${JSON.stringify(data)}`);
      }

      if (!data) {
        this.logger.warn('[PayTech] No data received in callback');
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'No data received' });
      }

      this.logger.log(`[PayTech] Processing callback data: ${JSON.stringify(data)}`);

      // Process the callback
      const result = await this.payTechService.processCallback(data);
      
      this.logger.log(`[PayTech] Callback processed successfully for transaction: ${result.transactionId}`);
      
      return res.status(HttpStatus.OK).json({
        status: 'success',
        message: 'Callback processed successfully',
        transactionId: result.transactionId,
        newStatus: result.status
      });
    } catch (error) {
      this.logger.error(`[PayTech] Callback error: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: `Callback processing failed: ${error.message}` 
      });
    }
  }

  @Get('verify/:transactionId')
  async verifyPayment(@Param('transactionId') transactionId: string) {
    try {
      if (!transactionId) {
        throw new HttpException('Transaction ID requis', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Verifying PayTech payment: ${transactionId}`);
      
      const result = await this.payTechService.checkPaymentStatus(transactionId);
      
      return {
        success: true,
        payment: result,
        verified: true
      };
    } catch (error) {
      this.logger.error(`Error verifying PayTech payment ${transactionId}:`, error);
      throw new HttpException(
        `Payment verification failed: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('test-callback')
  async testCallback(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log(`[PayTech Test] Method: ${req.method}`);
      this.logger.log(`[PayTech Test] Content-Type: ${req.headers['content-type']}`);
      this.logger.log(`[PayTech Test] Headers: ${JSON.stringify(req.headers)}`);

      let data: any;
      if (req.method === 'POST') {
        if (req.headers['content-type'] === 'application/json') {
          data = req.body;
          this.logger.log(`[PayTech Test] JSON data: ${JSON.stringify(data)}`);
        } else {
          data = req.body;
          this.logger.log(`[PayTech Test] Form data: ${JSON.stringify(data)}`);
        }
      } else {
        data = req.query;
        this.logger.log(`[PayTech Test] Query data: ${JSON.stringify(data)}`);
      }

      return res.status(HttpStatus.OK).json({
        status: 'success',
        message: 'Test callback received',
        method: req.method,
        contentType: req.headers['content-type'],
        data: data
      });
    } catch (error) {
      this.logger.error(`[PayTech Test] Error: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('health')
  async health() {
    return {
      status: 'healthy',
      service: 'paytech-service',
      developmentMode: process.env.NODE_ENV !== 'production',
      paytechConfigured: !!(process.env.PAYTECH_API_KEY && process.env.PAYTECH_SECRET_KEY)
    };
  }

  // Redirect endpoints for PayTech success/cancel
  @Get('success')
  async paymentSuccessRedirect(@Query('transaction_id') transactionId: string, @Res() res: Response) {
    try {
      const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?transaction_id=${transactionId || ''}`;
      return res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error(`Error redirecting to success page: ${error.message}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/error`);
    }
  }

  @Get('cancel')
  async paymentCancelRedirect(@Query('transaction_id') transactionId: string, @Res() res: Response) {
    try {
      const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel?transaction_id=${transactionId || ''}`;
      return res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error(`Error redirecting to cancel page: ${error.message}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/error`);
    }
  }
}