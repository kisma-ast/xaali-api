import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
// import { LawyerNotification } from './lawyer-notification.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
    @InjectRepository(Lawyer)
    private lawyersRepository: Repository<Lawyer>,
    // @InjectRepository(LawyerNotification)
    // private notificationsRepository: Repository<LawyerNotification>,
  ) {}

  findAll(): Promise<Case[]> {
    return this.casesRepository.find({
      relations: ['citizen', 'lawyer'],
    });
  }

  async findOne(id: string): Promise<Case | null> {
    try {
      return await this.casesRepository.findOne({
        where: { _id: id as any },
        relations: ['citizen', 'lawyer'],
      });
    } catch (error) {
      console.error('Erreur findOne case:', error);
      return null;
    }
  }

  async create(caseData: Partial<Case>): Promise<Case> {
    const newCase = this.casesRepository.create(caseData);
    const savedCase = await this.casesRepository.save(newCase);
    
    // Notifier tous les avocats du nouveau cas
    await this.notifyAllLawyers(savedCase.id);
    
    return savedCase;
  }

  async update(id: string, caseData: Partial<Case>): Promise<Case | null> {
    try {
      await this.casesRepository.update({ _id: id as any }, caseData);
      return this.findOne(id);
    } catch (error) {
      console.error('Erreur update case:', error);
      return null;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.casesRepository.delete({ _id: id as any });
    } catch (error) {
      console.error('Erreur remove case:', error);
    }
  }

  async getPendingCases(): Promise<Case[]> {
    return this.casesRepository.find({
      where: { status: 'pending' },
      relations: ['citizen'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCasesByLawyer(lawyerId: string): Promise<Case[]> {
    return this.casesRepository.find({
      where: { lawyerId },
      relations: ['citizen'],
      order: { createdAt: 'DESC' },
    });
  }

  async assignLawyer(caseId: string, lawyerId: string): Promise<Case> {
    try {
      const case_ = await this.findOne(caseId);
      if (!case_) {
        throw new Error('Case not found');
      }

      case_.lawyerId = lawyerId;
      case_.status = 'accepted';
      case_.acceptedAt = new Date();
      
      return await this.casesRepository.save(case_);
    } catch (error) {
      console.error('Erreur assignLawyer:', error);
      throw error;
    }
  }

  async createBeforePayment(caseData: Partial<Case>): Promise<Case> {
    console.log('💾 [CASES-SERVICE] Création cas avant paiement');
    console.log('📋 [CASES-SERVICE] Données:', JSON.stringify(caseData, null, 2));
    
    const newCase = this.casesRepository.create({
      ...caseData,
      isPaid: false,
      status: 'pending'
    });
    
    console.log('💾 [CASES-SERVICE] Entité créée:', JSON.stringify(newCase, null, 2));
    
    const savedCase = await this.casesRepository.save(newCase);
    
    console.log('✅ [CASES-SERVICE] Cas sauvegardé avec ID:', savedCase.id);
    
    return savedCase;
  }

  async updatePaymentStatus(caseId: string, paymentData: {
    paymentId: string;
    paymentAmount: number;
    isPaid: boolean;
  }): Promise<Case | null> {
    try {
      const case_ = await this.findOne(caseId);
      if (!case_) {
        throw new Error('Case not found');
      }

      case_.paymentId = paymentData.paymentId;
      case_.paymentAmount = paymentData.paymentAmount;
      case_.isPaid = paymentData.isPaid;
      
      const updatedCase = await this.casesRepository.save(case_);
      
      // Si le paiement est confirmé, notifier les avocats
      if (paymentData.isPaid) {
        await this.notifyAllLawyers(updatedCase.id);
      }
      
      return updatedCase;
    } catch (error) {
      console.error('Erreur updatePaymentStatus:', error);
      throw error;
    }
  }

  private async notifyAllLawyers(caseId: string): Promise<void> {
    // Notification simplifiée - à implémenter avec WebSocket
    console.log(`Nouveau cas ${caseId} à notifier aux avocats`);
  }

  // Méthodes de notification temporairement désactivées
  // async getLawyerNotifications(lawyerId: string): Promise<LawyerNotification[]> {
  //   return [];
  // }

  // async markNotificationAsRead(notificationId: string): Promise<void> {
  //   // Implémentation à venir
  // }

  // async acceptCase(notificationId: string, lawyerId: string): Promise<Case> {
  //   return await this.assignLawyer(caseId, lawyerId);
  // }
} 