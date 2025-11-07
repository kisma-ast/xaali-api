import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { EmailService } from './email.service';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Case, Lawyer])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, CasesService],
})
export class NotificationsModule {} 