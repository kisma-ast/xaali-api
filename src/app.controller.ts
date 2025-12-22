import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailService } from './email.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: number; service: string } {
    return {
      status: 'OK',
      timestamp: Date.now(),
      service: 'Xaali Backend API'
    };
  }

  @Get('test-email')
  async testEmail() {
    try {
      const result = await this.emailService.sendTrackingNotification(
        'kismatandia0@gmail.com',
        'XA-TEST-' + Date.now(),
        'https://xaali.net/suivi/test',
        10000
      );
      return {
        success: true,
        message: 'Email de test envoyé',
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
}
