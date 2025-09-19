import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { PayTechService } from './paytech.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject(PayTechService) private readonly payTechService: PayTechService
  ) {}

  @Get()
  findAll(): Promise<Payment[]> {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payment | null> {
    return this.paymentsService.findOne(Number(id));
  }

  @Post()
  create(@Body() payment: Partial<Payment>): Promise<Payment> {
    return this.paymentsService.create(payment);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payment: Partial<Payment>): Promise<Payment | null> {
    return this.paymentsService.update(Number(id), payment);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.paymentsService.remove(Number(id));
  }

  @Post('bictorys/initiate')
  async initiateBictorysPayment(@Body() body: { amount: number; phoneNumber: string; provider: string }) {
    const { phoneNumber, amount, provider } = body;
    
    if (!phoneNumber) {
      return { success: false, message: 'Numéro de téléphone requis' };
    }
    
    if (!amount || amount <= 0) {
      return { success: false, message: 'Montant invalide' };
    }

    if (!provider) {
      return { success: false, message: 'Opérateur requis' };
    }

    // Validation simple du numéro
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const isValid = /^[67][0-9]{8}$/.test(cleanPhone);
    
    if (!isValid) {
      return { success: false, message: 'Format invalide. Ex: 771234567' };
    }

    const formattedPhone = `+221${cleanPhone}`;

    return {
      success: true,
      data: {
        transactionId: `TXN_${Date.now()}`,
        phoneNumber: formattedPhone,
        provider,
        amount,
        status: 'pending',
        reference: `XAALI_${Date.now()}`,
        message: 'Paiement initié avec succès'
      }
    };
  }

  @Get('bictorys/providers')
  getBictorysProviders() {
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

  @Post('paytech/initiate')
  async initiatePayTechPayment(@Body() body: { 
    amount: number; 
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    description: string;
    commandeId?: number 
  }) {
    const { amount, currency, customerEmail, customerName, description, commandeId } = body;
    
    if (!amount || amount <= 0) {
      return { success: false, message: 'Montant invalide' };
    }

    if (!description) {
      return { success: false, message: 'Description requise' };
    }

    // Generate a unique reference
    const reference = this.payTechService.generateReference('XAALI');
    
    // Create payment request
    const paymentRequest = {
      amount,
      currency: currency || 'XOF',
      customerEmail,
      customerName,
      description,
      reference,
      commandeId
    };

    // Initiate payment with PayTech
    const result = await this.payTechService.initiatePayment(paymentRequest);
    
    if (result.success) {
      // Create payment record in our database
      const paymentRecord = await this.paymentsService.createFromPayTech({
        ...result,
        amount,
        currency: currency || 'XOF',
        description,
        commandeId
      });
      
      return {
        success: true,
        data: {
          ...result,
          paymentId: paymentRecord.id
        }
      };
    }
    
    return result;
  }

  @Get('paytech/providers')
  getPayTechProviders() {
    return {
      success: true,
      data: [
        {
          id: 'paytech',
          name: 'PayTech',
          logo: '💳',
          description: 'Paiement par carte via PayTech'
        }
      ]
    };
  }
} 