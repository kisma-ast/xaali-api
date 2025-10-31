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
  }) {
    console.log('🚀 Début création dossier simplifié:', data);
    
    const trackingToken = uuidv4();
    const trackingCode = `XA-${Math.floor(Math.random() * 90000) + 10000}`;
    
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
    
    console.log('💾 Données à sauvegarder:', {
      citizenName: data.citizenName,
      citizenPhone: data.citizenPhone,
      citizenEmail: data.citizenEmail
    });

    console.log('💾 Sauvegarde en cours...');
    const savedCase = await this.caseRepository.save(newCase);
    console.log('✅ Dossier sauvegardé avec ID:', Array.isArray(savedCase) ? savedCase[0]?.id : savedCase.id);

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
    await this.createAutomaticAccount(data.citizenPhone, data.citizenName, data.citizenEmail);

    // Envoyer les notifications
    await this.sendNotifications(trackingCode, trackingToken, data);

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
    
    return {
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

  private async createAutomaticAccount(phone: string, name: string, email?: string) {
    // Simuler la création automatique du compte
    console.log(`🔐 Compte automatique créé:`);
    console.log(`   Identifiant: ${phone}`);
    console.log(`   Nom: ${name}`);
    console.log(`   Email: ${email || 'Non fourni'}`);
    console.log(`   Mot de passe: Généré automatiquement`);
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
}