import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayTechService } from './paytech.service';
import { PayTechController } from './paytech.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Consultation } from './consultation.entity';
import { Citizen } from './citizen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Lawyer, Consultation, Citizen])],
  controllers: [PayTechController],
  providers: [PayTechService, NotificationService, EmailService],
  exports: [PayTechService],
})
export class PayTechModule {}