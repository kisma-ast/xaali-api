import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayTechService } from './paytech.service';
import { PayTechController } from './paytech.controller';
import { NotificationService } from './notification.service';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Consultation } from './consultation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Lawyer, Consultation])],
  controllers: [PayTechController],
  providers: [PayTechService, NotificationService],
  exports: [PayTechService],
})
export class PayTechModule {}