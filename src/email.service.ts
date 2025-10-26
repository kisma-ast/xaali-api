import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private caseStorage = new Map<string, any>(); // Stockage temporaire des dossiers

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    this.logger.log('📧 Service Email configuré avec:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER
    });
  }

  async sendTrackingNotification(
    email: string,
    trackingCode: string,
    trackingLink: string,
    amount: number
  ) {
    try {
      this.logger.log(`🚀 Tentative d'envoi email à: ${email}`);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Paiement confirmé - Code de suivi ${trackingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🎉 Paiement confirmé !</h2>
            <p>Votre paiement de <strong>${amount} FCFA</strong> a été traité avec succès.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Code de suivi</h3>
              <div style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">${trackingCode}</div>
            </div>
            
            <p>Un avocat va bientôt prendre en charge votre dossier. Vous recevrez une notification dès qu'un avocat acceptera votre cas.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                🔍 Suivre mon dossier
              </a>
            </div>
            
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              Conservez ce code de suivi pour suivre l'évolution de votre dossier.
            </p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de suivi envoyé avec succès à ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erreur envoi email suivi à ${email}:`, error);
      return false;
    }
  }

  async sendNewCaseNotificationToLawyers(caseData: any): Promise<boolean> {
    try {
      this.logger.log('Notification avocats pour nouveau cas');
      return true;
    } catch (error) {
      this.logger.error('Erreur notification avocats:', error);
      return false;
    }
  }

  async sendTrackingEmail(trackingCode: string, trackingLink: string, customerEmail: string, caseData: any) {
    try {
      // Stocker le dossier pour accès via lien
      this.caseStorage.set(trackingCode, caseData);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Xaali - Accès à votre dossier: ${trackingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Xaali</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Plateforme d'assistance juridique</p>
            </div>
            
            <h2 style="color: #1f2937;">Votre dossier est prêt !</h2>
            <p>Bonjour <strong>${caseData.clientName}</strong>,</p>
            <p>Votre consultation juridique concernant <strong>${caseData.problemCategory}</strong> a été traitée avec succès.</p>
            
            <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <h3 style="margin: 0 0 15px 0;">Accédez à votre dossier</h3>
              <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">${trackingCode}</p>
              <a href="${trackingLink}" style="display: inline-block; background: white; color: #2563eb; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ouvrir mon dossier</a>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1f2937; margin: 0 0 10px 0;">Que contient votre dossier ?</h4>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li>Votre question initiale et la réponse IA</li>
                <li>Questions de suivi (si applicable)</li>
                <li>Statut de traitement en temps réel</li>
                <li>Contact avec l'avocat assigné</li>
                <li>Téléchargement PDF de votre dossier</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Important:</strong> Conservez ce lien pour accéder à votre dossier à tout moment.</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>Besoin d'aide ? Contactez-nous à support@xaali.com</p>
              <p style="margin: 10px 0 0 0;">L'équipe Xaali - Votre partenaire juridique au Sénégal</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email avec lien de suivi envoyé à ${customerEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erreur envoi email suivi:`, error);
      return false;
    }
  }

  getCaseData(trackingCode: string) {
    return this.caseStorage.get(trackingCode);
  }

  async sendNewMessageNotification(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messageContent: string,
    caseId: string
  ) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `Nouveau message de ${senderName} - Xaali`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau message reçu</h2>
            <p>Bonjour ${recipientName},</p>
            <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> :</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${messageContent}"</p>
            </div>
            <p>Connectez-vous à votre espace Xaali pour répondre.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Voir le message
            </a>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email envoyé à ${recipientEmail}`);
    } catch (error) {
      this.logger.error('Erreur envoi email:', error);
    }
  }
}