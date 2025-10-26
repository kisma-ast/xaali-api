import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SimplifiedCaseService } from './simplified-case.service';

@Controller('cases')
export class SimplifiedCaseController {
  constructor(private readonly simplifiedCaseService: SimplifiedCaseService) {}

  @Post('create-tracking-simplified')
  async createTrackingSimplified(@Body() createData: {
    question: string;
    aiResponse: string;
    category: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    paymentAmount: number;
  }) {
    try {
      const result = await this.simplifiedCaseService.createSimplifiedCase(createData);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('track/:token')
  async trackCase(@Param('token') token: string) {
    try {
      const caseData = await this.simplifiedCaseService.getCaseByToken(token);
      return {
        success: true,
        case: caseData
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}