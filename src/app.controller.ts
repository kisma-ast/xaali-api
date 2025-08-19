import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-bictorys')
  testBictorys(@Body() body: any) {
    const { phoneNumber, amount } = body;
    
    if (!phoneNumber) {
      return { success: false, message: 'Numéro de téléphone requis' };
    }
    
    if (!amount) {
      return { success: false, message: 'Montant requis' };
    }

    // Validation simple
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const isValid = /^[67][0-9]{8}$/.test(cleanPhone) || /^\+221[67][0-9]{8}$/.test(cleanPhone);
    
    if (!isValid) {
      return { success: false, message: 'Format numéro invalide' };
    }

    // Détection provider
    const prefix = cleanPhone.substring(0, 2);
    let provider = 'wave';
    
    if (['77', '78'].includes(prefix)) provider = 'orange_money';
    else if (['70', '75', '76'].includes(prefix)) provider = 'mtn_mobile_money';
    else if (['60', '61'].includes(prefix)) provider = 'moov_money';

    const formattedPhone = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;

    return {
      success: true,
      data: {
        phoneNumber: formattedPhone,
        provider,
        amount,
        message: 'Validation réussie'
      }
    };
  }
}
