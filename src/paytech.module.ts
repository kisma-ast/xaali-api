import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayTechService } from './paytech.service';
import { PayTechController } from './paytech.controller';
import { EmailService } from './email.service';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Consultation } from './consultation.entity';
import { Citizen } from './citizen.entity';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Lawyer, Consultation, Citizen]),
    NotificationModule, // Importer NotificationModule pour avoir accès à NotificationService
  ],
  controllers: [PayTechController],
  providers: [PayTechService, EmailService],
  exports: [PayTechService],
})
export class PayTechModule {}