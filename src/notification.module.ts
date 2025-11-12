import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lawyer, Case, Citizen])],
  providers: [NotificationService, EmailService],
  exports: [NotificationService], // Exporter pour utilisation dans d'autres modules
})
export class NotificationModule {}

