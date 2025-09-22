import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { LawyerNotification } from './lawyer-notification.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
    @InjectRepository(Lawyer)
    private lawyersRepository: Repository<Lawyer>,
    @InjectRepository(LawyerNotification)
    private notificationsRepository: Repository<LawyerNotification>,
  ) {}

  findAll(): Promise<Case[]> {
    return this.casesRepository.find({
      relations: ['citizen', 'lawyer'],
    });
  }

  findOne(id: number): Promise<Case | null> {
    return this.casesRepository.findOne({
      where: { id },
      relations: ['citizen', 'lawyer'],
    });
  }

  async create(caseData: Partial<Case>): Promise<Case> {
    const newCase = this.casesRepository.create(caseData);
    const savedCase = await this.casesRepository.save(newCase);
    
    // Notifier tous les avocats du nouveau cas
    await this.notifyAllLawyers(savedCase.id);
    
    return savedCase;
  }

  async update(id: number, caseData: Partial<Case>): Promise<Case | null> {
    await this.casesRepository.update(id, caseData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.casesRepository.delete(id);
  }

  async getPendingCases(): Promise<Case[]> {
    return this.casesRepository.find({
      where: { status: 'pending' },
      relations: ['citizen'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCasesByLawyer(lawyerId: number): Promise<Case[]> {
    return this.casesRepository.find({
      where: { lawyerId },
      relations: ['citizen'],
      order: { createdAt: 'DESC' },
    });
  }

  async assignLawyer(caseId: number, lawyerId: number): Promise<Case> {
    const case_ = await this.findOne(caseId);
    if (!case_) {
      throw new Error('Case not found');
    }

    case_.lawyerId = lawyerId;
    case_.assignedLawyerId = lawyerId;
    case_.status = 'assigned';
    
    return await this.casesRepository.save(case_);
  }

  private async notifyAllLawyers(caseId: number): Promise<void> {
    const lawyers = await this.lawyersRepository.find();
    
    for (const lawyer of lawyers) {
      const notification = this.notificationsRepository.create({
        lawyerId: Number(lawyer.id),
        caseId,
        type: 'new_case',
        isRead: false,
        isAccepted: false,
      });
      
      await this.notificationsRepository.save(notification);
    }
  }

  async getLawyerNotifications(lawyerId: number): Promise<LawyerNotification[]> {
    return this.notificationsRepository.find({
      where: { lawyerId },
      relations: ['case', 'case.citizen'],
      order: { createdAt: 'DESC' },
    });
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.notificationsRepository.update(notificationId, { isRead: true });
  }

  async acceptCase(notificationId: number, lawyerId: number): Promise<Case> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
      relations: ['case'],
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Marquer la notification comme acceptée
    notification.isAccepted = true;
    await this.notificationsRepository.save(notification);

    // Assigner le cas à l'avocat
    return await this.assignLawyer(notification.case.id, lawyerId);
  }
} 