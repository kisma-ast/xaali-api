import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dossier } from './dossier.entity';
import { Case } from './case.entity';
import { EmailService } from './email.service';

@Injectable()
export class DossiersService {
  private readonly logger = new Logger(DossiersService.name);

  constructor(
    @InjectRepository(Dossier)
    private dossierRepository: Repository<Dossier>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private emailService: EmailService,
  ) { }

  async createFromCase(caseData: Case): Promise<Dossier> {
    console.log(`📋 Création dossier depuis cas: ${caseData.id}`);
    console.log(`   - trackingCode: ${caseData.trackingCode}`);
    console.log(`   - trackingToken: ${caseData.trackingToken}`);

    // Vérifier si un dossier existe déjà pour ce cas
    const existingDossier = await this.dossierRepository.findOne({
      where: { caseId: caseData.id }
    });

    if (existingDossier) {
      console.log(`✅ Dossier existant trouvé: ${existingDossier.trackingCode}`);
      return existingDossier;
    }

    const dossier = new Dossier();
    // UTILISER EXACTEMENT les mêmes identifiants que le cas (pas de génération aléatoire)
    dossier.trackingCode = caseData.trackingCode || '';
    dossier.trackingToken = caseData.trackingToken || '';
    dossier.caseId = caseData.id;

    // Si les identifiants n'existent pas dans le cas, les générer maintenant
    if (!dossier.trackingCode) {
      dossier.trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
      console.log(`⚠️ Génération nouveau trackingCode: ${dossier.trackingCode}`);
    }
    if (!dossier.trackingToken) {
      dossier.trackingToken = require('crypto').randomUUID();
      console.log(`⚠️ Génération nouveau trackingToken: ${dossier.trackingToken}`);
    }
    dossier.clientName = caseData.citizenName || 'Client';
    dossier.clientPhone = caseData.citizenPhone || '';
    if (caseData.citizenEmail) {
      dossier.clientEmail = caseData.citizenEmail;
    }
    dossier.problemCategory = caseData.category || 'Consultation juridique';
    dossier.clientQuestion = caseData.description || caseData.firstQuestion || '';
    dossier.aiResponse = caseData.aiResponse || caseData.firstResponse || '';
    dossier.followUpQuestions = [
      caseData.firstQuestion,
      caseData.secondQuestion,
      caseData.thirdQuestion
    ].filter(q => q);
    dossier.followUpAnswers = [
      caseData.firstResponse,
      caseData.secondResponse,
      caseData.thirdResponse
    ].filter(r => r);
    dossier.status = caseData.isPaid ? 'paid' : 'pending';
    dossier.paymentAmount = caseData.paymentAmount || 10000;
    dossier.isPaid = caseData.isPaid;

    if (caseData.lawyerName) {
      dossier.assignedLawyer = {
        name: caseData.lawyerName,
        specialty: caseData.category || '',
        phone: ''
      };
    }

    const savedDossier = await this.dossierRepository.save(dossier);

    // Envoyer l'email de suivi si l'email est disponible et que les identifiants de suivi existent
    if (caseData.citizenEmail && !caseData.citizenEmail.includes('@xaali.temp') && caseData.trackingCode && caseData.trackingToken) {
      try {
        this.logger.log(`📧 Envoi email de suivi à: ${caseData.citizenEmail}`);
        const trackingLink = `${'https://xaali.net'}/suivi/${caseData.trackingToken}`;

        const emailSent = await this.emailService.sendTrackingNotification(
          caseData.citizenEmail,
          caseData.trackingCode,
          trackingLink,
          caseData.paymentAmount || 10000
        );

        if (emailSent) {
          this.logger.log(`✅ Email de suivi envoyé avec succès à ${caseData.citizenEmail}`);
        } else {
          this.logger.error(`❌ Échec envoi email à ${caseData.citizenEmail}`);
        }
      } catch (emailError) {
        this.logger.error(`❌ Erreur critique envoi email à ${caseData.citizenEmail}:`, emailError);
        // Ne pas bloquer la création du dossier si l'email échoue
      }
    } else {
      if (!caseData.trackingCode || !caseData.trackingToken) {
        this.logger.warn(`⚠️ Pas d'identifiants de suivi pour le dossier - email non envoyé`);
      } else {
        this.logger.warn(`⚠️ Pas d'email valide pour le dossier ${savedDossier.trackingCode}`);
      }
    }

    return savedDossier;
  }

  async findByTrackingCode(trackingCode: string): Promise<Dossier | null> {
    console.log(`🔍 Recherche dossier avec trackingCode: ${trackingCode}`);

    // Recherche exacte d'abord
    let dossier = await this.dossierRepository.findOne({
      where: { trackingCode },
      relations: ['case']
    });

    if (dossier) {
      console.log(`✅ Dossier trouvé avec trackingCode exact: ${trackingCode}`);
      return dossier;
    }

    // Si pas trouvé, chercher dans les cases aussi (au cas où le trackingCode serait là)
    const caseData = await this.caseRepository.findOne({
      where: { trackingCode }
    });

    if (caseData) {
      console.log(`✅ Case trouvée avec trackingCode: ${trackingCode}, création du dossier`);
      return this.createFromCase(caseData);
    }

    console.log(`❌ Aucun dossier trouvé pour trackingCode: ${trackingCode}`);
    return null;
  }

  async findByTrackingToken(trackingToken: string): Promise<Dossier | null> {
    return this.dossierRepository.findOne({
      where: { trackingToken },
      relations: ['case']
    });
  }

  async updateFromCase(caseId: string): Promise<Dossier | null> {
    const caseData = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseData) return null;

    let dossier = await this.dossierRepository.findOne({ where: { caseId } });

    if (!dossier) {
      return this.createFromCase(caseData);
    }

    // Mettre à jour les données
    dossier.clientName = caseData.citizenName || dossier.clientName;
    dossier.clientPhone = caseData.citizenPhone || dossier.clientPhone;
    dossier.clientEmail = caseData.citizenEmail || dossier.clientEmail;
    dossier.problemCategory = caseData.category || dossier.problemCategory;
    dossier.clientQuestion = caseData.description || caseData.firstQuestion || dossier.clientQuestion;
    dossier.aiResponse = caseData.aiResponse || caseData.firstResponse || dossier.aiResponse;
    dossier.status = caseData.isPaid ? 'paid' : 'pending';
    dossier.paymentAmount = caseData.paymentAmount || dossier.paymentAmount;
    dossier.isPaid = caseData.isPaid;

    return this.dossierRepository.save(dossier);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Dossier | null> {
    console.log(`🔍 Recherche dossier par téléphone: ${phoneNumber}`);

    // Chercher le dossier le plus récent avec ce numéro de téléphone
    const dossier = await this.dossierRepository.findOne({
      where: { clientPhone: phoneNumber },
      relations: ['case'],
      order: { createdAt: 'DESC' } // Le plus récent en premier
    });

    if (dossier) {
      console.log(`✅ Dossier trouvé par téléphone: ${dossier.trackingCode}`);
      return dossier;
    }

    console.log(`❌ Aucun dossier trouvé pour téléphone: ${phoneNumber}`);
    return null;
  }

  async findAll(): Promise<Dossier[]> {
    return this.dossierRepository.find({
      relations: ['case'],
      order: { createdAt: 'DESC' }
    });
  }
}