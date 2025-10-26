import { Controller, Post, Get, Body, Param, Query, Req, Res, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { PayTechService } from './paytech.service';
import { NotificationService } from './notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Consultation } from './consultation.entity';
import { Request, Response } from 'express';

@Controller('paytech')
export class PayTechController {
  private readonly logger = new Logger(PayTechController.name);

  constructor(
    private readonly payTechService: PayTechService,
    private readonly notificationService: NotificationService,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
  ) {}

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
        // Stocker l'association payment reference -> case ID pour le callback
        await this.storeCasePaymentMapping(reference, body.caseId);
        this.logger.log(`Association créée: ${reference} -> ${body.caseId}`);
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
      
      const aiResponses: { [key: string]: string } = {
        'divorce': 'Selon l\'article 229 du Code civil, le divorce peut être prononcé en cas de rupture irrémédiable du lien conjugal. Je recommande de rassembler tous les documents relatifs aux biens communs et de privilégier une procédure amiable si possible.',
        'succession': 'D\'après les articles 720 et suivants du Code civil, la succession s\'ouvre au lieu du dernier domicile du défunt. Il est essentiel d\'établir un inventaire des biens et de vérifier l\'existence d\'un testament.',
        'contrat': 'L\'article 1134 du Code civil stipule que les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites. En cas de non-respect, vous pouvez demander l\'exécution forcée ou des dommages-intérêts.',
        'consultation-generale': 'Après analyse de votre situation, plusieurs options s\'offrent à vous selon le droit applicable. Je recommande une approche progressive en privilégiant d\'abord les solutions amiables avant d\'envisager une procédure judiciaire.'
      };
      
      const explicitTitle = categoryTitles[paymentData.caseCategory] || 'Consultation juridique spécialisée';
      const aiResponse = aiResponses[paymentData.caseCategory] || aiResponses['consultation-generale'];
      
      const newCase = this.caseRepository.create({
        title: explicitTitle,
        description: paymentData.caseDescription,
        category: paymentData.caseCategory,
        citizenName: paymentData.customerName,
        citizenPhone: paymentData.customerPhone,
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
        // Mettre à jour avec les vraies infos PayTech si elles sont meilleures
        if (customerInfo.name && customerInfo.name !== 'Client PayTech') {
          existingCase.citizenName = customerInfo.name;
        }
        if (customerInfo.phone && customerInfo.phone !== '+221 77 000 00 00') {
          existingCase.citizenPhone = customerInfo.phone;
        }
        if (customerInfo.email) {
          existingCase.citizenEmail = customerInfo.email;
        }
        
        await this.caseRepository.save(existingCase);
        this.logger.log(`✅ Infos client mises à jour pour le cas: ${existingCase.id}`);
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

      // 2. Si pas trouvé, essayer de trouver par reference
      if (!existingCase) {
        const caseId = await this.getCaseIdFromPaymentReference(transactionId);
        if (caseId) {
          existingCase = await this.caseRepository.findOne({
            where: { _id: caseId as any }
          });
        }
      }

      // 3. Si un cas existe, mettre à jour son statut de paiement
      if (existingCase) {
        this.logger.log(`Cas trouvé pour transaction ${transactionId}: ${existingCase.id}`);
        
        // Mettre à jour le statut de paiement
        existingCase.paymentId = transactionId;
        existingCase.isPaid = true;
        existingCase.paymentAmount = callbackData.amount || existingCase.paymentAmount || 10000;
        
        await this.caseRepository.save(existingCase);
        this.logger.log(`Statut de paiement mis à jour pour le cas: ${existingCase.id}`);
        
        // Notifier les avocats du cas payé
        await this.notificationService.notifyNewCase(existingCase);
      } else {
        this.logger.log(`Aucun cas trouvé pour transaction ${transactionId}, création d'un nouveau cas`);
        
        // Créer un nouveau cas avec les informations PayTech
        await this.createCaseAfterPayment({
          paymentReference: transactionId,
          customerName: callbackData.customer_name || callbackData.client_name || 'Client PayTech',
          customerPhone: callbackData.customer_phone || callbackData.client_phone || '+221 77 000 00 00',
          customerEmail: callbackData.customer_email || callbackData.client_email,
          caseTitle: 'Consultation juridique payée',
          caseDescription: callbackData.description || 'Question juridique non spécifiée',
          caseCategory: callbackData.category || 'consultation-generale',
          amount: callbackData.amount || 10000
        });
      }
    } catch (error) {
      this.logger.error(`Erreur traitement paiement réussi: ${error.message}`);
    }
  }
}