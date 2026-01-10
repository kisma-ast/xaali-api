import { Controller, Post, Body, Logger, Get, Param, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Dossier } from './dossier.entity';
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
    @InjectRepository(Dossier)
    private dossierRepository: Repository<Dossier>,
    private notificationService: NotificationService,
    private fineTuningService: FineTuningService,
    private emailService: EmailService,
  ) { }

  @Get('profile')
  async getProfile(@Req() request: any) {
    console.log('[REAL-AUTH] Récupération profil via token');

    try {
      const authHeader = request.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, message: 'Token manquant' };
      }

      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('_');

      if (parts.length < 2) {
        return { success: false, message: 'Format de token invalide' };
      }

      const userType = parts[0];
      const userId = parts[1];

      console.log(`[REAL-AUTH] Type: ${userType}, ID: ${userId}`);

      if (userType === 'lawyer' || userType === 'notary' || userType === 'bailiff') {
        const lawyer = await this.lawyerRepository.findOne({
          where: { _id: new ObjectId(userId) }
        });

        if (!lawyer) {
          return { success: false, message: 'Utilisateur non trouvé' };
        }

        const { password, ...lawyerData } = lawyer;
        // Retourne lawyerData sous clé "lawyer" (attendu par App.tsx) et "user" pour compatibilité
        return { success: true, user: { ...lawyerData, role: 'avocat' }, lawyer: lawyerData, type: userType };
      }

      return { success: false, message: 'Type utilisateur non géré pour ce endpoint' };
    } catch (error) {
      console.error('[REAL-AUTH] Erreur récupération profil:', error);
      return { success: false, message: 'Token manquant' };
    }
  }

  @Post('register')
  async registerLawyer(@Body() registerDto: any) {
    console.log('[REAL-AUTH] Tentative d\'inscription avocat');
    console.log('[REAL-AUTH] Données reçues:', JSON.stringify(registerDto, null, 2));

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
      console.log(`[REAL-AUTH] Hashage mot de passe pour ${registerDto.email}:`, {
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

      console.log('[REAL-AUTH] Avocat créé avec succès:', savedLawyer.id);
      console.log('[REAL-AUTH] Données sauvegardées:', JSON.stringify(lawyerData, null, 2));

      // Envoyer l'email de bienvenue
      try {
        await this.emailService.sendLawyerWelcomeEmail(savedLawyer.email, savedLawyer.name);
      } catch (emailError) {
        console.error('[REAL-AUTH] Erreur envoi email bienvenue:', emailError);
        // Ne pas bloquer l'inscription si l'email échoue
      }

      return {
        success: true,
        lawyer: lawyerData,
        token: `lawyer_${savedLawyer.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('[REAL-AUTH] Erreur inscription avocat:', error);
      this.logger.error('Erreur inscription avocat:', error);
      return { success: false, message: 'Erreur lors de l\'inscription: ' + error.message };
    }
  }

  @Post('login')
  async loginLawyer(@Body() loginDto: { email: string; password: string }) {
    console.log('[REAL-AUTH] Tentative de connexion avocat');
    console.log('[REAL-AUTH] Email:', loginDto.email);

    try {
      const lawyer = await this.lawyerRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!lawyer) {
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      console.log(`[REAL-AUTH] Vérification mot de passe pour ${loginDto.email}:`, {
        provided: loginDto.password,
        stored: lawyer.password
      });

      const isPasswordValid = await bcrypt.compare(loginDto.password, lawyer.password);
      console.log(`[REAL-AUTH] Résultat vérification: ${isPasswordValid}`);

      if (!isPasswordValid) {
        console.log(`[REAL-AUTH] Mot de passe incorrect pour: ${loginDto.email}`);
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      console.log(`[REAL-AUTH] Connexion réussie pour: ${loginDto.email}`);

      const { password, ...lawyerData } = lawyer;

      // Ajouter explicitement l'id car le getter n'est pas copié par le spread
      const lawyerResponse = {
        ...lawyerData,
        id: lawyer.id || lawyer._id?.toString()
      };

      console.log('[REAL-AUTH] Connexion avocat réussie:', lawyerResponse.id);

      return {
        success: true,
        lawyer: lawyerResponse,
        token: `lawyer_${lawyer.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('[REAL-AUTH] Erreur connexion avocat:', error);
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
    console.log('[REAL-AUTH] Création d\'un nouveau cas');
    console.log('[REAL-AUTH] Données du cas:', JSON.stringify(caseDto, null, 2));

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
      console.log('[REAL-AUTH] Cas sauvegardé:', savedCase.id);

      // Notifier tous les avocats actifs via le service de notification
      const notificationResult = await this.notificationService.notifyNewCase(savedCase);
      console.log('[REAL-AUTH] Notification envoyée à', notificationResult.notifiedLawyers, 'avocats');

      this.logger.log(`Nouveau cas créé: ${savedCase.id}`);

      return {
        success: true,
        case: savedCase,
        notificationResult: notificationResult
      };
    } catch (error) {
      console.error('[REAL-AUTH] Erreur création cas:', error);
      this.logger.error('Erreur création cas:', error);
      return { success: false, message: 'Erreur lors de la création du cas: ' + error.message };
    }
  }

  // Endpoint spécial pour créer un cas après paiement réussi
  @Post('case-create-after-payment')
  async createCaseAfterPayment(@Body() paymentData: any) {
    console.log('[REAL-AUTH] Création de cas après paiement réussi');
    console.log('[REAL-AUTH] Données de paiement:', JSON.stringify(paymentData, null, 2));

    try {
      // Générer un titre intelligent avec l'IA fine-tunée
      const generateAITitle = async (question: string, category: string): Promise<string> => {
        try {
          console.log('[REAL-AUTH] Génération de titre IA pour:', question);

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

          console.log('[REAL-AUTH] Titre IA généré:', aiTitle);
          return aiTitle || this.getFallbackTitle(question, category);

        } catch (error) {
          console.error('[REAL-AUTH] Erreur génération titre IA:', error);
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
        description: paymentData.clientQuestion || 'Le client souhaite une consultation juridique spécialisée.',
        category: paymentData.category || 'consultation-generale',
        citizenName: paymentData.clientName || null,
        citizenPhone: paymentData.clientPhone || null,
        citizenId: paymentData.clientId || null,
        urgency: paymentData.urgency || 'normal',
        estimatedTime: paymentData.estimatedTime || 30,
        paymentId: paymentData.paymentId,
        paymentAmount: paymentData.amount,
        aiResponse: aiResponse,
        clientQuestion: paymentData.clientQuestion || 'Question non spécifiée',
        paidAt: new Date(), // Set payment date for new paid case
        isPaid: true
      };

      return await this.createCase(caseData);
    } catch (error) {
      console.error('[REAL-AUTH] Erreur création cas après paiement:', error);
      return { success: false, message: 'Erreur lors de la création du cas après paiement: ' + error.message };
    }
  }

  @Get('cases/pending')
  async getPendingCases() {
    try {
      // 1. Récupérer TOUS les cas potentiels (élargir la recherche pour la fusion)
      const cases = await this.caseRepository.find({
        order: { paidAt: 'DESC', createdAt: 'DESC' }
      });

      // 2. Récupérer TOUS les dossiers potentiels
      const dossiers = await this.dossierRepository.find({
        order: { createdAt: 'DESC' }
      });

      console.log(`[REAL-AUTH] Bruts: ${cases.length} cas, ${dossiers.length} dossiers`);

      // 3. FUSION INTELLIGENTE (clé unique: trackingToken ou ID)
      const consultationMap = new Map<string, { case?: any, dossier?: any }>();

      cases.forEach(c => {
        const key = c.trackingToken || (c._id || c.id)?.toString();
        if (key) {
          consultationMap.set(key, { ...consultationMap.get(key), case: c });
        }
      });

      dossiers.forEach(d => {
        const key = d.trackingToken || d.id || (d as any)._id?.toString();
        if (key) {
          consultationMap.set(key, { ...consultationMap.get(key), dossier: d });
        }
      });

      // 4. FILTRAGE ABSOLU
      const finalCases = [];

      for (const [key, data] of consultationMap.entries()) {
        const c = data.case;
        const d = data.dossier;

        // Déterminer les états combinés
        const isActuallyAccepted =
          (c && (c.status === 'accepted' || c.lawyerId || c.lawyerName)) ||
          (d && (d.status === 'accepted' || d.lawyerId || d.assignedLawyer));

        const isActuallyPaid =
          (c && (c.isPaid === true || c.status === 'paid' || c.status === 'pending' || (c.paymentId && c.paymentId.length > 5))) ||
          (d && (d.isPaid === true || d.status === 'paid' || d.status === 'pending'));

        // Ne garder que ce qui est PAYÉ (ou en attente) et NON ACCEPTÉ
        if (isActuallyPaid && !isActuallyAccepted) {
          // Préférer les données du dossier s'il existe (souvent plus complet)
          const base = d || c;

          finalCases.push({
            ...base,
            id: ((base as any)._id || (base as any).id)?.toString(),
            _id: ((base as any)._id || (base as any).id)?.toString(),
            paymentId: base.paymentId || base.trackingToken || `manual_${(base._id || base.id)?.toString().substring(0, 8)}`,
            status: 'pending',
            isPaid: true,
            description: base.clientQuestion || base.description,
            category: base.problemCategory || base.category,
            citizenName: base.clientName || base.citizenName,
            citizenPhone: base.clientPhone || base.citizenPhone,
            title: base.problemCategory || base.category || 'Consultation Xaali',
            type: d ? 'dossier_simplified' : 'standard',
            paidAt: base.paidAt || base.createdAt
          });
        }
      }

      console.log(`[REAL-AUTH] Total final après filtrage: ${finalCases.length}`);

      // 5. Tri final par date
      const allCases = finalCases.sort((a, b) => {
        const dateA = new Date(a.paidAt || a.createdAt).getTime();
        const dateB = new Date(b.paidAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      return {
        success: true,
        cases: allCases
      };
    } catch (error) {
      this.logger.error('Erreur récupération cas:', error);
      return { success: false, message: 'Erreur lors de la récupération des cas' };
    }
  }

  @Post('case-accept/:id')
  async acceptCase(
    @Param('id') caseId: string,
    @Body() body: { lawyerId: string },
    @Req() request: any
  ) {
    try {
      console.log('[REAL-AUTH] Tentative d\'acceptation du cas:', caseId);

      // Extraire l'ID de l'avocat depuis le token d'autorisation
      let lawyerIdFromToken = null;
      const authHeader = request.headers?.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        // Token format: lawyer_${lawyer.id}_${Date.now()}
        const parts = token.split('_');
        if (parts.length >= 2 && parts[0] === 'lawyer') {
          lawyerIdFromToken = parts[1];
          console.log('🔑 [REAL-AUTH] ID Avocat extrait du token:', lawyerIdFromToken);
        }
      }

      // Utiliser l'ID du token en priorité, sinon celui du body
      const effectiveLawyerId = lawyerIdFromToken || body.lawyerId;
      console.log('👨‍⚖️ [REAL-AUTH] ID Avocat effectif:', effectiveLawyerId);

      let caseToUpdate: any = null;
      let isSimplifiedDossier = false;

      // Essayer de trouver un Cas standard
      try {
        caseToUpdate = await this.caseRepository.findOne({
          where: { _id: new ObjectId(caseId) }
        });
      } catch (e) {
        console.log('ℹ️ [REAL-AUTH] ID non conforme ObjectId, vérification UUID Dossier...');
      }

      // Si pas trouvé, essayer de trouver un Dossier simplifié
      if (!caseToUpdate) {
        try {
          caseToUpdate = await this.dossierRepository.findOne({
            where: { id: caseId }
          });
          if (caseToUpdate) {
            isSimplifiedDossier = true;
            console.log('[REAL-AUTH] Dossier simplifié trouvé:', caseId);
          }
        } catch (e) {
          console.log('[REAL-AUTH] Erreur recherche dossier:', e);
        }
      }

      if (!caseToUpdate) {
        return { success: false, message: 'Cas ou Dossier non trouvé' };
      }

      // Vérifier le statut (pending, paid ou unpaid+isPaid ou unpaid+paymentId)
      if (isSimplifiedDossier) {
        if (caseToUpdate.status !== 'pending' && caseToUpdate.status !== 'paid' && caseToUpdate.isPaid !== true) {
          return { success: false, message: 'Ce dossier a déjà été pris en charge ou est invalide' };
        }
      } else {
        // Pour les cas standards, on accepte si:
        // 1. Status est 'pending'
        // 2. OU isPaid est true (source de vérité ultime selon l'utilisateur)
        // 3. OU paymentId existe (cas limite)
        // ET que lawyerId est null (pas déjà pris)

        const isPaidValid = caseToUpdate.isPaid === true || !!caseToUpdate.paymentId;
        const isStatusValid = caseToUpdate.status === 'pending' || caseToUpdate.status === 'paid' || caseToUpdate.status === 'unpaid';
        const isNotTaken = !caseToUpdate.lawyerId;

        if (!isNotTaken) {
          return { success: false, message: 'Ce cas a déjà été accepté par un autre avocat' };
        }

        if (!isPaidValid && caseToUpdate.status !== 'pending') {
          return { success: false, message: 'Ce cas n\'est pas éligible (non payé)' };
        }
      }

      // Récupérer les informations de l'avocat depuis la BD
      let lawyer = null;
      if (effectiveLawyerId && effectiveLawyerId !== 'demo-lawyer') {
        try {
          lawyer = await this.lawyerRepository.findOne({
            where: { _id: new ObjectId(effectiveLawyerId) }
          });
          console.log('[REAL-AUTH] Avocat trouvé dans BD:', lawyer?.name);
        } catch (e) {
          console.log('Recherche avocat par ObjectId échouée');
        }
      }

      const assignedLawyerName = lawyer?.name || 'Avocat Xaali';

      // Mettre à jour le cas ou le dossier
      if (isSimplifiedDossier) {
        // Mise à jour Dossier
        caseToUpdate.status = 'accepted';
        // Dossier stocke assignedLawyer en JSON
        caseToUpdate.assignedLawyer = {
          id: effectiveLawyerId,
          name: assignedLawyerName,
          specialty: lawyer?.specialty || caseToUpdate.problemCategory,
          phone: lawyer?.phone
        };
        // Ajouter champs pour compatibilité Dashboard
        caseToUpdate.lawyerId = effectiveLawyerId; // Si nécessaire pour requêtes futures
        caseToUpdate.acceptedAt = new Date();

        await this.dossierRepository.save(caseToUpdate);

        // Champs pour notification
        caseToUpdate.citizenEmail = caseToUpdate.clientEmail;
        caseToUpdate.category = caseToUpdate.problemCategory;

      } else {
        // Mise à jour Cas standard
        caseToUpdate.status = 'accepted';
        caseToUpdate.lawyerId = effectiveLawyerId;
        caseToUpdate.lawyerName = assignedLawyerName;
        caseToUpdate.acceptedAt = new Date();

        await this.caseRepository.save(caseToUpdate);

        // SYNC: Chercher si un Dossier existe aussi pour ce Cas et le mettre à jour
        try {
          const matchingDossier = await this.dossierRepository.findOne({
            where: { trackingToken: caseToUpdate.trackingToken }
          });
          if (matchingDossier && matchingDossier.status === 'pending') {
            matchingDossier.status = 'accepted';
            matchingDossier.assignedLawyer = {
              id: effectiveLawyerId,
              name: assignedLawyerName,
              specialty: lawyer?.specialty || caseToUpdate.category || 'Avocat',
              phone: lawyer?.phone || ''
            };
            matchingDossier.lawyerId = effectiveLawyerId;
            matchingDossier.acceptedAt = new Date();
            await this.dossierRepository.save(matchingDossier);
            console.log('[REAL-AUTH] SYNC: Dossier correspondant mis à jour');
          }
        } catch (syncError) {
          console.error('[REAL-AUTH] Erreur synchronisation Dossier:', syncError);
        }
      }

      // SYNC INVERSE: Si on a mis à jour un Dossier, chercher le Cas correspondant
      if (isSimplifiedDossier) {
        try {
          const matchingCase = await this.caseRepository.findOne({
            where: { trackingToken: caseToUpdate.trackingToken }
          });
          if (matchingCase && matchingCase.status !== 'accepted') {
            matchingCase.status = 'accepted';
            matchingCase.lawyerId = effectiveLawyerId;
            matchingCase.lawyerName = assignedLawyerName;
            matchingCase.acceptedAt = new Date();
            await this.caseRepository.save(matchingCase);
            console.log('[REAL-AUTH] SYNC: Cas correspondant mis à jour');
          }
        } catch (syncError) {
          console.error('[REAL-AUTH] Erreur synchronisation Cas:', syncError);
        }
      }

      console.log('[REAL-AUTH] Cas/Dossier accepté avec succès:', caseId);
      console.log('[REAL-AUTH] Avocat assigné:', assignedLawyerName);

      // Notifier les autres avocats que le cas n'est plus disponible
      try {
        await this.notificationService.notifyCaseAccepted(caseId, effectiveLawyerId);
      } catch (e) {
        console.warn('Erreur notification push:', e);
      }

      // Envoyer notification au citoyen directement via son email sur le cas
      if (caseToUpdate.citizenEmail && caseToUpdate.trackingCode && caseToUpdate.trackingToken) {
        console.log('[REAL-AUTH] Envoi notification au citoyen:', caseToUpdate.citizenEmail);
        const trackingLink = `https://xaali.net/suivi/${caseToUpdate.trackingToken}`;

        try {
          await this.emailService.sendCitizenLawyerAssignedNotification(
            caseToUpdate.citizenEmail,
            caseToUpdate.trackingCode,
            trackingLink,
            {
              name: assignedLawyerName,
              specialty: lawyer?.specialty || caseToUpdate.category,
              email: lawyer?.email,
              phone: lawyer?.phone
            }
          );
          console.log('[REAL-AUTH] Notification citoyen envoyée');
        } catch (emailError) {
          console.error('[REAL-AUTH] Erreur envoi email citoyen:', emailError);
        }
      } else {
        console.log('[REAL-AUTH] Pas d\'email citoyen ou tracking manquant');
      }

      return {
        success: true,
        case: caseToUpdate
      };
    } catch (error) {
      this.logger.error('Erreur acceptation cas:', error);
      return { success: false, message: 'Erreur lors de l\'acceptation du cas' };
    }
  }

  @Post('case-close/:id')
  async closeCase(@Param('id') caseId: string, @Req() request: any) {
    try {
      console.log('[REAL-AUTH] Clôture manuelle du dossier:', caseId);

      const caseToClose = await this.caseRepository.findOne({
        where: { _id: new ObjectId(caseId) }
      });

      if (!caseToClose) {
        return { success: false, message: 'Cas non trouvé' };
      }

      // Check authorization (optional but good)
      // For now, assuming auth middleware or token check handled elsewhere or implicitly via restricted access to this button

      caseToClose.exchangeStatus = 'closed';
      caseToClose.status = 'completed';
      caseToClose.exchangeClosedAt = new Date();
      caseToClose.closureType = 'manual';

      await this.caseRepository.save(caseToClose);

      // SYNC: Chercher si un Dossier existe aussi pour ce Cas et le mettre à jour
      try {
        const matchingDossier = await this.dossierRepository.findOne({
          where: { trackingToken: caseToClose.trackingToken }
        });
        if (matchingDossier) {
          matchingDossier.status = 'completed';
          await this.dossierRepository.save(matchingDossier);
          console.log('[REAL-AUTH] SYNC: Dossier correspondant clôturé');
        }
      } catch (syncError) {
        console.error('[REAL-AUTH] Erreur synchronisation clôture Dossier:', syncError);
      }

      console.log('[REAL-AUTH] Dossier clôturé:', caseId);

      return { success: true, case: caseToClose };
    } catch (error) {
      console.error('[REAL-AUTH] Erreur clôture dossier:', error);
      return { success: false, message: 'Erreur lors de la clôture du dossier' };
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

      console.log('[REAL-AUTH] Cas acceptés trouvés:', acceptedCases.length);
      console.log('[REAL-AUTH] Détails des cas:', acceptedCases.map(c => ({ id: c.id, _id: c._id, lawyerId: c.lawyerId, status: c.status })));

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
      console.log('[REAL-AUTH] Recherche cas acceptés pour avocat:', lawyerId);

      // D'abord, récupérer TOUS les cas acceptés pour debug
      const allAccepted = await this.caseRepository.find({
        where: { status: 'accepted' }
      });
      console.log('[DEBUG] Total cas acceptés dans la BD:', allAccepted.length);
      console.log('[DEBUG] LawyerIds des cas acceptés:', allAccepted.map(c => ({
        caseId: c._id?.toString() || c.id,
        lawyerId: c.lawyerId,
        lawyerIdType: typeof c.lawyerId
      })));

      // Maintenant filtrer par lawyerId
      const acceptedCases = await this.caseRepository.find({
        where: {
          status: 'accepted',
          lawyerId: lawyerId
        },
        order: { acceptedAt: 'DESC' }
      });

      console.log('[REAL-AUTH] Cas acceptés trouvés pour avocat', lawyerId, ':', acceptedCases.length);

      // Si aucun cas trouvé mais il y en a dans la BD, essayer de matcher manuellement
      if (acceptedCases.length === 0 && allAccepted.length > 0) {
        console.log('[DEBUG] Aucun match exact, essai de match flexible...');
        const manualMatch = allAccepted.filter(c =>
          c.lawyerId === lawyerId ||
          c.lawyerId?.toString() === lawyerId ||
          c.lawyerId === lawyerId?.toString()
        );
        console.log('[DEBUG] Match flexible trouvé:', manualMatch.length);

        if (manualMatch.length > 0) {
          return { success: true, cases: manualMatch };
        }
      }

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

  // Endpoint to fix data inconsistencies (isPaid=true but status='unpaid')
  @Post('fix-status-inconsistencies')
  async fixStatusInconsistencies() {
    try {
      console.log('🔧 [REAL-AUTH] Fixing status inconsistencies...');

      // Find all cases where isPaid is true but status is 'unpaid'
      const allCases = await this.caseRepository.find();
      const inconsistentCases = allCases.filter(c => c.isPaid === true && c.status === 'unpaid');

      console.log(`📋 Found ${inconsistentCases.length} inconsistent cases`);

      let fixedCount = 0;
      for (const caseItem of inconsistentCases) {
        caseItem.status = 'pending';
        await this.caseRepository.save(caseItem);
        fixedCount++;
        console.log(`✅ Fixed case ${caseItem.id}: status changed from 'unpaid' to 'pending'`);
      }

      return {
        success: true,
        message: `Fixed ${fixedCount} cases with inconsistent status`,
        fixedCases: inconsistentCases.map(c => ({ id: c.id, trackingCode: c.trackingCode }))
      };
    } catch (error) {
      console.error('❌ Error fixing status inconsistencies:', error);
      return { success: false, message: 'Error: ' + error.message };
    }
  }
}