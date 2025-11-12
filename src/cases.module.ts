import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { LawyerNotification } from './lawyer-notification.entity';
import { NotificationModule } from './notification.module';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Lawyer, LawyerNotification]),
    NotificationModule, // Importer NotificationModule pour avoir accès à NotificationService
  ],
  controllers: [CasesController],
  providers: [CasesService, EmailService],
})
export class CasesModule {} 