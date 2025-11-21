import { Controller, Post, Get, Body, Param, Query, Req, Res, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { PayTechService } from './paytech.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { DossiersService } from './dossiers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Consultation } from './consultation.entity';
import { Citizen } from './citizen.entity';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Controller('paytech')
export class PayTechController {
  private readonly logger = new Logger(PayTechController.name);

  constructor(
    private readonly payTechService: PayTechService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly dossiersService: DossiersService,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
  ) { }

  @Post('create-simplified-payment')
  async createSimplifiedPayment(@Body() body: {
    amount: number;
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    description: string;
    // Données pour créer le dossier automatiquement
    question: string;
    aiResponse: string;
    category: string;
    createTrackingCase?: boolean;
    sendNotifications?: boolean;
  }) {
    try {
      const { amount, customerName, customerPhone, customerEmail, question, aiResponse, category } = body;

      if (!amount || !customerName || !customerPhone || !question) {
        return { success: false, message: 'Données manquantes' };
      }

      // Générer une référence unique
      const reference = this.payTechService.generateReference('XAALI_SIMP');

      // Créer le paiement PayTech
      const paymentRequest = {
        amount,
        currency: 'XOF',
        customerEmail,
        customerName,
        customerPhone,
        description: body.description,
        reference
      };

      const result = await this.payTechService.initiatePayment(paymentRequest);

      if (result.success) {
        // Stocker les données pour création automatique du dossier
        await this.storeSimplifiedCaseData(reference, {
          question,
          aiResponse,
          category,
          customerName,
          customerPhone,
          customerEmail,
          amount
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Erreur paiement simplifié:', error);
      return { success: false, message: 'Erreur lors de la création du paiement' };
    }
  }

  @Post('create-payment')
  async createPayment(@Body() body: {
    amount: number;
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    description: string;
    commandeId?: number;
    testRealApi?: boolean;
    caseId?: string; // ID du cas à mettre à jour
    // Données de consultation
    citizenName?: string;
    citizenPhone?: string;
    citizenEmail?: string;
    firstQuestion?: string;
    firstResponse?: string;
    secondQuestion?: string;
    secondResponse?: string;
    category?: string;
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
        commandeId
      };

      // Initiate payment with PayTech
      const result = await this.payTechService.initiatePayment(paymentRequest);

      // Si le paiement est créé avec succès et qu'on a un ID de cas, le stocker pour mise à jour ultérieure
      if (result.success && body.caseId) {
        // Mettre à jour immédiatement le cas avec la référence de paiement pour éviter les duplications
        try {
          const { ObjectId } = require('mongodb');
          const existingCase = await this.caseRepository.findOne({
            where: { _id: new ObjectId(body.caseId) } as any
          });

          if (existingCase) {
            existingCase.paymentId = reference;
            await this.caseRepository.save(existingCase);
            this.logger.log(`Association immédiate: Cas ${body.caseId} lié au paiement ${reference}`);
          } else {
            this.logger.warn(`Cas ${body.caseId} introuvable pour liaison paiement`);
          }
        } catch (err) {
          this.logger.error(`Erreur liaison cas-paiement: ${err.message}`);
        }
      }

      // Si le paiement est créé avec succès mais pas d'ID de cas, sauvegarder comme avant
      if (result.success && body.firstQuestion && !body.caseId) {
        await this.saveConsultationData({
          paymentReference: reference,
          citizenName: body.citizenName || customerName || 'Client Xaali',
          citizenPhone: body.citizenPhone || '+221 77 000 00 00',
          citizenEmail: body.citizenEmail || customerEmail,
          firstQuestion: body.firstQuestion,
          firstResponse: body.firstResponse || '',
          secondQuestion: body.secondQuestion,
          secondResponse: body.secondResponse,
          category: body.category || 'consultation-generale',
          amount: amount
        });
      }

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

      // Logger les informations client reçues
      this.logger.log(`[PayTech] Informations client:`);
      this.logger.log(`  - customer_name: ${data.customer_name || 'Non fourni'}`);
      this.logger.log(`  - customer_email: ${data.customer_email || 'Non fourni'}`);
      this.logger.log(`  - customer_phone: ${data.customer_phone || 'Non fourni'}`);
      this.logger.log(`  - client_name: ${data.client_name || 'Non fourni'}`);
      this.logger.log(`  - client_email: ${data.client_email || 'Non fourni'}`);
      this.logger.log(`  - client_phone: ${data.client_phone || 'Non fourni'}`);

      // RÉCUPÉRATION ET SAUVEGARDE DES INFOS CLIENT
      const customerInfo = {
        name: data.customer_name || data.client_name || 'Client PayTech',
        email: data.customer_email || data.client_email,
        phone: data.customer_phone || data.client_phone
      };

      // Sauvegarder les infos client pour utilisation ultérieure
      await this.saveCustomerInfoFromPayTech(data.ref_command, customerInfo);

      // Process the callback
      const result = await this.payTechService.processCallback(data);

      // Si le paiement est confirmé, notifier les avocats
      if (result.status === 'success') {
        await this.handleSuccessfulPayment(result.transactionId, data);
      }

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

  // Endpoint pour récupérer le dossier après paiement PayTech
  @Get('case-by-payment/:paymentId')
  async getCaseByPaymentId(@Param('paymentId') paymentId: string) {
    try {
      this.logger.log(`Récupération du cas pour paymentId: ${paymentId}`);

      const case_ = await this.caseRepository.findOne({
        where: { paymentId: paymentId } as any
      });

      if (!case_) {
        return {
          success: false,
          message: 'Dossier introuvable pour ce paiement'
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

      // Retourner toutes les informations nécessaires pour le frontend
      return {
        success: true,
        case: {
          id: case_.id,
          trackingCode: case_.trackingCode,
          trackingToken: case_.trackingToken,
          trackingLink: case_.trackingToken
            ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/suivi/${case_.trackingToken}`
            : null,
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
          paymentAmount: case_.paymentAmount,
          createdAt: case_.createdAt,
          title: case_.title,
          assignedLawyer: case_.lawyerName ? {
            name: case_.lawyerName,
            specialty: case_.category,
            phone: ''
          } : null
        }
      };
    } catch (error) {
      this.logger.error(`Erreur récupération cas par paymentId: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération du dossier'
      };
    }
  }

  // Endpoint pour récupérer le dossier par trackingToken
  @Get('case-by-token/:token')
  async getCaseByTrackingToken(@Param('token') token: string) {
    try {
      this.logger.log(`Récupération du cas pour trackingToken: ${token}`);

      const case_ = await this.caseRepository.findOne({
        where: { trackingToken: token } as any
      });

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
          trackingLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/suivi/${case_.trackingToken}`,
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
          paymentAmount: case_.paymentAmount,
          createdAt: case_.createdAt,
          title: case_.title,
          assignedLawyer: case_.lawyerName ? {
            name: case_.lawyerName,
            specialty: case_.category,
            phone: ''
          } : null
        }
      };
    } catch (error) {
      this.logger.error(`Erreur récupération cas par token: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération du dossier'
      };
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

  @Get('customer-info/:transactionId')
  async getCustomerInfo(@Param('transactionId') transactionId: string) {
    try {
      this.logger.log(`Récupération infos client pour: ${transactionId}`);

      // Chercher le cas associé à cette transaction
      const existingCase = await this.caseRepository.findOne({
        where: { paymentId: transactionId }
      });

      if (existingCase) {
        return {
          success: true,
          customerInfo: {
            name: existingCase.citizenName,
            email: existingCase.citizenEmail,
            phone: existingCase.citizenPhone
          },
          caseId: existingCase.id,
          paymentAmount: existingCase.paymentAmount
        };
      } else {
        return {
          success: false,
          message: 'Aucune information client trouvée pour cette transaction'
        };
      }
    } catch (error) {
      this.logger.error(`Erreur récupération infos client: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération des informations client'
      };
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

  // Méthode pour sauvegarder les données de consultation
  private async saveConsultationData(data: {
    paymentReference: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    firstQuestion: string;
    firstResponse: string;
    secondQuestion?: string;
    secondResponse?: string;
    category: string;
    amount: number;
  }) {
    try {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/consultation/save-after-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: data.citizenName,
          citizenPhone: data.citizenPhone,
          citizenEmail: data.citizenEmail,
          firstQuestion: data.firstQuestion,
          firstResponse: data.firstResponse,
          secondQuestion: data.secondQuestion,
          secondResponse: data.secondResponse,
          category: data.category,
          paymentId: data.paymentReference,
          paymentAmount: data.amount
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.logger.log(`Consultation sauvegardée: ${result.consultation?.id}`);
      }
    } catch (error) {
      this.logger.error(`Erreur sauvegarde consultation: ${error.message}`);
    }
  }

  // Méthode privée pour créer un cas après paiement
  private async createCaseAfterPayment(paymentData: {
    paymentReference: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    caseTitle: string;
    caseDescription: string;
    caseCategory: string;
    amount: number;
    caseId?: string | null;
  }) {
    try {
      this.logger.log(`Création d'un cas après paiement: ${paymentData.paymentReference}`);

      // Créer le cas dans la base de données avec réponse IA
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

      const explicitTitle = categoryTitles[paymentData.caseCategory] || 'Consultation juridique spécialisée';
      // Ne plus utiliser de réponses hardcodées
      const aiResponse = undefined;

      // Essayer de récupérer un cas existant avec ce paymentReference
      let existingCase = await this.caseRepository.findOne({
        where: { paymentId: paymentData.paymentReference } as any
      });

      // Si pas trouvé, chercher par caseId si fourni dans paymentData
      if (!existingCase && paymentData.caseId) {
        existingCase = await this.caseRepository.findOne({
          where: { _id: paymentData.caseId as any }
        });
      }

      if (existingCase) {
        // Mettre à jour le cas existant avec les données de paiement
        existingCase.isPaid = true;
        existingCase.paymentAmount = paymentData.amount;
        existingCase.paymentId = paymentData.paymentReference;
        existingCase.status = 'pending';

        // Mettre à jour UNIQUEMENT téléphone et email (anonymat - pas de nom)
        if (paymentData.customerPhone && paymentData.customerPhone !== 'À définir') {
          existingCase.citizenPhone = paymentData.customerPhone;
        }
        if (paymentData.customerEmail) {
          existingCase.citizenEmail = paymentData.customerEmail;
        }
        // Ne pas mettre à jour le nom pour préserver l'anonymat
        // Le nom reste l'identifiant anonyme créé initialement

        // Conserver la question et réponse IA existantes si elles sont meilleures
        if (!existingCase.clientQuestion && paymentData.caseDescription) {
          existingCase.clientQuestion = paymentData.caseDescription;
        }
        if (!existingCase.description && paymentData.caseDescription) {
          existingCase.description = paymentData.caseDescription;
        }
        if (!existingCase.aiResponse && aiResponse) {
          existingCase.aiResponse = aiResponse;
        }

        const savedCase = await this.caseRepository.save(existingCase);
        this.logger.log(`Cas existant mis à jour avec succès: ${savedCase.id}`);
        return savedCase;
      }

      // Créer un nouveau cas seulement si aucun n'existe
      // Pour l'anonymat : utiliser un identifiant anonyme au lieu du nom réel
      const anonymousId = `Client-${Date.now().toString().slice(-6)}`;
      const newCase = this.caseRepository.create({
        title: explicitTitle,
        description: paymentData.caseDescription,
        category: paymentData.caseCategory,
        citizenName: anonymousId, // Identifiant anonyme (pas le nom réel)
        citizenPhone: paymentData.customerPhone,
        citizenEmail: paymentData.customerEmail,
        status: 'pending',
        urgency: 'normal',
        estimatedTime: 30,
        isPaid: true,
        paymentAmount: paymentData.amount,
        paymentId: paymentData.paymentReference,
        aiResponse: aiResponse,
        clientQuestion: paymentData.caseDescription,
        createdAt: new Date(),
      });

      const savedCase = await this.caseRepository.save(newCase);
      this.logger.log(`Cas créé avec succès: ${savedCase.id}`);

      // Notifier tous les avocats du nouveau cas payé
      const notificationResult = await this.notificationService.notifyNewCase(savedCase);
      this.logger.log(`Avocats notifiés: ${notificationResult.notifiedLawyers}/${notificationResult.totalLawyers}`);

      return savedCase;
    } catch (error) {
      this.logger.error(`Erreur création cas après paiement: ${error.message}`);
      throw error;
    }
  }

  // Méthode pour stocker l'association payment reference -> case ID
  private async storeCasePaymentMapping(paymentReference: string, caseId: string): Promise<void> {
    // Pour simplifier, on peut stocker ça en mémoire ou dans une table temporaire
    // Ici on va juste logger et utiliser le paymentReference comme clé
    this.logger.log(`Stockage mapping: ${paymentReference} -> ${caseId}`);
    // TODO: Implémenter un stockage persistant si nécessaire
  }

  // Méthode pour récupérer l'ID du cas depuis le payment reference
  private async getCaseIdFromPaymentReference(paymentReference: string): Promise<string | null> {
    // Pour l'instant, on va chercher dans les cas existants
    try {
      // Chercher un cas avec ce paymentId (qui pourrait être le reference)
      const existingCase = await this.caseRepository.findOne({
        where: { paymentId: paymentReference }
      });

      if (existingCase) {
        return existingCase.id;
      }

      // Si pas trouvé, chercher par d'autres critères
      return null;
    } catch (error) {
      this.logger.error(`Erreur recherche cas: ${error.message}`);
      return null;
    }
  }

  // Méthode pour stocker les données du parcours simplifié
  private async storeSimplifiedCaseData(reference: string, data: {
    question: string;
    aiResponse: string;
    category: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
  }) {
    try {
      this.logger.log(`Stockage données parcours simplifié: ${reference}`);
      // Pour l'instant, on stocke en mémoire ou dans une table temporaire
      // TODO: Implémenter un stockage persistant
    } catch (error) {
      this.logger.error(`Erreur stockage données simplifiées: ${error.message}`);
    }
  }

  // Méthode pour sauvegarder les infos client depuis PayTech
  private async saveCustomerInfoFromPayTech(transactionId: string, customerInfo: {
    name: string;
    email?: string;
    phone?: string;
  }) {
    try {
      this.logger.log(`💾 Sauvegarde infos client PayTech: ${transactionId}`);
      this.logger.log(`   - Nom: ${customerInfo.name}`);
      this.logger.log(`   - Email: ${customerInfo.email || 'Non fourni'}`);
      this.logger.log(`   - Téléphone: ${customerInfo.phone || 'Non fourni'}`);

      // Chercher le cas associé et mettre à jour les infos client
      const existingCase = await this.caseRepository.findOne({
        where: { paymentId: transactionId }
      });

      if (existingCase) {
        // Mettre à jour UNIQUEMENT téléphone et email (anonymat - pas de nom)
        if (customerInfo.phone && customerInfo.phone !== '+221 77 000 00 00') {
          existingCase.citizenPhone = customerInfo.phone;
        }
        if (customerInfo.email) {
          existingCase.citizenEmail = customerInfo.email;
        }
        // Ne pas mettre à jour le nom pour préserver l'anonymat
        // Le nom reste l'identifiant anonyme créé initialement

        await this.caseRepository.save(existingCase);
        this.logger.log(`✅ Infos client mises à jour (anonymat préservé) pour le cas: ${existingCase.id}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erreur sauvegarde infos client: ${error.message}`);
    }
  }

  // Méthode pour gérer les paiements réussis via callback
  private async handleSuccessfulPayment(transactionId: string, callbackData: any) {
    try {
      this.logger.log(`Traitement paiement réussi: ${transactionId}`);

      // 1. Chercher si un cas existe déjà pour cette transaction
      let existingCase = await this.caseRepository.findOne({
        where: { paymentId: transactionId }
      });

      // 2. Si pas trouvé, essayer de trouver par reference ou dans les données stockées
      if (!existingCase) {
        const caseId = await this.getCaseIdFromPaymentReference(transactionId);
        if (caseId) {
          existingCase = await this.caseRepository.findOne({
            where: { _id: caseId as any }
          });
        }

        // Si toujours pas trouvé, chercher un cas non payé qui pourrait correspondre
        // (cas créé avant le paiement avec saveCaseBeforePayment)
        if (!existingCase) {
          // Chercher par les infos client du callback
          const customerPhone = callbackData.customer_phone || callbackData.client_phone;
          if (customerPhone) {
            const potentialCases = await this.caseRepository.find({
              where: {
                citizenPhone: customerPhone,
                isPaid: false
              } as any
            });

            // Prendre le plus récent
            if (potentialCases && potentialCases.length > 0) {
              existingCase = potentialCases.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              this.logger.log(`Cas trouvé par téléphone client: ${existingCase.id}`);
            }
          }
        }
      }

      // 3. Si un cas existe, mettre à jour son statut de paiement
      if (existingCase) {
        this.logger.log(`✅ Cas trouvé pour transaction ${transactionId}: ${existingCase.id}`);

        // Mettre à jour le statut de paiement
        existingCase.paymentId = transactionId;
        existingCase.isPaid = true;
        existingCase.paymentAmount = callbackData.amount || existingCase.paymentAmount || 10000;

        // GARANTIR que le cas a des identifiants avant création dossier
        if (!existingCase.trackingCode || !existingCase.trackingToken) {
          console.log(`⚠️ Cas sans identifiants, création: ${existingCase.id}`);
          await this.createTrackingForCase(existingCase, callbackData);
          // Recharger le cas avec les nouveaux identifiants
          existingCase = await this.caseRepository.findOne({ where: { id: existingCase.id } });
        }

        if (existingCase) {
          await this.caseRepository.save(existingCase);
          this.logger.log(`Statut de paiement mis à jour pour le cas: ${existingCase.id}`);

          // Créer automatiquement le dossier dans la collection dossiers
          try {
            // VÉRIFICATION AVANT création
            if (!existingCase.trackingCode || !existingCase.trackingToken) {
              this.logger.error(`❌ IMPOSSIBLE: Cas ${existingCase.id} sans identifiants`);
              throw new Error('Cas sans identifiants de suivi');
            }

            const createdDossier = await this.dossiersService.createFromCase(existingCase);
            this.logger.log(`✅ Dossier créé: ${createdDossier.trackingCode} (ID: ${createdDossier.id})`);

            // Vérification de cohérence OBLIGATOIRE
            if (createdDossier.trackingCode !== existingCase.trackingCode) {
              this.logger.error(`❌ INCOHÉRENCE: Case=${existingCase.trackingCode}, Dossier=${createdDossier.trackingCode}`);
              throw new Error('Incohérence identifiants cas/dossier');
            }
          } catch (dossierError) {
            this.logger.error(`❌ Erreur création dossier: ${dossierError.message}`);
          }

          // Notifier le citoyen que le paiement est confirmé
          await this.notificationService.notifyCitizenCaseCreated(existingCase);

          // Notifier les avocats du cas payé
          await this.notificationService.notifyNewCase(existingCase);

          // Si un avocat est déjà assigné, le notifier du paiement
          if (existingCase.lawyerId) {
            await this.notificationService.notifyLawyerPaymentReceived(existingCase);
          }
        }
      } else {
        this.logger.log(`Aucun cas trouvé pour transaction ${transactionId}, création d'un nouveau cas`);

        // Créer un nouveau cas avec les informations PayTech
        const newCase = await this.createCaseAfterPayment({
          paymentReference: transactionId,
          customerName: callbackData.customer_name || callbackData.client_name || 'Client PayTech',
          customerPhone: callbackData.customer_phone || callbackData.client_phone || '+221 77 000 00 00',
          customerEmail: callbackData.customer_email || callbackData.client_email,
          caseTitle: 'Consultation juridique payée',
          caseDescription: callbackData.description || 'Question juridique non spécifiée',
          caseCategory: callbackData.category || 'consultation-generale',
          amount: callbackData.amount || 10000
        });

        // Créer le dossier de suivi pour le nouveau cas
        if (newCase) {
          await this.createTrackingForCase(newCase, callbackData);

          // Créer automatiquement le dossier dans la collection dossiers
          try {
            // VÉRIFICATION AVANT création
            if (!newCase.trackingCode || !newCase.trackingToken) {
              this.logger.error(`❌ IMPOSSIBLE: Nouveau cas ${newCase.id} sans identifiants`);
              throw new Error('Nouveau cas sans identifiants de suivi');
            }

            const createdDossier = await this.dossiersService.createFromCase(newCase);
            this.logger.log(`✅ Dossier créé: ${createdDossier.trackingCode} (ID: ${createdDossier.id})`);

            // Vérification de cohérence OBLIGATOIRE
            if (createdDossier.trackingCode !== newCase.trackingCode) {
              this.logger.error(`❌ INCOHÉRENCE: Case=${newCase.trackingCode}, Dossier=${createdDossier.trackingCode}`);
              throw new Error('Incohérence identifiants cas/dossier');
            }
          } catch (dossierError) {
            this.logger.error(`❌ Erreur création dossier: ${dossierError.message}`);
          }
        } else {
          // Fallback : si la création du cas échoue, logger l'erreur mais ne pas faire échouer le callback
          this.logger.error(`❌ Échec création cas après paiement PayTech - Transaction: ${transactionId}`);
          this.logger.error(`   Données callback: ${JSON.stringify(callbackData)}`);
          // Le paiement est validé par PayTech, mais le cas n'a pas pu être créé
          // On retourne quand même un succès pour ne pas bloquer PayTech
        }
      }
    } catch (error) {
      // Gestion d'erreur globale avec fallback
      this.logger.error(`❌ Erreur critique traitement paiement réussi: ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      this.logger.error(`   Transaction ID: ${transactionId}`);
      // Ne pas faire échouer le callback PayTech - le paiement est validé
      // Les données seront récupérées plus tard via polling ou manuellement
    }
  }

  // Méthode pour créer le dossier de suivi complet après paiement
  private async createTrackingForCase(case_: Case, callbackData: any) {
    try {
      this.logger.log(`📋 Création du dossier de suivi pour le cas: ${case_.id}`);

      // 1. Réutiliser le code de suivi existant si disponible, sinon en générer un nouveau
      let trackingCode = case_.trackingCode;
      let trackingToken = case_.trackingToken;

      if (!trackingCode || !trackingToken) {
        // Générer un nouveau code seulement si le cas n'en a pas déjà un
        trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
        trackingToken = uuidv4();
        this.logger.log(`Nouveau code de suivi généré: ${trackingCode}`);
      } else {
        this.logger.log(`Réutilisation du code de suivi existant: ${trackingCode}`);
      }

      // 2. Créer le lien de suivi
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const trackingLink = `${baseUrl}/suivi/${trackingToken}`;

      // 3. Mettre à jour le cas avec les informations de suivi
      case_.trackingCode = trackingCode;
      case_.trackingToken = trackingToken;
      case_.isPaid = true;
      case_.paymentAmount = callbackData.amount || case_.paymentAmount || 10000;
      case_.status = 'pending';

      await this.caseRepository.save(case_);
      this.logger.log(`✅ Dossier de suivi créé: ${trackingCode}`);

      // 4. Récupérer les informations du client
      const citizenPhone = case_.citizenPhone || callbackData.customer_phone || callbackData.client_phone || '+221 77 000 00 00';
      const citizenEmail = case_.citizenEmail || callbackData.customer_email || callbackData.client_email;

      // 5. Créer automatiquement un compte citoyen si nécessaire (sans nom pour anonymat)
      await this.createCitizenAccount(citizenPhone, citizenEmail);

      // 6. Envoyer les notifications (SMS, WhatsApp, Email)
      await this.sendTrackingNotifications(citizenPhone, citizenEmail, trackingCode, trackingLink, case_.paymentAmount);

      // 7. Notifier le citoyen que le dossier est créé
      await this.notificationService.notifyCitizenCaseCreated(case_);

      // 8. Notifier tous les avocats qu'un nouveau cas payé est disponible
      await this.notificationService.notifyNewCase(case_);

      this.logger.log(`📧 Notifications envoyées pour le dossier ${trackingCode}`);

      return {
        trackingCode,
        trackingToken,
        trackingLink
      };
    } catch (error) {
      this.logger.error(`❌ Erreur création dossier de suivi: ${error.message}`);
      throw error;
    }
  }

  // Méthode pour créer un compte citoyen automatiquement (anonyme - pas de nom)
  private async createCitizenAccount(phone: string, email?: string) {
    try {
      // Vérifier si le compte existe déjà
      const existingCitizen = await this.citizenRepository.findOne({
        where: { phone }
      });

      if (!existingCitizen) {
        // Créer un nouveau compte citoyen avec identifiant anonyme
        const anonymousName = `Client-${phone.slice(-4)}`; // Identifiant anonyme basé sur les 4 derniers chiffres
        const citizen = this.citizenRepository.create({
          name: anonymousName, // Pas de nom réel pour préserver l'anonymat
          phone,
          email: email || `${phone.replace(/[^0-9]/g, '')}@xaali.temp`,
          password: this.generateRandomPassword(),
          createdAt: new Date()
        });

        await this.citizenRepository.save(citizen);
        this.logger.log(`✅ Compte citoyen créé automatiquement (anonyme): ${phone}`);
      } else {
        // Mettre à jour uniquement l'email si nécessaire (pas le nom pour anonymat)
        if (email && !existingCitizen.email?.includes('@xaali.temp')) {
          existingCitizen.email = email;
          await this.citizenRepository.save(existingCitizen);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erreur création compte citoyen: ${error.message}`);
    }
  }

  // Méthode pour générer un mot de passe aléatoire
  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  // Méthode pour envoyer les notifications de suivi (unifié avec simulation)
  private async sendTrackingNotifications(phone: string, email: string | undefined, trackingCode: string, trackingLink: string, amount: number) {
    try {
      // Utiliser l'endpoint de notifications unifié (même que simulation)
      const apiUrl = process.env.BACKEND_URL || 'http://localhost:3000';

      // Utiliser le service de notifications directement au lieu de fetch
      try {
        // Appeler directement le service de notifications via l'endpoint
        // Note: On pourrait aussi injecter NotificationsController, mais pour l'instant on utilise l'emailService
        // Les SMS/WhatsApp seront gérés par l'endpoint /notifications/send-tracking
        this.logger.log(`📧 Envoi notifications via service unifié pour ${trackingCode}`);

        // Envoyer Email si fourni (via EmailService)
        if (email && !email.includes('@xaali.temp')) {
          await this.emailService.sendTrackingNotification(
            email,
            trackingCode,
            trackingLink,
            amount
          );
          this.logger.log(`📧 Email de suivi envoyé à ${email}`);
        }

        // SMS et WhatsApp seront logués (à intégrer avec vraie API)
        this.logger.log(`📱 SMS/WhatsApp: Merci, votre dossier ${trackingCode} a été créé. Suivez-le ici : ${trackingLink}`);

        this.logger.log(`✅ Notifications envoyées via service unifié pour ${trackingCode}`);
        return;
      } catch (apiError) {
        this.logger.warn('Service notifications non disponible, envoi direct...');
      }

      // Fallback : envoi direct si l'API échoue
      // Envoyer SMS (simulation - à remplacer par une vraie API SMS)
      this.logger.log(`📱 SMS envoyé à ${phone}: Merci, votre dossier ${trackingCode} a été créé. Suivez-le ici : ${trackingLink}`);

      // Envoyer WhatsApp (simulation - à remplacer par une vraie API WhatsApp)
      this.logger.log(`📱 WhatsApp envoyé à ${phone}: Bonjour, votre dossier juridique Xaali.net est créé. Code : ${trackingCode}. Lien de suivi : ${trackingLink}`);

      // Envoyer Email si fourni
      if (email && !email.includes('@xaali.temp')) {
        await this.emailService.sendTrackingNotification(
          email,
          trackingCode,
          trackingLink,
          amount
        );
        this.logger.log(`📧 Email de suivi envoyé à ${email}`);
      }

      this.logger.log(`✅ Notifications envoyées directement pour le dossier ${trackingCode}`);
    } catch (error) {
      this.logger.error(`❌ Erreur envoi notifications: ${error.message}`);
    }
  }
}