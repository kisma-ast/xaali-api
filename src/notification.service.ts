import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { EmailService } from './email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private connectedLawyers = new Map<string, any>(); // WebSocket connections

  constructor(
    @InjectRepository(Lawyer)
    private lawyerRepository: Repository<Lawyer>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
    private emailService: EmailService,
  ) { }

  // Enregistrer une connexion WebSocket d'avocat
  registerLawyerConnection(lawyerId: string, socket: any) {
    this.connectedLawyers.set(lawyerId, socket);
    this.logger.log(`Avocat ${lawyerId} connecté pour notifications`);
  }

  // Supprimer une connexion WebSocket d'avocat
  unregisterLawyerConnection(lawyerId: string) {
    this.connectedLawyers.delete(lawyerId);
    this.logger.log(`Avocat ${lawyerId} déconnecté`);
  }

  // Notifier tous les avocats actifs d'un nouveau cas
  async notifyNewCase(newCase: Case) {
    try {
      const activeLawyers = await this.lawyerRepository.find({
        where: { isActive: true }
      });

      const notification = {
        type: 'NEW_CASE',
        case: {
          id: newCase.id,
          title: newCase.title,
          description: newCase.description,
          category: newCase.category,
          urgency: newCase.urgency,
          estimatedTime: newCase.estimatedTime,
          createdAt: newCase.createdAt
        },
        timestamp: new Date()
      };

      let notifiedCount = 0;

      // Envoyer notification via WebSocket aux avocats connectés ET Email à tous
      for (const lawyer of activeLawyers) {
        // WebSocket
        const socket = this.connectedLawyers.get(lawyer.id);
        if (socket) {
          socket.emit('newCase', notification);
          notifiedCount++;
        }

        // Email (si l'avocat a un email configuré)
        if (lawyer.email) {
          // Ne pas attendre la promesse pour ne pas bloquer la boucle
          this.emailService.sendNewCaseNotificationToLawyers(lawyer.email, lawyer.name, {
            ...newCase,
            paymentAmount: newCase.paymentAmount
          }).catch(err => this.logger.error(`Erreur envoi email avocat ${lawyer.email}:`, err));
        }
      }

      this.logger.log(`Nouveau cas ${newCase.id} notifié à ${notifiedCount}/${activeLawyers.length} avocats`);

      return {
        totalLawyers: activeLawyers.length,
        notifiedLawyers: notifiedCount
      };
    } catch (error) {
      this.logger.error('Erreur notification nouveau cas:', error);
      return { totalLawyers: 0, notifiedLawyers: 0 };
    }
  }

  // Notifier qu'un cas a été accepté
  async notifyCaseAccepted(caseId: string, lawyerId: string) {
    try {
      const acceptedCase = await this.caseRepository.findOne({
        where: { id: caseId }
      });

      if (!acceptedCase) return;

      const notification = {
        type: 'CASE_ACCEPTED',
        case: acceptedCase,
        lawyerId: lawyerId,
        timestamp: new Date()
      };

      // Notifier tous les autres avocats que le cas n'est plus disponible
      for (const [connectedLawyerId, socket] of this.connectedLawyers.entries()) {
        if (connectedLawyerId !== lawyerId) {
          socket.emit('caseUnavailable', { caseId: caseId });
        }
      }

      this.logger.log(`Cas ${caseId} accepté par avocat ${lawyerId}`);
    } catch (error) {
      this.logger.error('Erreur notification cas accepté:', error);
    }
  }

  // Obtenir le nombre d'avocats connectés
  getConnectedLawyersCount(): number {
    return this.connectedLawyers.size;
  }

  // Obtenir la liste des avocats connectés
  getConnectedLawyers(): string[] {
    return Array.from(this.connectedLawyers.keys());
  }

  // ========== NOTIFICATIONS CITOYEN ==========

  /**
   * Notifier un citoyen qu'un dossier a été créé
   */
  async notifyCitizenCaseCreated(case_: Case) {
    try {
      const citizen = await this.citizenRepository.findOne({
        where: { _id: case_.citizenId as any }
      });

      if (!citizen) {
        this.logger.warn(`Citoyen non trouvé pour le cas ${case_.id}`);
        return;
      }

      // Email
      if (citizen.email && !citizen.email.includes('@xaali.temp')) {
        await this.emailService.sendTrackingNotification(
          citizen.email,
          case_.trackingCode || 'N/A',
          `${'https://xaali.net'}/suivi/${case_.trackingToken}`,
          case_.paymentAmount || 10000
        );
        this.logger.log(`Email dossier créé envoyé à ${citizen.email}`);
      }

      // SMS (simulation - à intégrer avec vraie API)
      if (citizen.phone) {
        this.logger.log(`SMS dossier créé envoyé à ${citizen.phone}`);
        // TODO: Intégrer API SMS (Twilio, etc.)
      }

      this.logger.log(`Citoyen ${citizen.id} notifié de la création du dossier ${case_.id}`);
    } catch (error) {
      this.logger.error(`Erreur notification citoyen dossier créé: ${error.message}`);
    }
  }

  /**
   * Notifier un citoyen qu'un avocat a accepté son dossier
   */
  async notifyCitizenLawyerAssigned(case_: Case, lawyer: Lawyer) {
    try {
      const citizen = await this.citizenRepository.findOne({
        where: { _id: case_.citizenId as any }
      });

      if (!citizen) {
        this.logger.warn(`Citoyen non trouvé pour le cas ${case_.id}`);
        return;
      }

      // Email
      if (citizen.email && !citizen.email.includes('@xaali.temp')) {
        try {
          const trackingLink = `${'https://xaali.net'}/suivi/${case_.trackingToken}`;
          const emailAddress = citizen.email as string;

          await this.emailService.sendCitizenLawyerAssignedNotification(
            emailAddress,
            case_.trackingCode || 'N/A',
            trackingLink,
            lawyer
          );
          this.logger.log(`Email avocat assigné envoyé à ${citizen.email}`);
        } catch (error) {
          this.logger.error(`Erreur envoi email avocat assigné: ${error.message}`);
        }
      }

      // SMS
      if (citizen.phone) {
        this.logger.log(`SMS avocat assigné envoyé à ${citizen.phone}`);
        // TODO: Intégrer API SMS
      }

      this.logger.log(`Citoyen ${citizen.id} notifié de l'assignation de l'avocat ${lawyer.id}`);
    } catch (error) {
      this.logger.error(`Erreur notification citoyen avocat assigné: ${error.message}`);
    }
  }

  /**
   * Notifier un citoyen qu'il a reçu un message
   */
  async notifyCitizenNewMessage(case_: Case, lawyerName: string, messageContent: string) {
    try {
      const citizen = await this.citizenRepository.findOne({
        where: { _id: case_.citizenId as any }
      });

      if (!citizen) return;

      // Email
      if (citizen.email && !citizen.email.includes('@xaali.temp')) {
        this.logger.log(`Email nouveau message envoyé à ${citizen.email}`);
        // TODO: Envoyer email avec le contenu du message
      }

      // SMS
      if (citizen.phone) {
        this.logger.log(`SMS nouveau message envoyé à ${citizen.phone}`);
        // TODO: Intégrer API SMS
      }

      this.logger.log(`Citoyen ${citizen.id} notifié d'un nouveau message`);
    } catch (error) {
      this.logger.error(`Erreur notification citoyen nouveau message: ${error.message}`);
    }
  }

  // ========== NOTIFICATIONS AVOCAT ==========

  /**
   * Notifier un avocat qu'un nouveau cas est disponible
   */
  async notifyLawyerNewCase(case_: Case, lawyerId?: string) {
    try {
      if (lawyerId) {
        // Notifier un avocat spécifique
        const lawyer = await this.lawyerRepository.findOne({
          where: { _id: lawyerId as any }
        });

        if (!lawyer) return;

        // WebSocket
        const socket = this.connectedLawyers.get(lawyerId);
        if (socket) {
          socket.emit('newCase', {
            type: 'NEW_CASE',
            case: {
              id: case_.id,
              title: case_.title,
              description: case_.description,
              category: case_.category,
              urgency: case_.urgency,
              estimatedTime: case_.estimatedTime,
              createdAt: case_.createdAt
            },
            timestamp: new Date()
          });
        }

        // Email
        if (lawyer.email) {
          this.logger.log(`Email nouveau cas envoyé à ${lawyer.email}`);
          await this.emailService.sendNewCaseNotificationToLawyers(lawyer.email, lawyer.name, {
            ...case_,
            paymentAmount: case_.paymentAmount
          });
        }

        this.logger.log(`Avocat ${lawyerId} notifié du nouveau cas ${case_.id}`);
      } else {
        // Notifier tous les avocats actifs (méthode existante)
        await this.notifyNewCase(case_);
      }
    } catch (error) {
      this.logger.error(`Erreur notification avocat nouveau cas: ${error.message}`);
    }
  }

  /**
   * Notifier un avocat qu'un cas lui a été assigné
   */
  async notifyLawyerCaseAssigned(case_: Case, lawyer: Lawyer) {
    try {
      // WebSocket
      const socket = this.connectedLawyers.get(lawyer.id);
      if (socket) {
        socket.emit('caseAssigned', {
          type: 'CASE_ASSIGNED',
          case: {
            id: case_.id,
            title: case_.title,
            description: case_.description,
            category: case_.category,
            trackingCode: case_.trackingCode
          },
          timestamp: new Date()
        });
      }

      // Email
      if (lawyer.email) {
        this.logger.log(`Email cas assigné envoyé à ${lawyer.email}`);
        await this.emailService.sendCaseAssignedNotificationToLawyer(lawyer.email, lawyer.name, case_);
      }

      this.logger.log(`Avocat ${lawyer.id} notifié de l'assignation du cas ${case_.id}`);
    } catch (error) {
      this.logger.error(`Erreur notification avocat cas assigné: ${error.message}`);
    }
  }

  /**
   * Notifier un avocat qu'il a reçu un message
   */
  async notifyLawyerNewMessage(case_: Case, citizenName: string, messageContent: string) {
    try {
      if (!case_.lawyerId) return;

      const lawyer = await this.lawyerRepository.findOne({
        where: { _id: case_.lawyerId as any }
      });

      if (!lawyer) return;

      // WebSocket
      const socket = this.connectedLawyers.get(lawyer.id);
      if (socket) {
        socket.emit('newMessage', {
          type: 'NEW_MESSAGE',
          caseId: case_.id,
          caseTitle: case_.title,
          citizenName: citizenName,
          messagePreview: messageContent.substring(0, 100),
          timestamp: new Date()
        });
      }

      // Email
      if (lawyer.email) {
        this.logger.log(`Email nouveau message envoyé à ${lawyer.email}`);
        // TODO: Envoyer email
      }

      this.logger.log(`Avocat ${lawyer.id} notifié d'un nouveau message`);
    } catch (error) {
      this.logger.error(`Erreur notification avocat nouveau message: ${error.message}`);
    }
  }

  /**
   * Notifier un avocat qu'un paiement a été effectué sur un cas
   */
  async notifyLawyerPaymentReceived(case_: Case) {
    try {
      if (!case_.lawyerId) return;

      const lawyer = await this.lawyerRepository.findOne({
        where: { _id: case_.lawyerId as any }
      });

      if (!lawyer) return;

      // WebSocket
      const socket = this.connectedLawyers.get(lawyer.id);
      if (socket) {
        socket.emit('paymentReceived', {
          type: 'PAYMENT_RECEIVED',
          caseId: case_.id,
          amount: case_.paymentAmount,
          timestamp: new Date()
        });
      }

      // Email
      if (lawyer.email) {
        this.logger.log(`Email paiement reçu envoyé à ${lawyer.email}`);
        // TODO: Envoyer email
      }

      this.logger.log(`Avocat ${lawyer.id} notifié du paiement du cas ${case_.id}`);
    } catch (error) {
      this.logger.error(`Erreur notification avocat paiement: ${error.message}`);
    }
  }
}