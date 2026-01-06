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
      debug: true, // Activer les logs SMTP
      logger: true // Loguer dans la console
    });

    this.logger.log('Service Email configuré avec:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
    });
  }

  async sendTrackingNotification(
    email: string,
    trackingCode: string,
    trackingLink: string,
    amount: number
  ) {
    try {
      this.logger.log(`Tentative d'envoi email à: ${email}`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Paiement confirmé - Code de suivi ${trackingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Paiement confirmé !</h2>
            <p>Votre paiement de <strong>${amount} FCFA</strong> a été traité avec succès.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Code de suivi</h3>
              <div style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">${trackingCode}</div>
            </div>
            
            <p>Un avocat va bientôt prendre en charge votre dossier. Vous recevrez une notification dès qu'un avocat acceptera votre cas.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Suivre mon dossier
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
      this.logger.log(`Email de suivi envoyé avec succès à ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi email suivi à ${email}: ${error.message}`);
      if (error.code) this.logger.error(`Code erreur: ${error.code}`);
      if (error.command) this.logger.error(`Commande: ${error.command}`);
      if (error.response) this.logger.error(`Réponse SMTP: ${error.response}`);
      return false;
    }
  }

  async sendNewCaseNotificationToLawyers(email: string, name: string, caseData: any): Promise<boolean> {
    try {
      this.logger.log(`Envoi notification nouveau cas à l'avocat: ${email}`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Nouveau dossier disponible - ${caseData.category}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau dossier disponible</h2>
            <p>Bonjour Maître ${name},</p>
            <p>Un nouveau dossier correspondant à vos compétences est disponible sur la plateforme Xaali.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">Détails du dossier</h3>
              <p><strong>Catégorie:</strong> ${caseData.category}</p>
              <p><strong>Titre:</strong> ${caseData.title}</p>
              <p><strong>Description:</strong> ${caseData.description ? caseData.description.substring(0, 150) + '...' : 'Non spécifiée'}</p>
              <p><strong>Montant:</strong> ${caseData.paymentAmount || 'Standard'} FCFA</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xaali.net/lawyer/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Voir le dossier
              </a>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      this.logger.error(`Erreur notification avocat (${email}):`, error);
      return false;
    }
  }

  async sendCaseAssignedNotificationToLawyer(email: string, name: string, caseData: any): Promise<boolean> {
    try {
      this.logger.log(`Envoi confirmation assignation à l'avocat: ${email}`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Dossier attribué - ${caseData.trackingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Dossier attribué avec succès</h2>
            <p>Bonjour Maître ${name},</p>
            <p>Le dossier <strong>${caseData.trackingCode}</strong> vous a été attribué avec succès.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Récapitulatif</h3>
              <p><strong>Client:</strong> ${caseData.citizenName || 'Client Xaali'}</p>
              <p><strong>Catégorie:</strong> ${caseData.category}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Vous pouvez dès maintenant prendre contact avec le client via la messagerie sécurisée.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xaali.net/lawyer/cases/${caseData.id}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accéder au dossier
              </a>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      this.logger.error(`Erreur notification assignation avocat (${email}):`, error);
      return false;
    }
  }

  async sendCitizenLawyerAssignedNotification(
    email: string,
    trackingCode: string,
    trackingLink: string,
    lawyer: any
  ): Promise<boolean> {
    try {
      this.logger.log(`Envoi notification avocat assigné au citoyen: ${email}`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Avocat assigné - Dossier ${trackingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Votre dossier a été accepté !</h2>
            <p>Bonjour,</p>
            <p>Un avocat a accepté de prendre en charge votre dossier <strong>${trackingCode}</strong>.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Votre avocat</h3>
              <p style="margin: 5px 0;"><strong>${lawyer.name}</strong></p>
              <p style="margin: 5px 0;">${lawyer.specialty || 'Spécialiste juridique'}</p>
              ${lawyer.email ? `<p style="margin: 5px 0;">Email: ${lawyer.email}</p>` : ''}
              ${lawyer.phone ? `<p style="margin: 5px 0;">Téléphone: ${lawyer.phone}</p>` : ''}
            </div>
            
            <p>Vous pouvez maintenant communiquer avec votre avocat via la plateforme.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accéder à mon dossier
              </a>
            </div>
            
            <p style="font-size: 12px; color: #6b7280;">
              - Équipe Xaali
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      this.logger.error(`Erreur notification citoyen avocat assigné (${email}):`, error);
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
      this.logger.log(`Email avec lien de suivi envoyé à ${customerEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi email suivi:`, error);
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
            <a href="https://xaali.net" 
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

  async sendLawyerWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      this.logger.log(`Envoi email de bienvenue avocat à: ${email}`);

      // Log transporter config (safe)
      this.logger.debug(`Configuration SMTP: Host=${process.env.EMAIL_HOST}, Port=${process.env.EMAIL_PORT}, User=${process.env.EMAIL_USER ? 'Défini' : 'Non défini'}`);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Bienvenue sur Xaali - Votre compte avocat est créé`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Bienvenue sur Xaali</h1>
            </div>

            <p>Bonjour Maître <strong>${name}</strong>,</p>
            
            <p>Nous sommes ravis de vous compter parmi nos partenaires juridiques. Votre compte avocat a été créé avec succès.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Ce que vous pouvez faire maintenant :</h3>
              <ul style="color: #1e3a8a;">
                <li>Compléter votre profil professionnel</li>
                <li>Consulter les dossiers disponibles</li>
                <li>Accepter des missions et interagir avec les clients</li>
              </ul>
            </div>

            <p>Pour commencer, connectez-vous à votre tableau de bord :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xaali.net/lawyer/login" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accéder à mon compte
              </a>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 14px; color: #6b7280;">
              Si vous avez des questions, notre équipe support est à votre disposition.
            </p>
            <p style="font-size: 14px; color: #6b7280;">
              Cordialement,<br>
              L'équipe Xaali
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenue envoyé avec succès à ${email}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi email bienvenue avocat à ${email}:`, error);
      if (error.response) {
        this.logger.error(`Détails erreur SMTP: ${JSON.stringify(error.response)}`);
      }
      return false;
    }
  }
}