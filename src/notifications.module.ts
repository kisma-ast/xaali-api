import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { EmailService } from './email.service';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Case, Lawyer]),
    NotificationModule // Importer pour avoir accès à NotificationService
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, CasesService],
})
export class NotificationsModule {} 