import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { v4 as uuidv4 } from 'uuid';

@Controller('cases')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
  ) {}

  @Post('create-tracking')
  async createTrackingCase(@Body() data: {
    caseId: string;
    citizenPhone: string;
    citizenEmail?: string;
    paymentAmount: number;
  }) {
    try {
      // Générer un code de suivi unique
      const trackingCode = `XA-${Math.floor(10000 + Math.random() * 90000)}`;
      const trackingToken = uuidv4();
      
      // Créer le lien de suivi
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const trackingLink = `${baseUrl}/suivi/${trackingToken}`;

      // Mettre à jour le cas avec les informations de suivi
      await this.caseRepository.update(data.caseId, {
        trackingCode,
        trackingToken,
        isPaid: true,
        paymentAmount: data.paymentAmount,
        status: 'pending'
      });

      // Créer automatiquement un compte citoyen si nécessaire
      await this.createCitizenAccount(data.citizenPhone, data.citizenEmail);

      // Envoyer les notifications (SMS, WhatsApp, Email)
      await this.sendNotifications(data.citizenPhone, data.citizenEmail, trackingCode, trackingLink);

      this.logger.log(`Dossier de suivi créé: ${trackingCode}`);

      return {
        success: true,
        trackingCode,
        trackingLink,
        message: 'Dossier créé avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur création dossier de suivi:', error);
      return {
        success: false,
        error: 'Erreur lors de la création du dossier'
      };
    }
  }

  @Get('tracking/:token')
  async getTrackingCase(@Param('token') token: string) {
    try {
      const case_ = await this.caseRepository.findOne({
        where: { trackingToken: token } as any
      });

      if (!case_) {
        return {
          success: false,
          error: 'Dossier introuvable'
        };
      }

      // Compter les messages non lus pour ce cas
      // TODO: Implémenter le comptage des messages non lus

      return {
        success: true,
        case: {
          trackingCode: case_.trackingCode,
          status: case_.status,
          createdAt: case_.createdAt,
          paymentAmount: case_.paymentAmount,
          firstQuestion: case_.firstQuestion,
          description: case_.description,
          lawyerName: case_.lawyerName || null
        },
        unreadCount: 0 // TODO: Calculer le vrai nombre
      };
    } catch (error) {
      this.logger.error('Erreur récupération dossier:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération'
      };
    }
  }

  private async createCitizenAccount(phone: string, email?: string) {
    try {
      // Vérifier si le compte existe déjà
      const existingCitizen = await this.citizenRepository.findOne({
        where: { phone }
      });

      if (!existingCitizen) {
        // Créer un nouveau compte citoyen
        const citizen = this.citizenRepository.create({
          name: `Client ${phone.slice(-4)}`,
          phone,
          email: email || `${phone}@xaali.temp`,
          password: this.generateRandomPassword(),
          createdAt: new Date()
        });

        await this.citizenRepository.save(citizen);
        this.logger.log(`Compte citoyen créé automatiquement: ${phone}`);
      }
    } catch (error) {
      this.logger.error('Erreur création compte citoyen:', error);
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  private async sendNotifications(phone: string, email: string | undefined, trackingCode: string, trackingLink: string) {
    try {
      // SMS
      await this.sendSMS(phone, `Merci, votre dossier ${trackingCode} a été créé. Suivez-le ici : ${trackingLink}`);
      
      // WhatsApp
      await this.sendWhatsApp(phone, `Bonjour, votre dossier juridique Xaali.net est créé. Code : ${trackingCode}. Lien de suivi : ${trackingLink}`);
      
      // Email (si fourni)
      if (email && !email.includes('@xaali.temp')) {
        await this.sendEmail(email, trackingCode, trackingLink);
      }

      this.logger.log(`Notifications envoyées pour ${trackingCode}`);
    } catch (error) {
      this.logger.error('Erreur envoi notifications:', error);
    }
  }

  private async sendSMS(phone: string, message: string) {
    // TODO: Intégrer avec Twilio ou Paytech SMS API
    this.logger.log(`SMS envoyé à ${phone}: ${message}`);
  }

  private async sendWhatsApp(phone: string, message: string) {
    // TODO: Intégrer avec Meta Cloud API ou Twilio WhatsApp
    this.logger.log(`WhatsApp envoyé à ${phone}: ${message}`);
  }

  private async sendEmail(email: string, trackingCode: string, trackingLink: string) {
    // TODO: Intégrer avec SendGrid ou Mailgun
    this.logger.log(`Email envoyé à ${email} pour ${trackingCode}`);
  }
}