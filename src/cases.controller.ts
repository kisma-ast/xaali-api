import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { LawyerNotification } from './lawyer-notification.entity';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { normalizePhoneNumber } from './utils/phone.utils';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) { }

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

  @Get('by-phone/:phoneNumber')
  async findByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    try {
      console.log('🔍 Recherche dossier par téléphone:', phoneNumber);

      // Chercher le dossier le plus récent avec ce numéro de téléphone
      const case_ = await this.casesService.findByPhoneNumber(phoneNumber);

      if (!case_) {
        return {
          success: false,
          message: 'Aucun dossier trouvé pour ce numéro de téléphone'
        };
      }

      // Vérifier que le dossier est payé
      if (!case_.isPaid) {
        return {
          success: false,
          message: 'Ce dossier n\'est pas encore payé'
        };
      }

      console.log('✅ Dossier trouvé:', case_.trackingCode);

      return {
        success: true,
        case: {
          id: case_.id,
          trackingCode: case_.trackingCode,
          trackingToken: case_.trackingToken,
          clientName: case_.citizenName,
          clientPhone: case_.citizenPhone,
          clientEmail: case_.citizenEmail,
          problemCategory: case_.category,
          clientQuestion: case_.clientQuestion || case_.description,
          aiResponse: case_.aiResponse,
          status: case_.status,
          isPaid: case_.isPaid,
          createdAt: case_.createdAt,
          paymentAmount: case_.paymentAmount,
          firstQuestion: case_.firstQuestion,
          firstResponse: case_.firstResponse,
          secondQuestion: case_.secondQuestion,
          secondResponse: case_.secondResponse,
          thirdQuestion: case_.thirdQuestion,
          thirdResponse: case_.thirdResponse,
          lawyerName: case_.lawyerName
        }
      };
    } catch (error) {
      console.error('❌ Erreur recherche par téléphone:', error);
      return {
        success: false,
        message: 'Erreur lors de la recherche'
      };
    }
  }

  @Get('tracking-code/:trackingCode')
  async findByTrackingCode(@Param('trackingCode') trackingCode: string) {
    try {
      const case_ = await this.casesService.findByTrackingCode(trackingCode);
      if (!case_) {
        return {
          success: false,
          message: 'Dossier introuvable'
        };
      }

      // Construire les follow-up questions et answers
      const followUpQuestions: string[] = [];
      const followUpAnswers: string[] = [];

      if (case_.firstQuestion) {
        followUpQuestions.push(case_.firstQuestion);
        if (case_.firstResponse) followUpAnswers.push(case_.firstResponse);
      }
      if (case_.secondQuestion) {
        followUpQuestions.push(case_.secondQuestion);
        if (case_.secondResponse) followUpAnswers.push(case_.secondResponse);
      }
      if (case_.thirdQuestion) {
        followUpQuestions.push(case_.thirdQuestion);
        if (case_.thirdResponse) followUpAnswers.push(case_.thirdResponse);
      }

      return {
        success: true,
        case: {
          id: case_.id,
          trackingCode: case_.trackingCode,
          trackingToken: case_.trackingToken,
          trackingLink: `${process.env.FRONTEND_URL || 'https://xaali.net'}/suivi/${case_.trackingToken}`,
          clientName: case_.citizenName,
          clientPhone: case_.citizenPhone,
          clientEmail: case_.citizenEmail,
          problemCategory: case_.category,
          clientQuestion: case_.clientQuestion || case_.description,
          aiResponse: case_.aiResponse,
          followUpQuestions,
          followUpAnswers,
          status: case_.status,
          isPaid: case_.isPaid,
          createdAt: case_.createdAt,
          paymentAmount: case_.paymentAmount,
          assignedLawyer: case_.lawyerName ? {
            name: case_.lawyerName,
            specialty: case_.category || '',
            phone: ''
          } : undefined
        }
      };
    } catch (error) {
      console.error('Erreur récupération par trackingCode:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du dossier'
      };
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
      // Générer les codes de suivi (OBLIGATOIRES pour cohérence)
      const trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
      const trackingToken = require('crypto').randomUUID();

      console.log('🔑 Identifiants générés:', { trackingCode, trackingToken });

      const caseData = {
        title: this.generateCaseTitle(body.category, body.question),
        description: body.question,
        category: body.category,
        citizenId: body.citizenId || undefined,
        citizenName: body.citizenName || undefined,
        citizenPhone: body.citizenPhone ? normalizePhoneNumber(body.citizenPhone) : undefined,
        status: 'pending',
        urgency: body.urgency || 'normal',
        estimatedTime: body.estimatedTime || 30,
        isPaid: false,
        aiResponse: body.aiResponse,
        clientQuestion: body.question,
        trackingCode: trackingCode,
        trackingToken: trackingToken,
        createdAt: new Date()
      };

      console.log('💾 [CASES] Données à sauvegarder:', JSON.stringify(caseData, null, 2));

      const newCase = await this.casesService.createBeforePayment(caseData);

      console.log('✅ [CASES] Cas créé avec succès:', newCase.id);

      // Notifier les avocats du nouveau cas via NotificationService
      await this.notificationService.notifyNewCase(newCase);

      return {
        success: true,
        case: newCase,
        caseId: newCase.id,
        trackingCode: newCase.trackingCode,
        trackingToken: newCase.trackingToken
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

      // Si le cas est maintenant payé, notifier les avocats via NotificationService
      if (body.isPaid && updatedCase) {
        await this.notificationService.notifyNewCase(updatedCase);
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

  @Post('create-tracking')
  async createTrackingCase(@Body() body: {
    caseId: string;
    citizenPhone: string;
    citizenEmail?: string;
    paymentAmount: number;
  }) {
    try {
      console.log('📋 Création dossier de suivi pour cas:', body.caseId);

      // Récupérer le cas existant
      const existingCase = await this.casesService.findOne(body.caseId);
      if (!existingCase) {
        return {
          success: false,
          message: 'Cas introuvable'
        };
      }

      // Générer les codes de suivi s'ils n'existent pas
      let trackingCode = existingCase.trackingCode;
      let trackingToken = existingCase.trackingToken;

      if (!trackingCode) {
        trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
      }
      if (!trackingToken) {
        trackingToken = require('crypto').randomUUID();
      }

      // Mettre à jour le cas avec les informations de suivi et de paiement
      const updatedCase = await this.casesService.update(body.caseId, {
        trackingCode,
        trackingToken,
        isPaid: true,
        paymentAmount: body.paymentAmount,
        citizenPhone: body.citizenPhone,
        citizenEmail: body.citizenEmail,
        status: 'paid'
      });

      if (!updatedCase) {
        return {
          success: false,
          message: 'Erreur mise à jour du cas'
        };
      }

      const trackingLink = `${process.env.FRONTEND_URL || 'https://xaali.net'}/suivi/${trackingToken}`;

      console.log('✅ Dossier de suivi créé:', {
        caseId: updatedCase.id,
        trackingCode,
        trackingToken
      });

      return {
        success: true,
        trackingCode,
        trackingToken,
        trackingLink,
        case: updatedCase
      };
    } catch (error) {
      console.error('❌ Erreur création dossier de suivi:', error);
      return {
        success: false,
        message: 'Erreur lors de la création du dossier de suivi'
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
}