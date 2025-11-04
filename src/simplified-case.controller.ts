import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
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
    existingCaseId?: string;
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

  @Get(':caseId')
  async getCaseById(@Param('caseId') caseId: string) {
    try {
      const caseData = await this.simplifiedCaseService.getCaseById(caseId);
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

  @Post('create-with-tracking')
  async createCaseWithTracking(@Body() createData: {
    citizenId?: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    question: string;
    aiResponse?: string;
    category: string;
    urgency?: string;
    estimatedTime?: number;
    generateTracking: boolean;
  }) {
    try {
      // Créer un cas avec codes de suivi immédiatement
      const result = await this.simplifiedCaseService.createCaseWithTracking({
        question: createData.question,
        aiResponse: createData.aiResponse || 'Réponse en cours de génération...',
        category: createData.category,
        citizenName: createData.citizenName,
        citizenPhone: createData.citizenPhone,
        citizenEmail: createData.citizenEmail,
        paymentAmount: 0, // Pas encore payé
        isPaid: false
      });
      
      return {
        success: true,
        caseId: result.caseId,
        trackingCode: result.trackingCode,
        trackingToken: result.trackingToken,
        trackingLink: result.trackingLink
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

  @Get('pending-paid')
  async getPendingPaidCases() {
    try {
      const cases = await this.simplifiedCaseService.getPendingPaidCases();
      return {
        success: true,
        cases
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('accepted-by-lawyer')
  async getAcceptedCases() {
    try {
      const cases = await this.simplifiedCaseService.getAcceptedCases();
      return {
        success: true,
        cases
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('accept/:caseId')
  async acceptCase(@Param('caseId') caseId: string, @Body() acceptData: {
    lawyerId: string;
    lawyerName: string;
  }) {
    try {
      await this.simplifiedCaseService.acceptCase(caseId, acceptData.lawyerId, acceptData.lawyerName);
      return {
        success: true,
        message: 'Cas accepté avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('tracking/history')
  async getTrackingHistory() {
    try {
      const history = await this.simplifiedCaseService.getTrackingHistory();
      return {
        success: true,
        message: `${history.length} codes de suivi générés et sauvegardés`,
        history,
        total: history.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('tracking/verify/:trackingCode')
  async verifyTrackingCode(@Param('trackingCode') trackingCode: string) {
    try {
      const caseData = await this.simplifiedCaseService.findByTrackingCode(trackingCode);
      return {
        success: true,
        message: `Code ${trackingCode} vérifié - Traçabilité confirmée`,
        case: caseData
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('tracking/fix-missing')
  async fixMissingTrackingCodes() {
    try {
      const result = await this.simplifiedCaseService.fixMissingTrackingCodes();
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

  @Delete('cleanup/unpaid')
  async cleanupUnpaidCases() {
    try {
      const result = await this.simplifiedCaseService.cleanupUnpaidCases();
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
}