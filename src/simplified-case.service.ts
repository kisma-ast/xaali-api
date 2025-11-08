import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SimplifiedCaseService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private emailService: EmailService,
  ) {}

  async createSimplifiedCase(data: {
    question: string;
    aiResponse: string;
    category: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    paymentAmount: number;
    existingCaseId?: string;
  }) {
    console.log('🚀 Début création/mise à jour dossier simplifié:', data);
    
    let savedCase;
    let trackingToken;
    let trackingCode;
    
    // Vérifier s'il y a un cas existant à mettre à jour
    if (data.existingCaseId) {
      console.log('🔄 Mise à jour du cas existant:', data.existingCaseId);
      
      const existingCase = await this.caseRepository.findOne({
        where: { id: data.existingCaseId }
      });
      
      if (existingCase) {
        // Mettre à jour le cas existant avec les VRAIES informations de paiement
        console.log('🔍 Données avant mise à jour:', {
          ancien_nom: existingCase.citizenName,
          ancien_telephone: existingCase.citizenPhone,
          ancien_email: existingCase.citizenEmail
        });
        console.log('🔍 Nouvelles données reçues:', {
          nouveau_nom: data.citizenName,
          nouveau_telephone: data.citizenPhone,
          nouveau_email: data.citizenEmail
        });
        
        existingCase.citizenName = data.citizenName || existingCase.citizenName;
        existingCase.citizenPhone = data.citizenPhone || existingCase.citizenPhone;
        existingCase.citizenEmail = data.citizenEmail || existingCase.citizenEmail;
        existingCase.paymentAmount = data.paymentAmount;
        existingCase.isPaid = true;
        existingCase.status = 'pending';
        
        console.log('📝 Mise à jour avec vraies données:', {
          nom_final: existingCase.citizenName,
          telephone_final: existingCase.citizenPhone,
          email_final: existingCase.citizenEmail
        });
        
        // Générer les codes de suivi s'ils n'existent pas
        if (!existingCase.trackingToken) {
          existingCase.trackingToken = uuidv4();
        }
        if (!existingCase.trackingCode) {
          existingCase.trackingCode = `XL-${Math.floor(Math.random() * 90000) + 10000}`;
        }
        
        trackingToken = existingCase.trackingToken;
        trackingCode = existingCase.trackingCode;
        
        savedCase = await this.caseRepository.save(existingCase);
        console.log('✅ Cas existant mis à jour avec ID:', savedCase.id);
      } else {
        console.log('❌ Cas existant non trouvé, création d\'un nouveau');
        data.existingCaseId = undefined; // Forcer la création
      }
    }
    
    // Créer un nouveau cas si pas de cas existant
    if (!data.existingCaseId || !savedCase) {
      trackingToken = uuidv4();
      trackingCode = `XL-${Math.floor(Math.random() * 90000) + 10000}`;
      
      console.log('📝 Données générées:', { trackingCode, trackingToken });
      
      const newCase = this.caseRepository.create({
        title: data.question.substring(0, 100),
        description: data.question,
        trackingCode,
        trackingToken,
        status: 'pending',
        category: data.category,
        citizenName: data.citizenName,
        citizenPhone: data.citizenPhone,
        citizenEmail: data.citizenEmail || undefined,
        aiResponse: data.aiResponse,
        paymentAmount: data.paymentAmount,
        isPaid: true,
        createdAt: new Date()
      });
      
      console.log('💾 Sauvegarde nouveau cas...');
      savedCase = await this.caseRepository.save(newCase);
      console.log('✅ Nouveau dossier sauvegardé avec ID:', Array.isArray(savedCase) ? savedCase[0]?.id : savedCase.id);
    }

    // Vérification de la sauvegarde
    const verifyCase = await this.caseRepository.findOne({
      where: { trackingToken }
    });
    
    if (verifyCase) {
      console.log('✅ Vérification: Dossier trouvé en BD avec code:', verifyCase.trackingCode);
    } else {
      console.log('❌ Erreur: Dossier non trouvé après sauvegarde');
    }

    // Créer automatiquement le compte utilisateur
    // Créer compte anonyme (sans nom réel pour préserver l'anonymat)
    await this.createAutomaticAccount(data.citizenPhone, null, data.citizenEmail);

    // Envoyer les notifications avec la vraie réponse IA
    const notificationData = {
      ...data,
      aiResponse: savedCase.aiResponse || data.aiResponse // Utiliser la réponse stockée
    };
    if (trackingCode && trackingToken) {
      await this.sendNotifications(trackingCode, trackingToken, notificationData);
    }

    return {
      trackingCode,
      trackingLink: `https://xaali.net/suivi/${trackingToken}`,
      caseId: Array.isArray(savedCase) ? savedCase[0]?.id : savedCase.id
    };
  }

  async getCaseByToken(token: string) {
    const caseData = await this.caseRepository.findOne({
      where: { trackingToken: token }
    });
    
    if (!caseData) {
      throw new Error('Dossier non trouvé');
    }
    
    console.log('🔍 Données du dossier récupérées depuis BD:', {
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      citizenEmail: caseData.citizenEmail,
      isPaid: caseData.isPaid
    });
    
    const result = {
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      status: caseData.status,
      lawyerAssigned: !!caseData.lawyerId,
      lawyerName: caseData.lawyerName || null,
      question: caseData.description,
      citizenPhone: caseData.citizenPhone,
      citizenEmail: caseData.citizenEmail,
      createdAt: caseData.createdAt.toISOString()
    };
    
    console.log('📤 Données retournées au frontend:', result);
    
    return result;
  }

  async getAllCases() {
    const cases = await this.caseRepository.find({
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📊 Total des dossiers en BD: ${cases.length}`);
    
    return cases.map(caseData => ({
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      status: caseData.status,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      paymentAmount: caseData.paymentAmount,
      createdAt: caseData.createdAt.toISOString()
    }));
  }

  async getCaseById(caseId: string) {
    const caseData = await this.caseRepository.findOne({
      where: { id: caseId }
    });
    
    if (!caseData) {
      throw new Error('Dossier non trouvé');
    }
    
    return {
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      trackingToken: caseData.trackingToken,
      status: caseData.status,
      question: caseData.description,
      aiResponse: caseData.aiResponse, // Vraie réponse IA stockée
      category: caseData.category,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      citizenEmail: caseData.citizenEmail,
      paymentAmount: caseData.paymentAmount,
      isPaid: caseData.isPaid,
      lawyerAssigned: !!caseData.lawyerId,
      lawyerName: caseData.lawyerName || null,
      createdAt: caseData.createdAt.toISOString()
    };
  }

  private async createAutomaticAccount(phone: string, name: string | null, email?: string) {
    // Créer un compte anonyme (pour préserver l'anonymat)
    const anonymousName = name || `Client-${phone.slice(-4)}`; // Identifiant anonyme si pas de nom
    console.log(`🔐 Compte automatique créé (anonyme):`);
    console.log(`   Identifiant: ${phone}`);
    console.log(`   Nom anonyme: ${anonymousName}`);
    console.log(`   Email: ${email || 'Non fourni'}`);
    console.log(`   Mot de passe: Généré automatiquement`);
    
    // TODO: Créer réellement le compte dans la base de données si nécessaire
    // Pour l'instant, c'est juste logué pour la simulation
  }

  private async sendNotifications(trackingCode: string, trackingToken: string, data: any) {
    const trackingLink = `https://xaali.net/suivi/${trackingToken}`;
    
    // SMS
    console.log(`📱 SMS envoyé à ${data.citizenPhone}:`);
    console.log(`Merci, votre dossier ${trackingCode} a été créé. Suivez-le ici : ${trackingLink}`);
    
    // WhatsApp
    console.log(`📱 WhatsApp envoyé à ${data.citizenPhone}:`);
    console.log(`Bonjour, votre dossier juridique Xaali.net est créé. Code : ${trackingCode}. Lien de suivi : ${trackingLink}`);
    
    // Email réel si fourni
    if (data.citizenEmail) {
      try {
        const emailSent = await this.emailService.sendTrackingNotification(
          data.citizenEmail,
          trackingCode,
          trackingLink,
          data.paymentAmount
        );
        if (emailSent) {
          console.log(`✅ Email réel envoyé à ${data.citizenEmail}`);
        } else {
          console.log(`❌ Échec envoi email à ${data.citizenEmail}`);
        }
      } catch (error) {
        console.log(`❌ Erreur envoi email à ${data.citizenEmail}:`, error);
      }
    }
  }

  async createCaseWithTracking(data: {
    question: string;
    aiResponse: string;
    category: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    paymentAmount: number;
    isPaid: boolean;
  }) {
    console.log('🚀 Création cas avec codes de suivi:', data);
    
    const trackingToken = uuidv4();
    const trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const newCase = this.caseRepository.create({
      title: data.question.substring(0, 100),
      description: data.question,
      trackingCode,
      trackingToken,
      status: data.isPaid ? 'pending' : 'unpaid',
      category: data.category,
      citizenName: data.citizenName,
      citizenPhone: data.citizenPhone,
      citizenEmail: data.citizenEmail || undefined,
      aiResponse: data.aiResponse,
      paymentAmount: data.paymentAmount,
      isPaid: data.isPaid,
      createdAt: new Date()
    });

    const savedCase = await this.caseRepository.save(newCase);
    console.log('✅ Cas avec codes de suivi créé:', savedCase.id);

    return {
      caseId: Array.isArray(savedCase) ? savedCase[0]?.id : savedCase.id,
      trackingCode,
      trackingToken,
      trackingLink: `https://xaali.net/suivi/${trackingToken}`
    };
  }

  async getPendingPaidCases() {
    const cases = await this.caseRepository.find({
      where: { 
        isPaid: true,
        status: 'pending'
      },
      order: { createdAt: 'DESC' }
    });
    
    return cases.map(caseData => ({
      id: caseData.id,
      _id: caseData.id,
      trackingCode: caseData.trackingCode,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      citizenEmail: caseData.citizenEmail,
      description: caseData.description,
      question: caseData.description,
      aiResponse: caseData.aiResponse,
      category: caseData.category,
      paymentAmount: caseData.paymentAmount,
      createdAt: caseData.createdAt.toISOString()
    }));
  }

  async getAcceptedCases() {
    const cases = await this.caseRepository.find({
      where: { 
        status: 'accepted'
      },
      order: { createdAt: 'DESC' }
    });
    
    return cases.map(caseData => ({
      id: caseData.id,
      _id: caseData.id,
      trackingCode: caseData.trackingCode,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      citizenEmail: caseData.citizenEmail,
      description: caseData.description,
      aiResponse: caseData.aiResponse,
      category: caseData.category,
      paymentAmount: caseData.paymentAmount,
      lawyerName: caseData.lawyerName,
      acceptedAt: caseData.acceptedAt || caseData.createdAt,
      createdAt: caseData.createdAt.toISOString()
    }));
  }

  async acceptCase(caseId: string, lawyerId: string, lawyerName: string) {
    const caseToUpdate = await this.caseRepository.findOne({
      where: { id: caseId }
    });
    
    if (!caseToUpdate) {
      throw new Error('Cas non trouvé');
    }
    
    caseToUpdate.status = 'accepted';
    caseToUpdate.lawyerId = lawyerId;
    caseToUpdate.lawyerName = lawyerName;
    caseToUpdate.acceptedAt = new Date();
    
    await this.caseRepository.save(caseToUpdate);
    
    console.log(`✅ Cas ${caseId} accepté par ${lawyerName}`);
  }

  async getTrackingHistory() {
    const cases = await this.caseRepository.find({
      select: ['id', 'trackingCode', 'trackingToken', 'citizenName', 'citizenPhone', 'status', 'createdAt', 'acceptedAt'],
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📋 Historique de traçabilité: ${cases.length} codes générés`);
    
    return cases.map(caseData => ({
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      trackingToken: caseData.trackingToken?.substring(0, 8) + '...', // Masquer le token complet
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      status: caseData.status,
      createdAt: caseData.createdAt.toISOString(),
      acceptedAt: caseData.acceptedAt?.toISOString() || null
    }));
  }

  async findByTrackingCode(trackingCode: string) {
    const caseData = await this.caseRepository.findOne({
      where: { trackingCode }
    });
    
    if (!caseData) {
      throw new Error(`Aucun dossier trouvé avec le code ${trackingCode}`);
    }
    
    console.log(`✅ Code ${trackingCode} trouvé en BD - Traçabilité confirmée`);
    
    return {
      id: caseData.id,
      trackingCode: caseData.trackingCode,
      status: caseData.status,
      citizenName: caseData.citizenName,
      citizenPhone: caseData.citizenPhone,
      createdAt: caseData.createdAt.toISOString(),
      isTraceable: true
    };
  }

  async cleanupUnpaidCases() {
    console.log('🧹 Début du nettoyage des cas non payés...');
    
    // Compter tous les cas
    const totalCount = await this.caseRepository.count();
    console.log(`📋 ${totalCount} cas au total`);
    
    // Trouver les cas non payés
    const unpaidCases = await this.caseRepository.find({
      where: { isPaid: false }
    });
    
    console.log(`🚫 ${unpaidCases.length} cas non payés trouvés`);
    
    if (unpaidCases.length === 0) {
      return {
        deletedCount: 0,
        remainingCount: totalCount,
        message: 'Aucun cas non payé à supprimer'
      };
    }
    
    // Supprimer les cas non payés
    await this.caseRepository.remove(unpaidCases);
    
    // Vérifier après suppression
    const countAfter = await this.caseRepository.count();
    console.log(`📋 ${countAfter} cas restants après nettoyage`);
    
    console.log('✅ Nettoyage des cas non payés terminé');
    
    return {
      deletedCount: unpaidCases.length,
      remainingCount: countAfter,
      message: `${unpaidCases.length} cas non payés supprimés, ${countAfter} cas payés conservés`
    };
  }

  async fixMissingTrackingCodes() {
    // Trouver tous les cas sans codes de suivi
    const casesWithoutTracking = await this.caseRepository.find();
    
    const casesToFix = casesWithoutTracking.filter(caseItem => 
      !caseItem.trackingCode || !caseItem.trackingToken
    );
    
    console.log(`🔧 ${casesToFix.length} cas sans codes de suivi trouvés`);
    
    let fixed = 0;
    for (const caseItem of casesToFix) {
      // Générer les codes manquants
      if (!caseItem.trackingCode) {
        caseItem.trackingCode = `XL-${Math.floor(Math.random() * 90000) + 10000}`;
      }
      if (!caseItem.trackingToken) {
        caseItem.trackingToken = uuidv4();
      }
      
      await this.caseRepository.save(caseItem);
      console.log(`✅ Codes générés pour cas ${caseItem.id}: ${caseItem.trackingCode}`);
      fixed++;
    }
    
    return {
      total: casesToFix.length,
      fixed,
      message: `${fixed} cas corrigés avec nouveaux codes de suivi`
    };
  }
}