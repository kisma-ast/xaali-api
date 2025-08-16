import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find();
  }

  findOne(id: number): Promise<Notification | null> {
    return this.notificationsRepository.findOneBy({ id });
  }

  create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = this.notificationsRepository.create(notification);
    return this.notificationsRepository.save(newNotification);
  }

  async update(id: number, notification: Partial<Notification>): Promise<Notification | null> {
    await this.notificationsRepository.update(id, notification);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.notificationsRepository.delete(id);
  }
} 