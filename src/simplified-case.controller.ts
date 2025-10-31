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

  @Get('all')
  async getAllCases() {
    try {
      const cases = await this.simplifiedCaseService.getAllCases();
      return {
        success: true,
        cases,
        total: cases.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('test-create')
  async testCreate() {
    try {
      const testData = {
        question: "Test de création de dossier",
        aiResponse: "Réponse de test",
        category: "test",
        citizenName: "Test User",
        citizenPhone: "+221701234567",
        citizenEmail: "test@example.com",
        paymentAmount: 10000
      };
      
      const result = await this.simplifiedCaseService.createSimplifiedCase(testData);
      return {
        success: true,
        message: "Dossier de test créé",
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.stack
      };
    }
  }
}