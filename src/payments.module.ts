import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './payment.entity';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { BictorysModule } from './bictorys.module';
import { PayTechModule } from './paytech.module';
import { SimplifiedCaseService } from './simplified-case.service';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Case, Lawyer]), BictorysModule, PayTechModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SimplifiedCaseService, EmailService],
})
export class PaymentsModule { } 