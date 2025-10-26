import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { LawyerNotification } from './lawyer-notification.entity';
import { EmailService } from './email.service';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly emailService: EmailService
  ) {}

  @Get()
  findAll(): Promise<Case[]> {
    return this.casesService.findAll();
  }

  @Get('pending')
  async getPendingCases() {
    try {
      const cases = await this.casesService.getPendingCases();
      console.log('📋 Cas pending récupérés:', cases.length);
      return cases;
    } catch (error) {
      console.error('❌ Erreur getPendingCases:', error);
      return [];
    }
  }

  @Get('test')
  async testCases() {
    try {
      const allCases = await this.casesService.findAll();
      console.log('📋 Tous les cas:', allCases.length);
      return {
        total: allCases.length,
        cases: allCases
      };
    } catch (error) {
      console.error('❌ Erreur test cases:', error);
      return { error: error.message };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Case | null> {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() caseData: Partial<Case>): Promise<Case> {
    return this.casesService.create(caseData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() caseData: Partial<Case>): Promise<Case | null> {
    return this.casesService.update(id, caseData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.casesService.remove(id);
  }

  @Get('lawyer/:lawyerId')
  getCasesByLawyer(@Param('lawyerId') lawyerId: string): Promise<Case[]> {
    return this.casesService.getCasesByLawyer(lawyerId);
  }

  @Post('accept/:id')
  async acceptCase(@Param('id') id: string, @Body() body: { lawyerId: string }) {
    try {
      const acceptedCase = await this.casesService.assignLawyer(id, body.lawyerId);
      return {
        success: true,
        case: acceptedCase
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'acceptation du cas'
      };
    }
  }

  @Post('create-before-payment')
  async createCaseBeforePayment(@Body() body: {
    citizenId?: string;
    citizenName?: string;
    citizenPhone?: string;
    citizenEmail?: string;
    question: string;
    aiResponse?: string;
    category: string;
    urgency?: string;
    estimatedTime?: number;
  }) {
    console.log('🆕 [CASES] Création cas avant paiement');
    console.log('📋 [CASES] Données reçues:', JSON.stringify(body, null, 2));
    
    try {
      const caseData = {
        title: this.generateCaseTitle(body.category, body.question),
        description: body.question,
        category: body.category,
        citizenId: body.citizenId || undefined,
        citizenName: body.citizenName || undefined,
        citizenPhone: body.citizenPhone || undefined,
        status: 'pending',
        urgency: body.urgency || 'normal',
        estimatedTime: body.estimatedTime || 30,
        isPaid: false,
        aiResponse: body.aiResponse,
        clientQuestion: body.question,
        createdAt: new Date()
      };
      
      console.log('💾 [CASES] Données à sauvegarder:', JSON.stringify(caseData, null, 2));
      
      const newCase = await this.casesService.createBeforePayment(caseData);
      
      console.log('✅ [CASES] Cas créé avec succès:', newCase.id);
      
      // Notifier les avocats du nouveau cas
      await this.emailService.sendNewCaseNotificationToLawyers(newCase);
      
      return {
        success: true,
        case: newCase,
        caseId: newCase.id
      };
    } catch (error) {
      console.error('Erreur création cas avant paiement:', error);
      return {
        success: false,
        message: 'Erreur lors de la création du cas'
      };
    }
  }

  @Post('update-payment/:id')
  async updateCasePayment(@Param('id') id: string, @Body() body: {
    paymentId: string;
    paymentAmount: number;
    isPaid: boolean;
  }) {
    try {
      const updatedCase = await this.casesService.updatePaymentStatus(id, {
        paymentId: body.paymentId,
        paymentAmount: body.paymentAmount,
        isPaid: body.isPaid
      });
      
      // Si le cas est maintenant payé, notifier les avocats
      if (body.isPaid && updatedCase) {
        await this.emailService.sendNewCaseNotificationToLawyers(updatedCase);
      }
      
      return {
        success: true,
        case: updatedCase
      };
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du paiement'
      };
    }
  }

  @Post('save-client-info')
  async saveClientInfo(
    @Body() clientData: {
      customerPhone: string;
      customerEmail?: string;
      customerName: string;
      question: string;
      aiResponse: string;
      category: string;
      amount: number;
    }
  ) {
    try {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Sauvegarder les informations client
      console.log('💾 Sauvegarde informations client:', {
        clientId,
        phone: clientData.customerPhone,
        email: clientData.customerEmail,
        name: clientData.customerName,
        question: clientData.question.substring(0, 100) + '...',
        category: clientData.category,
        amount: clientData.amount
      });
      
      return {
        success: true,
        clientId: clientId,
        message: 'Informations client sauvegardées'
      };
    } catch (error) {
      console.error('❌ Erreur sauvegarde client:', error);
      return {
        success: false,
        message: 'Erreur lors de la sauvegarde'
      };
    }
  }

  private generateCaseTitle(category: string, question: string): string {
    const categoryTitles: { [key: string]: string } = {
      'divorce': 'Procédure de divorce et séparation',
      'succession': 'Règlement de succession familiale',
      'contrat': 'Litige contractuel commercial',
      'travail': 'Conflit de droit du travail',
      'foncier': 'Problème de droit foncier',
      'famille': 'Affaire de droit de la famille',
      'commercial': 'Litige commercial et affaires',
      'penal': 'Affaire de droit pénal',
      'civil': 'Litige de droit civil',
      'consultation-generale': 'Consultation juridique générale'
    };
    
    return categoryTitles[category] || 'Consultation juridique';
  }

  // Endpoints temporairement désactivés
  // @Get('lawyer/:lawyerId/notifications')
  // getLawyerNotifications(@Param('lawyerId') lawyerId: string): Promise<LawyerNotification[]> {
  //   return [];
  // }

  // @Post('notifications/:notificationId/read')
  // markNotificationAsRead(@Param('notificationId') notificationId: string): Promise<void> {
  //   return Promise.resolve();
  // }

  // @Post('notifications/:notificationId/accept')
  // acceptCase(
  //   @Param('notificationId') notificationId: string,
  //   @Body() body: { lawyerId: string },
  // ): Promise<Case> {
  //   return this.casesService.assignLawyer(caseId, body.lawyerId);
  // }
} 