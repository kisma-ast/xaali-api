import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { NotificationService } from './notification.service';
import { FineTuningService } from './fine-tuning.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';

@Controller('real-auth')
export class RealAuthController {
  private readonly logger = new Logger(RealAuthController.name);

  constructor(
    @InjectRepository(Lawyer)
    private lawyerRepository: Repository<Lawyer>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
    private notificationService: NotificationService,
    private fineTuningService: FineTuningService,
    private emailService: EmailService,
  ) { }

  @Post('register')
  async registerLawyer(@Body() registerDto: any) {
    console.log('🔍 [REAL-AUTH] Tentative d\'inscription avocat');
    console.log('📋 [REAL-AUTH] Données reçues:', JSON.stringify(registerDto, null, 2));

    try {
      const existingLawyer = await this.lawyerRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingLawyer) {
        return { success: false, message: 'Cet email est déjà utilisé' };
      }

      // Utiliser le même salt rounds que auth.service.ts pour cohérence
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);
      console.log(`🔐 [REAL-AUTH] Hashage mot de passe pour ${registerDto.email}:`, {
        original: registerDto.password,
        hashed: hashedPassword,
        saltRounds
      });

      const lawyer = this.lawyerRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        specialty: registerDto.specialty,
        phone: registerDto.phone || '+221 77 000 00 00',
        experience: registerDto.experience || '1 an',
        lawFirm: registerDto.lawFirm || 'Cabinet Indépendant',
        barNumber: `BAR${Date.now()}`,
        isActive: true,
        createdAt: new Date(),
      });

      const savedLawyer = await this.lawyerRepository.save(lawyer);
      const { password, ...lawyerData } = savedLawyer;

      console.log('✅ [REAL-AUTH] Avocat créé avec succès:', savedLawyer.id);
      console.log('📄 [REAL-AUTH] Données sauvegardées:', JSON.stringify(lawyerData, null, 2));

      // Envoyer l'email de bienvenue
      try {
        await this.emailService.sendLawyerWelcomeEmail(savedLawyer.email, savedLawyer.name);
      } catch (emailError) {
        console.error('⚠️ [REAL-AUTH] Erreur envoi email bienvenue:', emailError);
        // Ne pas bloquer l'inscription si l'email échoue
      }

      return {
        success: true,
        lawyer: lawyerData,
        token: `lawyer_${savedLawyer.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur inscription avocat:', error);
      this.logger.error('Erreur inscription avocat:', error);
      return { success: false, message: 'Erreur lors de l\'inscription: ' + error.message };
    }
  }

  @Post('login')
  async loginLawyer(@Body() loginDto: { email: string; password: string }) {
    console.log('🔍 [REAL-AUTH] Tentative de connexion avocat');
    console.log('📧 [REAL-AUTH] Email:', loginDto.email);

    try {
      const lawyer = await this.lawyerRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!lawyer) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      console.log(`🔑 [REAL-AUTH] Vérification mot de passe pour ${loginDto.email}:`, {
        provided: loginDto.password,
        stored: lawyer.password
      });

      const isPasswordValid = await bcrypt.compare(loginDto.password, lawyer.password);
      console.log(`🔑 [REAL-AUTH] Résultat vérification: ${isPasswordValid}`);

      if (!isPasswordValid) {
        console.log(`❌ [REAL-AUTH] Mot de passe incorrect pour: ${loginDto.email}`);
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      console.log(`✅ [REAL-AUTH] Connexion réussie pour: ${loginDto.email}`);

      const { password, ...lawyerData } = lawyer;

      console.log('✅ [REAL-AUTH] Connexion avocat réussie:', lawyer.id);

      return {
        success: true,
        lawyer: lawyerData,
        token: `lawyer_${lawyer.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur connexion avocat:', error);
      this.logger.error('Erreur connexion avocat:', error);
      return { success: false, message: 'Erreur de connexion: ' + error.message };
    }
  }

  @Post('citizen-register')
  async registerCitizen(@Body() registerDto: any) {
    try {
      const existingCitizen = await this.citizenRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingCitizen) {
        return { success: false, message: 'Cet email est déjà utilisé' };
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const citizen = this.citizenRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        phone: registerDto.phone || '+221 77 000 00 00',
        isActive: true,
        createdAt: new Date(),
      });

      const savedCitizen = await this.citizenRepository.save(citizen);
      const { password, ...citizenData } = savedCitizen;

      return {
        success: true,
        citizen: citizenData,
        token: `citizen_${savedCitizen.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur inscription citoyen:', error);
      return { success: false, message: 'Erreur lors de l\'inscription' };
    }
  }

  @Post('citizen-login')
  async loginCitizen(@Body() loginDto: { email: string; password: string }) {
    try {
      const citizen = await this.citizenRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!citizen) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, citizen.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const { password, ...citizenData } = citizen;

      return {
        success: true,
        citizen: citizenData,
        token: `citizen_${citizen.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur connexion citoyen:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  @Post('case-create')
  async createCase(@Body() caseDto: any) {
    console.log('🆕 [REAL-AUTH] Création d\'un nouveau cas');
    console.log('📋 [REAL-AUTH] Données du cas:', JSON.stringify(caseDto, null, 2));

    try {
      const newCase = this.caseRepository.create({
        title: caseDto.title || 'Demande de consultation juridique',
        description: caseDto.description || 'Le client souhaite une consultation juridique.',
        category: caseDto.category || 'consultation-generale',
        citizenId: caseDto.citizenId,
        citizenName: caseDto.citizenName || null,
        citizenPhone: caseDto.citizenPhone || null,
        status: 'pending',
        urgency: caseDto.urgency || 'normal',
        estimatedTime: caseDto.estimatedTime || 30,
        createdAt: new Date(),
      });

      const savedCase = await this.caseRepository.save(newCase);
      console.log('✅ [REAL-AUTH] Cas sauvegardé:', savedCase.id);

      // Notifier tous les avocats actifs via le service de notification
      const notificationResult = await this.notificationService.notifyNewCase(savedCase);
      console.log('📢 [REAL-AUTH] Notification envoyée à', notificationResult.notifiedLawyers, 'avocats');

      this.logger.log(`Nouveau cas créé: ${savedCase.id}`);

      return {
        success: true,
        case: savedCase,
        notificationResult: notificationResult
      };
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur création cas:', error);
      this.logger.error('Erreur création cas:', error);
      return { success: false, message: 'Erreur lors de la création du cas: ' + error.message };
    }
  }

  // Endpoint spécial pour créer un cas après paiement réussi
  @Post('case-create-after-payment')
  async createCaseAfterPayment(@Body() paymentData: any) {
    console.log('💳 [REAL-AUTH] Création de cas après paiement réussi');
    console.log('💰 [REAL-AUTH] Données de paiement:', JSON.stringify(paymentData, null, 2));

    try {
      // Générer un titre intelligent avec l'IA fine-tunée
      const generateAITitle = async (question: string, category: string): Promise<string> => {
        try {
          console.log('🤖 [REAL-AUTH] Génération de titre IA pour:', question);

          const titleResponse = await this.fineTuningService.processFineTunedQuery({
            question: `Génère un titre court et précis (maximum 8 mots) pour cette consultation juridique: "${question}". Catégorie: ${category}. Le titre doit être professionnel et indiquer clairement le type de problème juridique.`,
            category: category,
            context: 'title_generation'
          });

          // Extraire le titre de la réponse IA
          let aiTitle = titleResponse.answer?.title || titleResponse.answer?.content || '';

          // Nettoyer le titre (supprimer guillemets, points, etc.)
          aiTitle = aiTitle.replace(/["'`]/g, '').replace(/\.$/, '').trim();

          // Vérifier que le titre n'est pas trop long
          if (aiTitle.length > 80) {
            aiTitle = aiTitle.substring(0, 77) + '...';
          }

          console.log('✅ [REAL-AUTH] Titre IA généré:', aiTitle);
          return aiTitle || this.getFallbackTitle(question, category);

        } catch (error) {
          console.error('❌ [REAL-AUTH] Erreur génération titre IA:', error);
          return this.getFallbackTitle(question, category);
        }
      };

      const explicitTitle = await generateAITitle(paymentData.clientQuestion || '', paymentData.category || 'consultation-generale');

      // Générer une réponse IA simulée basée sur la catégorie
      const aiResponses: { [key: string]: string } = {
        'divorce': 'Selon l\'article 229 du Code civil, le divorce peut être prononcé en cas de rupture irrémédiable du lien conjugal. Je recommande de rassembler tous les documents relatifs aux biens communs et de privilégier une procédure amiable si possible.',
        'succession': 'D\'après les articles 720 et suivants du Code civil, la succession s\'ouvre au lieu du dernier domicile du défunt. Il est essentiel d\'établir un inventaire des biens et de vérifier l\'existence d\'un testament.',
        'contrat': 'L\'article 1134 du Code civil stipule que les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites. En cas de non-respect, vous pouvez demander l\'exécution forcée ou des dommages-intérêts.',
        'travail': 'Le Code du travail protège les salariés contre les licenciements abusifs. Selon l\'article L1232-1, tout licenciement doit reposer sur une cause réelle et sérieuse. Je vous conseille de rassembler tous les éléments de preuve.',
        'foncier': 'Le droit de propriété est protégé par l\'article 544 du Code civil. Pour les conflits fonciers, il faut vérifier les titres de propriété et procéder si nécessaire à un bornage contradictoire.',
        'consultation-generale': 'Après analyse de votre situation, plusieurs options s\'offrent à vous selon le droit applicable. Je recommande une approche progressive en privilégiant d\'abord les solutions amiables avant d\'envisager une procédure judiciaire.'
      };

      const aiResponse = aiResponses[paymentData.category] || aiResponses['consultation-generale'];

      // Créer le cas avec les informations du paiement
      const caseData = {
        title: explicitTitle,
        description: `Question du client: ${paymentData.clientQuestion || 'Le client souhaite une consultation juridique spécialisée.'}\n\nCatégorie: ${paymentData.category || 'consultation-generale'}\nMontant payé: ${paymentData.amount || '10000'} FCFA`,
        category: paymentData.category || 'consultation-generale',
        citizenName: paymentData.clientName || null,
        citizenPhone: paymentData.clientPhone || null,
        citizenId: paymentData.clientId || null,
        urgency: paymentData.urgency || 'normal',
        estimatedTime: paymentData.estimatedTime || 30,
        paymentId: paymentData.paymentId,
        paymentAmount: paymentData.amount,
        aiResponse: aiResponse,
        clientQuestion: paymentData.clientQuestion || 'Question non spécifiée'
      };

      return await this.createCase(caseData);
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur création cas après paiement:', error);
      return { success: false, message: 'Erreur lors de la création du cas après paiement: ' + error.message };
    }
  }

  @Get('cases/pending')
  async getPendingCases() {
    try {
      // Récupérer uniquement les cas payés et en attente
      const cases = await this.caseRepository.find({
        where: {
          status: 'pending'
        },
        order: { createdAt: 'DESC' }
      });

      // Filtrer les cas payés uniquement (exclure isPaid:false et status:unpaid)
      const paidCases = cases.filter(c =>
        c.paymentId != null &&
        c.isPaid !== false &&
        c.status !== 'unpaid'
      );

      return {
        success: true,
        cases: paidCases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas' };
    }
  }

  @Post('case-accept/:id')
  async acceptCase(@Param('id') caseId: string, @Body() body: { lawyerId: string }) {
    try {
      console.log('🔍 [REAL-AUTH] Tentative d\'acceptation du cas:', caseId);
      console.log('👨⚖️ [REAL-AUTH] ID Avocat:', body.lawyerId);

      const caseToUpdate = await this.caseRepository.findOne({
        where: { _id: new ObjectId(caseId) }
      });

      if (!caseToUpdate) {
        return { success: false, message: 'Cas non trouvé' };
      }

      if (caseToUpdate.status !== 'pending') {
        return { success: false, message: 'Ce cas a déjà été pris en charge' };
      }

      caseToUpdate.status = 'accepted';
      caseToUpdate.lawyerId = body.lawyerId;
      caseToUpdate.acceptedAt = new Date();

      await this.caseRepository.save(caseToUpdate);

      console.log('✅ [REAL-AUTH] Cas accepté avec succès:', caseId);

      // Notifier que le cas a été accepté
      await this.notificationService.notifyCaseAccepted(caseId, body.lawyerId);

      return {
        success: true,
        case: caseToUpdate
      };
    } catch (error) {
      this.logger.error('Erreur acceptation cas:', error);
      return { success: false, message: 'Erreur lors de l\'acceptation du cas' };
    }
  }

  @Get('lawyer-cases/:id')
  async getLawyerCases(@Param('id') lawyerId: string) {
    try {
      const cases = await this.caseRepository.find({
        where: { lawyerId: lawyerId },
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        cases: cases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas avocat:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas' };
    }
  }

  @Get('cases/unpaid')
  async getUnpaidCases() {
    try {
      const unpaidCases = await this.caseRepository.find({
        where: {
          status: 'unpaid'
        },
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        cases: unpaidCases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas non payés:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas non payés' };
    }
  }

  @Get('cases/accepted')
  async getAllAcceptedCases() {
    try {
      const acceptedCases = await this.caseRepository.find({
        where: {
          status: 'accepted'
        },
        order: { acceptedAt: 'DESC' }
      });

      console.log('📋 [REAL-AUTH] Cas acceptés trouvés:', acceptedCases.length);
      console.log('📋 [REAL-AUTH] Détails des cas:', acceptedCases.map(c => ({ id: c.id, _id: c._id, lawyerId: c.lawyerId, status: c.status })));

      return {
        success: true,
        cases: acceptedCases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas acceptés:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas acceptés' };
    }
  }

  @Get('cases/accepted/:lawyerId')
  async getAcceptedCasesByLawyer(@Param('lawyerId') lawyerId: string) {
    try {
      console.log('🔍 [REAL-AUTH] Recherche cas acceptés pour avocat:', lawyerId);

      const acceptedCases = await this.caseRepository.find({
        where: {
          status: 'accepted',
          lawyerId: lawyerId
        },
        order: { acceptedAt: 'DESC' }
      });

      console.log('📋 [REAL-AUTH] Cas acceptés trouvés pour avocat', lawyerId, ':', acceptedCases.length);

      return {
        success: true,
        cases: acceptedCases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas acceptés par avocat:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas acceptés' };
    }
  }

  // Endpoints pour les notaires
  @Post('notary-register')
  async registerNotary(@Body() registerDto: any) {
    try {
      const existingLawyer = await this.lawyerRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingLawyer) {
        return { success: false, message: 'Cet email est déjà utilisé' };
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const notary = this.lawyerRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        specialty: registerDto.specialty,
        phone: registerDto.phone || '+221 77 000 00 00',
        experience: registerDto.experience || '1 an',
        lawFirm: registerDto.lawFirm || 'Étude Notariale',
        barNumber: `NOT${Date.now()}`,
        isActive: true,
        createdAt: new Date(),
      });

      const savedNotary = await this.lawyerRepository.save(notary);
      const { password, ...notaryData } = savedNotary;

      return {
        success: true,
        notary: notaryData,
        token: `notary_${savedNotary.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur inscription notaire:', error);
      return { success: false, message: 'Erreur lors de l\'inscription' };
    }
  }

  @Post('notary-login')
  async loginNotary(@Body() loginDto: { email: string; password: string }) {
    try {
      const notary = await this.lawyerRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!notary) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, notary.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const { password, ...notaryData } = notary;

      return {
        success: true,
        notary: notaryData,
        token: `notary_${notary.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur connexion notaire:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // Endpoints pour les huissiers
  @Post('bailiff-register')
  async registerBailiff(@Body() registerDto: any) {
    try {
      const existingLawyer = await this.lawyerRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingLawyer) {
        return { success: false, message: 'Cet email est déjà utilisé' };
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const bailiff = this.lawyerRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        specialty: registerDto.specialty,
        phone: registerDto.phone || '+221 77 000 00 00',
        experience: registerDto.experience || '1 an',
        lawFirm: registerDto.lawFirm || 'Étude d\'Huissier',
        barNumber: `HUI${Date.now()}`,
        isActive: true,
        createdAt: new Date(),
      });

      const savedBailiff = await this.lawyerRepository.save(bailiff);
      const { password, ...bailiffData } = savedBailiff;

      return {
        success: true,
        bailiff: bailiffData,
        token: `bailiff_${savedBailiff.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur inscription huissier:', error);
      return { success: false, message: 'Erreur lors de l\'inscription' };
    }
  }

  @Post('bailiff-login')
  async loginBailiff(@Body() loginDto: { email: string; password: string }) {
    try {
      const bailiff = await this.lawyerRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!bailiff) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, bailiff.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      const { password, ...bailiffData } = bailiff;

      return {
        success: true,
        bailiff: bailiffData,
        token: `bailiff_${bailiff.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur connexion huissier:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // Endpoints Google OAuth
  @Post('google-login')
  async googleLoginLawyer(@Body() body: { googleToken: string; email: string; name: string; picture?: string; googleId: string }) {
    console.log('🔍 [REAL-AUTH] Tentative de connexion Google avocat');
    console.log('📧 [REAL-AUTH] Email Google:', body.email);

    try {
      // Vérifier si l'avocat existe déjà avec cet email
      let lawyer = await this.lawyerRepository.findOne({
        where: { email: body.email }
      });

      if (lawyer) {
        // L'avocat existe, mettre à jour les infos Google si nécessaire
        if (!lawyer.googleId) {
          lawyer.googleId = body.googleId;
          lawyer.picture = body.picture || lawyer.picture;
          await this.lawyerRepository.save(lawyer);
        }

        const { password, ...lawyerData } = lawyer;
        console.log('✅ [REAL-AUTH] Connexion Google avocat existant réussie:', lawyer.id);

        return {
          success: true,
          lawyer: lawyerData,
          token: `lawyer_${lawyer.id}_${Date.now()}`
        };
      } else {
        // Créer un nouvel avocat avec les infos Google
        const newLawyer = this.lawyerRepository.create({
          name: body.name,
          email: body.email,
          googleId: body.googleId,
          picture: body.picture,
          password: '', // Pas de mot de passe pour les comptes Google
          specialty: 'autre', // Spécialité par défaut
          phone: '+221 77 000 00 00',
          experience: '1 an',
          lawFirm: 'Cabinet Indépendant',
          barNumber: `BAR${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
        });

        const savedLawyer = await this.lawyerRepository.save(newLawyer);
        const { password, ...lawyerData } = savedLawyer;

        console.log('✅ [REAL-AUTH] Nouvel avocat créé via Google:', savedLawyer.id);

        // Envoyer l'email de bienvenue
        try {
          await this.emailService.sendLawyerWelcomeEmail(savedLawyer.email, savedLawyer.name);
        } catch (emailError) {
          console.error('⚠️ [REAL-AUTH] Erreur envoi email bienvenue:', emailError);
        }

        return {
          success: true,
          lawyer: lawyerData,
          token: `lawyer_${savedLawyer.id}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur connexion Google avocat:', error);
      this.logger.error('Erreur connexion Google avocat:', error);
      return { success: false, message: 'Erreur de connexion Google: ' + error.message };
    }
  }

  @Post('notary-google-login')
  async googleLoginNotary(@Body() body: { googleToken: string; email: string; name: string; picture?: string; googleId: string }) {
    console.log('🔍 [REAL-AUTH] Tentative de connexion Google notaire');

    try {
      let notary = await this.lawyerRepository.findOne({
        where: { email: body.email }
      });

      if (notary) {
        if (!notary.googleId) {
          notary.googleId = body.googleId;
          notary.picture = body.picture || notary.picture;
          await this.lawyerRepository.save(notary);
        }

        const { password, ...notaryData } = notary;
        return {
          success: true,
          notary: notaryData,
          token: `notary_${notary.id}_${Date.now()}`
        };
      } else {
        const newNotary = this.lawyerRepository.create({
          name: body.name,
          email: body.email,
          googleId: body.googleId,
          picture: body.picture,
          password: '',
          specialty: 'actes-authentiques',
          phone: '+221 77 000 00 00',
          experience: '1 an',
          lawFirm: 'Étude Notariale',
          barNumber: `NOT${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
        });

        const savedNotary = await this.lawyerRepository.save(newNotary);
        const { password, ...notaryData } = savedNotary;

        return {
          success: true,
          notary: notaryData,
          token: `notary_${savedNotary.id}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur connexion Google notaire:', error);
      return { success: false, message: 'Erreur de connexion Google: ' + error.message };
    }
  }

  @Post('bailiff-google-login')
  async googleLoginBailiff(@Body() body: { googleToken: string; email: string; name: string; picture?: string; googleId: string }) {
    console.log('🔍 [REAL-AUTH] Tentative de connexion Google huissier');

    try {
      let bailiff = await this.lawyerRepository.findOne({
        where: { email: body.email }
      });

      if (bailiff) {
        if (!bailiff.googleId) {
          bailiff.googleId = body.googleId;
          bailiff.picture = body.picture || bailiff.picture;
          await this.lawyerRepository.save(bailiff);
        }

        const { password, ...bailiffData } = bailiff;
        return {
          success: true,
          bailiff: bailiffData,
          token: `bailiff_${bailiff.id}_${Date.now()}`
        };
      } else {
        const newBailiff = this.lawyerRepository.create({
          name: body.name,
          email: body.email,
          googleId: body.googleId,
          picture: body.picture,
          password: '',
          specialty: 'significations',
          phone: '+221 77 000 00 00',
          experience: '1 an',
          lawFirm: 'Étude d\'Huissier',
          barNumber: `HUI${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
        });

        const savedBailiff = await this.lawyerRepository.save(newBailiff);
        const { password, ...bailiffData } = savedBailiff;

        return {
          success: true,
          bailiff: bailiffData,
          token: `bailiff_${savedBailiff.id}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur connexion Google huissier:', error);
      return { success: false, message: 'Erreur de connexion Google: ' + error.message };
    }
  }

  // Clerk Authentication Endpoints
  @Post('clerk-login')
  async clerkLoginLawyer(@Body() body: { clerkUserId: string; email: string; name: string; picture?: string; clerkToken?: string }) {
    console.log('🔍 [REAL-AUTH] Tentative de connexion Clerk avocat');
    console.log('📧 [REAL-AUTH] Email Clerk:', body.email);

    try {
      // Vérifier si l'avocat existe déjà avec cet email
      let lawyer = await this.lawyerRepository.findOne({
        where: { email: body.email }
      });

      if (lawyer) {
        // L'avocat existe, mettre à jour les infos Clerk si nécessaire
        if (!lawyer.clerkId) {
          lawyer.clerkId = body.clerkUserId;
          lawyer.picture = body.picture || lawyer.picture;
          await this.lawyerRepository.save(lawyer);
        }

        const { password, ...lawyerData } = lawyer;
        console.log('✅ [REAL-AUTH] Connexion Clerk avocat existant réussie:', lawyer.id);

        return {
          success: true,
          lawyer: lawyerData,
          token: `lawyer_${lawyer.id}_${Date.now()}`
        };
      } else {
        // Créer un nouvel avocat avec les infos Clerk
        const newLawyer = this.lawyerRepository.create({
          name: body.name,
          email: body.email,
          clerkId: body.clerkUserId,
          picture: body.picture,
          password: '', // Pas de mot de passe pour les comptes Clerk
          specialty: 'autre', // Spécialité par défaut
          phone: '+221 77 000 00 00',
          experience: '1 an',
          lawFirm: 'Cabinet Indépendant',
          barNumber: `BAR${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
        });

        const savedLawyer = await this.lawyerRepository.save(newLawyer);
        const { password, ...lawyerData } = savedLawyer;

        console.log('✅ [REAL-AUTH] Nouvel avocat créé via Clerk:', savedLawyer.id);

        // Envoyer l'email de bienvenue
        try {
          await this.emailService.sendLawyerWelcomeEmail(savedLawyer.email, savedLawyer.name);
        } catch (emailError) {
          console.error('⚠️ [REAL-AUTH] Erreur envoi email bienvenue:', emailError);
        }

        return {
          success: true,
          lawyer: lawyerData,
          token: `lawyer_${savedLawyer.id}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('❌ [REAL-AUTH] Erreur connexion Clerk avocat:', error);
      this.logger.error('Erreur connexion Clerk avocat:', error);
      return { success: false, message: 'Erreur de connexion Clerk: ' + error.message };
    }
  }

  // Méthode helper pour les titres de fallback
  private getFallbackTitle(question: string, category: string): string {
    const categoryTitles: { [key: string]: string[] } = {
      'divorce': [
        'Demande de divorce pour mésentente grave',
        'Procédure de divorce avec partage des biens',
        'Divorce contentieux - Garde d\'enfants'
      ],
      'succession': [
        'Conflit successoral entre héritiers',
        'Contestation de testament familial',
        'Partage de succession immobilière'
      ],
      'contrat': [
        'Rupture de contrat commercial',
        'Non-respect d\'obligations contractuelles',
        'Litige sur clauses contractuelles'
      ],
      'travail': [
        'Licenciement abusif - Demande d\'indemnisation',
        'Conflit avec employeur sur salaire',
        'Harcèlement au travail - Recours'
      ],
      'foncier': [
        'Conflit de bornage entre voisins',
        'Contestation de titre de propriété',
        'Problème d\'occupation illégale'
      ]
    };

    const titles = categoryTitles[category] || [
      'Consultation juridique spécialisée',
      'Demande de conseil juridique',
      'Problème juridique à résoudre'
    ];

    // Sélection basée sur des mots-clés
    const questionLower = question.toLowerCase();
    if (questionLower.includes('licenci')) return 'Licenciement abusif - Demande d\'indemnisation';
    if (questionLower.includes('divorce')) return 'Demande de divorce pour mésentente grave';
    if (questionLower.includes('hérit')) return 'Conflit successoral entre héritiers';
    if (questionLower.includes('contrat')) return 'Rupture de contrat commercial';
    if (questionLower.includes('terrain')) return 'Conflit de bornage entre voisins';

    return titles[Math.floor(Math.random() * titles.length)];
  }
}