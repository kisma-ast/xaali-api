import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private connectedLawyers = new Map<string, any>(); // WebSocket connections

  constructor(
    @InjectRepository(Lawyer)
    private lawyerRepository: Repository<Lawyer>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

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

      // Envoyer notification via WebSocket aux avocats connectés
      for (const lawyer of activeLawyers) {
        const socket = this.connectedLawyers.get(lawyer.id);
        if (socket) {
          socket.emit('newCase', notification);
          notifiedCount++;
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
}