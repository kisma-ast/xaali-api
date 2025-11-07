import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';
import { CasesService } from './cases.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly casesService: CasesService
  ) {}

  @Post('send-tracking')
  async sendTrackingNotifications(@Body() data: {
    caseId: string;
    trackingCode: string;
    trackingLink: string;
    phone: string;
    email?: string;
    amount: number;
    citizenName?: string;
    problemCategory?: string;
    clientQuestion?: string;
    aiResponse?: string;
    caseTitle?: string;
    followUpQuestions?: string[];
    followUpAnswers?: string[];
  }) {
    try {
      console.log('📧 Envoi notifications de suivi:', data);

      // Log du suivi (remplace la sauvegarde en base)
      console.log('📋 Données de suivi:', {
        trackingCode: data.trackingCode,
        caseId: data.caseId,
        citizenName: data.citizenName,
        amount: data.amount
      });

      // Envoyer email si disponible
      if (data.email) {
        await this.emailService.sendTrackingNotification(
          data.email,
          data.trackingCode,
          data.trackingLink,
          data.amount
        );
        console.log('✅ Email envoyé à', data.email);
      }

      // Envoyer WhatsApp
      await this.sendWhatsAppNotification(
        data.phone,
        data.trackingCode,
        data.trackingLink,
        data.amount
      );
      console.log('✅ WhatsApp envoyé à', data.phone);

      return { success: true, message: 'Dossier complet créé et notifications envoyées' };
    } catch (error) {
      console.error('❌ Erreur envoi notifications:', error);
      return { success: false, message: 'Erreur envoi notifications' };
    }
  }

  @Get('tracking/:code')
  async getTrackingInfo(@Param('code') trackingCode: string) {
    return { success: false, message: 'Service de suivi temporairement indisponible' };
  }

  @Get('trackings/all')
  async getAllTrackings() {
    return { success: false, message: 'Service de suivi temporairement indisponible' };
  }

  @Post('send-tracking-email')
  async sendTrackingEmail(@Body() data: {
    caseId: string;
    trackingCode: string;
    trackingLink: string;
    phone: string;
    email: string;
    amount: number;
    citizenName: string;
    problemCategory: string;
    clientQuestion: string;
    aiResponse: string;
    caseTitle: string;
    followUpQuestions: string[];
    followUpAnswers: string[];
    caseData: any;
  }) {
    try {
      await this.emailService.sendTrackingEmail(
        data.trackingCode,
        data.trackingLink,
        data.email,
        data.caseData
      );
      
      console.log('✅ Email avec lien de suivi envoyé à:', data.email);
      
      return {
        success: true,
        message: 'Email avec lien de suivi envoyé'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email suivi:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      };
    }
  }

  @Get('get-case/:trackingCode')
  async getCaseByTracking(@Param('trackingCode') trackingCode: string) {
    try {
      console.log('🔍 Recherche dossier:', trackingCode);
      
      // D'abord essayer le stockage temporaire
      const tempCaseData = this.emailService.getCaseData(trackingCode);
      if (tempCaseData) {
        console.log('✅ Dossier trouvé en stockage temporaire');
        return { success: true, caseData: tempCaseData };
      }
      
      // Chercher en base de données MongoDB
      const caseFromDB = await this.casesService.findByTrackingCode(trackingCode);
      if (caseFromDB) {
        console.log('✅ Dossier trouvé en base de données:', caseFromDB.id);
        
        // Formater les données pour le frontend
        const formattedCase = {
          id: caseFromDB.id,
          clientName: caseFromDB.citizenName || 'Client Xaali',
          clientPhone: caseFromDB.citizenPhone || '+221 77 000 00 00',
          clientEmail: caseFromDB.citizenEmail || null,
          problemCategory: caseFromDB.category || 'Consultation juridique',
          clientQuestion: caseFromDB.clientQuestion || caseFromDB.description,
          aiResponse: caseFromDB.aiResponse || 'Réponse en cours de traitement',
          followUpQuestions: [
            caseFromDB.firstQuestion,
            caseFromDB.secondQuestion,
            caseFromDB.thirdQuestion
          ].filter(Boolean),
          followUpAnswers: [
            caseFromDB.firstResponse,
            caseFromDB.secondResponse,
            caseFromDB.thirdResponse
          ].filter(Boolean),
          status: caseFromDB.isPaid ? 'paid' : caseFromDB.status,
          createdAt: caseFromDB.createdAt?.toISOString() || new Date().toISOString(),
          paymentAmount: caseFromDB.paymentAmount || 10000,
          lawyerName: caseFromDB.lawyerName,
          acceptedAt: caseFromDB.acceptedAt?.toISOString()
        };
        
        return { success: true, caseData: formattedCase };
      }
      
      console.log('❌ Dossier non trouvé:', trackingCode);
      return {
        success: false,
        message: 'Dossier non trouvé'
      };
    } catch (error) {
      console.error('❌ Erreur récupération dossier:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du dossier'
      };
    }
  }

  private async sendWhatsAppNotification(
    phone: string,
    trackingCode: string,
    trackingLink: string,
    amount: number
  ) {
    try {
      // Simuler l'envoi WhatsApp (à remplacer par une vraie API WhatsApp)
      const message = `🎉 Paiement confirmé !

Montant: ${amount} FCFA
Code de suivi: ${trackingCode}

Suivez votre dossier ici:
${trackingLink}

Un avocat va bientôt prendre en charge votre cas.

- Équipe Xaali`;

      console.log('📱 WhatsApp à envoyer à', phone, ':', message);
      
      // TODO: Intégrer une API WhatsApp Business (Twilio, etc.)
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur WhatsApp:', error);
      throw error;
    }
  }
}